import { describe, expect, it } from 'vitest';
import { repo } from '@/lib/db/repo-v4';
import { buildPayrollTaxData } from '@/lib/tax/payroll-store';
import { resolveAdvisoryEngagementContext } from '@/lib/advisory/engagement-context';

describe('production data integrity regressions', () => {
  it('recalculates an adjustment using only the active engagement accounts', () => {
    const state = repo.getState();
    const engagementId = 'ENG-TEST-ADJUSTMENT-ISOLATION';
    const clientId = 'CLI-TEST-ADJUSTMENT-ISOLATION';
    const senior = state.users.find((user) => user.role === 'senior')!;

    state.clients.push({
      id: clientId,
      tenantId: senior.tenantId,
      legalName: 'PT Uji Isolasi',
      code: 'ISO',
      industry: 'Jasa & Konsultasi',
      status: 'active',
      createdAt: new Date().toISOString(),
    });
    state.engagements.push({
      id: engagementId,
      tenantId: senior.tenantId,
      clientId,
      name: 'Audit PT Uji Isolasi',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
      currency: 'IDR',
      materialityIdr: 1_000_000,
      status: 'preparing',
      leadPartnerId: senior.id,
      managerId: senior.id,
      seniorId: senior.id,
      preparerId: senior.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    state.datasetVersions.push({
      id: `DSV-${engagementId}`,
      tenantId: senior.tenantId,
      engagementId,
      importJobId: 'IMP-TEST',
      fileVersionId: 'FV-TEST',
      datasetType: 'trial_balance',
      rowCount: 2,
      totals: { totalDebitIdr: 1000, totalCreditIdr: 1000, isBalanced: true },
      checksumSha256: 'test',
      createdAt: new Date().toISOString(),
    } as any);
    state.mappingSets.push({ id: `MAPSET-${engagementId}`, tenantId: senior.tenantId, engagementId, versionNumber: 1, status: 'active', createdAt: new Date().toISOString() } as any);
    state.accounts.push(
      { id: 'ISO-CASH', tenantId: senior.tenantId, datasetVersionId: `DSV-${engagementId}`, engagementId, accountCode: '110100', accountName: 'Kas', closingBalanceIdr: 1000 } as any,
      { id: 'ISO-CAPITAL', tenantId: senior.tenantId, datasetVersionId: `DSV-${engagementId}`, engagementId, accountCode: '310100', accountName: 'Modal', closingBalanceIdr: -1000 } as any,
    );
    state.mappingDecisions.push(
      { id: 'ISO-MAP-CASH', tenantId: senior.tenantId, mappingSetId: `MAPSET-${engagementId}`, accountRowId: 'ISO-CASH', sourceAccountCode: '110100', sourceAccountName: 'Kas', amountIdr: 1000, proposedTarget: 'WP-A.1', effectiveTarget: 'WP-A.1', confidenceScore: 1, confidenceLevel: 'high', rationale: 'test', status: 'mapped', isMaterial: false },
      { id: 'ISO-MAP-CAPITAL', tenantId: senior.tenantId, mappingSetId: `MAPSET-${engagementId}`, accountRowId: 'ISO-CAPITAL', sourceAccountCode: '310100', sourceAccountName: 'Modal', amountIdr: -1000, proposedTarget: 'WP-E.1', effectiveTarget: 'WP-E.1', confidenceScore: 1, confidenceLevel: 'high', rationale: 'test', status: 'mapped', isMaterial: false },
    );

    repo.createAdjustmentEntry({
      tenantId: senior.tenantId,
      engagementId,
      entryNumber: 1,
      type: 'adjustment',
      referenceWp: 'WP-A.1/WP-E.1',
      description: 'AJE isolated test',
      standardReference: 'PSAK 1',
      debitLineId: 'WP-A.1',
      debitAmountIdr: 1,
      creditLineId: 'WP-E.1',
      creditAmountIdr: 1,
      preparedByUserId: senior.id,
      preparedByName: senior.name,
      status: 'draft',
    }, senior);

    const lines = repo.getState().workpaperLines;
    expect(lines.find((line) => line.lineId === 'WP-A.1')?.currentPeriodIdr).toBe(1000);
    expect(lines.find((line) => line.lineId === 'WP-E.1')?.currentPeriodIdr).toBe(-1000);
    expect(lines.every((line) => Math.abs(line.currentPeriodIdr) <= 1000)).toBe(true);
  });

  it('builds PPh 21 data from the persisted engagement payroll, not demo employees', () => {
    const data = buildPayrollTaxData([
      { id: 'PAY-1', name: 'Dewi QA', position: 'Konsultan', ptkpStatus: 'TK/0', terCategory: 'A', monthlyGrossSalaryIdr: 8_000_000, monthlyAllowanceIdr: 500_000, bpjsKetenagakerjaanPaidByCompanyIdr: 200_000, bpjsKesehatanPaidByCompanyIdr: 100_000 },
    ]);

    expect(data.monthlyList).toHaveLength(1);
    expect(data.monthlyList[0].employeeName).toBe('Dewi QA');
    expect(data.totalMonthlyWithholdingIdr).toBeGreaterThan(0);
  });

  it('uses the active engagement client industry for advisory narratives', () => {
    expect(resolveAdvisoryEngagementContext({
      engagement: { name: 'Audit PT Cakrawala Konsultan Indonesia QA' },
      client: { legalName: 'PT Cakrawala Konsultan Indonesia QA', industry: 'Jasa & Konsultasi' },
    })).toEqual({
      clientName: 'PT Cakrawala Konsultan Indonesia QA',
      industry: 'Jasa & Konsultasi',
    });
  });
});
