import { describe, expect, it } from 'vitest';
import { inferLeadScheduleTarget } from '@/lib/workpaper/infer-target';

describe('lead schedule target inference', () => {
  it.each([
    ['110100', 'Kas dan Bank', 'WP-A.1'],
    ['110200', 'Piutang Usaha', 'WP-A.2'],
    ['110300', 'Persediaan', 'WP-A.4'],
    ['130100', 'Aset Tetap', 'WP-B.1'],
    ['130200', 'Akumulasi Penyusutan', 'WP-B.2'],
    ['210200', 'Utang Pajak', 'WP-C.2'],
    ['220100', 'Pinjaman Bank', 'WP-D.1'],
    ['410100', 'Pendapatan Jasa Konsultasi', 'WP-F.1'],
    ['510200', 'Beban Sewa', 'WP-F.3'],
  ])('maps %s %s to %s', (code, name, expected) => {
    expect(inferLeadScheduleTarget(code, name)).toBe(expected);
  });
});
