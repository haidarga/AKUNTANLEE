import * as XLSX from 'xlsx';

const TRIAL_BALANCE_NAME_PATTERN = /neraca.?saldo|trial.?balance|^tb$|^neraca$/i;
const TRIAL_BALANCE_HEADER_PATTERN = /kode.?akun|nama.?akun|account.?code|account.?name|^debit$|^kredit$|^credit$/i;

/**
 * Name-only variant for callers that only have the sheet name list (e.g.
 * rehydrating from previously-saved file metadata, without the raw
 * workbook bytes available to inspect header rows).
 */
export function guessTrialBalanceSheetNameFromList(sheetNames: string[]): string {
  return sheetNames.find((name) => TRIAL_BALANCE_NAME_PATTERN.test(name)) || sheetNames[0];
}

/**
 * Real-world workbooks often lead with a cover/instructions sheet (e.g.
 * "Panduan Testing") before the actual trial balance tab, so blindly
 * defaulting to workbook.SheetNames[0] silently imports the wrong sheet.
 * Prefer a sheet whose name looks like a trial balance, then a sheet whose
 * header row looks like one, falling back to the first sheet only when
 * nothing matches.
 */
export function guessTrialBalanceSheetName(workbook: XLSX.WorkBook): string {
  const byName = workbook.SheetNames.find((name) => TRIAL_BALANCE_NAME_PATTERN.test(name));
  if (byName) return byName;

  for (const name of workbook.SheetNames) {
    const sheet = workbook.Sheets[name];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, range: 0, blankrows: false }).slice(0, 3);
    const headerMatches = rows.some((row) =>
      Array.isArray(row) && row.filter((cell) => TRIAL_BALANCE_HEADER_PATTERN.test(String(cell || ''))).length >= 2
    );
    if (headerMatches) return name;
  }

  return workbook.SheetNames[0];
}
