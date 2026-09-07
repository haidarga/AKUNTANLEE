import { EmployeePayrollProfile, calculateAnnualPph21Pasal17, calculateMonthlyPph21, getPtkpAnnualAmount } from './pph21';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

export interface PayrollTaxData {
  monthlyList: ReturnType<typeof calculateMonthlyPph21>[];
  totalMonthlyWithholdingIdr: number;
  annualReconciliationList: Array<{
    employeeId: string;
    employeeName: string;
    annualGrossIncomeIdr: number;
    biayaJabatanIdr: number;
    netIncomeIdr: number;
    ptkpAmountIdr: number;
    taxableIncomeIdr: number;
    annualPph21TarifPasal17Idr: number;
    totalPph21TerJanToNovIdr: number;
    decemberPph21Idr: number;
  }>;
  totalAnnualWithholdingIdr: number;
}

/** Build all PPh 21 views from the imported engagement payroll only. */
export function buildPayrollTaxData(employees: EmployeePayrollProfile[]): PayrollTaxData {
  const monthlyList = employees.map((employee) => calculateMonthlyPph21(employee));
  const annualReconciliationList = employees.map((employee) => {
    const annualGrossIncomeIdr = (employee.monthlyGrossSalaryIdr + employee.monthlyAllowanceIdr) * 12;
    const biayaJabatanIdr = Math.min(6_000_000, annualGrossIncomeIdr * 0.05);
    const netIncomeIdr = annualGrossIncomeIdr - biayaJabatanIdr;
    const ptkpAmountIdr = getPtkpAnnualAmount(employee.ptkpStatus);
    const taxableIncomeIdr = Math.max(0, netIncomeIdr - ptkpAmountIdr);
    const annualPph21TarifPasal17Idr = calculateAnnualPph21Pasal17(taxableIncomeIdr);
    const totalPph21TerJanToNovIdr = (monthlyList.find((item) => item.employeeId === employee.id)?.monthlyPph21Idr || 0) * 11;
    return {
      employeeId: employee.id,
      employeeName: employee.name,
      annualGrossIncomeIdr,
      biayaJabatanIdr,
      netIncomeIdr,
      ptkpAmountIdr,
      taxableIncomeIdr,
      annualPph21TarifPasal17Idr,
      totalPph21TerJanToNovIdr,
      decemberPph21Idr: Math.max(0, annualPph21TarifPasal17Idr - totalPph21TerJanToNovIdr),
    };
  });

  return {
    monthlyList,
    totalMonthlyWithholdingIdr: monthlyList.reduce((total, item) => total + item.monthlyPph21Idr, 0),
    annualReconciliationList,
    totalAnnualWithholdingIdr: annualReconciliationList.reduce((total, item) => total + item.annualPph21TarifPasal17Idr, 0),
  };
}

export async function getEngagementPayroll(engagementId: string, firmId: string): Promise<EmployeePayrollProfile[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('engagements')
    .select('metadata')
    .eq('id', engagementId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error || !data) return null;

  const employees = data.metadata?.finovaPayroll?.employees;
  return Array.isArray(employees) ? employees : null;
}

/**
 * Payroll is stored against the engagement in Supabase, never in browser
 * localStorage. A failed durable write is surfaced to the caller as failure.
 */
export async function saveEngagementPayroll(
  engagementId: string,
  firmId: string,
  employees: EmployeePayrollProfile[],
): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;
  const supabase = getSupabase();
  if (!supabase) return false;

  const { data: existing, error: readError } = await supabase
    .from('engagements')
    .select('metadata')
    .eq('id', engagementId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (readError || !existing) return false;

  const metadata = {
    ...(existing.metadata || {}),
    finovaPayroll: {
      employees,
      importedAt: new Date().toISOString(),
      schemaVersion: 1,
    },
  };
  const { error: writeError } = await supabase
    .from('engagements')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', engagementId)
    .eq('firm_id', firmId);
  return !writeError;
}
