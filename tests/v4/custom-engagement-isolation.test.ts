import { describe, expect, it } from 'vitest';
import { repo } from '@/lib/db/repo-v4';
import { extractFinancialInputs } from '@/lib/advisory/custom-engagement';

describe('custom engagement data isolation', () => {
  it('does not bind the Mandiri workspace to the SRI demo client', () => {
    const state = repo.getState();
    const engagement = state.engagements.find((item) => item.id === 'ENG-MANDIRI-2026');
    const client = state.clients.find((item) => item.id === engagement?.clientId);

    expect(engagement).toBeDefined();
    expect(client?.code).toBe('MNDR');
    expect(client?.legalName).toBe('PT Klien Mandiri');
    expect(client?.legalName).not.toContain('Surya Retail');
  });

  it('derives advisory inputs only from the active workpaper lines', () => {
    const lines = [
      { lineId: 'WP-A.1', currentPeriodIdr: 415_000_000 },
      { lineId: 'WP-A.2', currentPeriodIdr: 275_000_000 },
      { lineId: 'WP-A.4', currentPeriodIdr: 350_000_000 },
      { lineId: 'WP-C.1', currentPeriodIdr: 310_000_000 },
      { lineId: 'WP-C.2', currentPeriodIdr: 65_000_000 },
      { lineId: 'WP-C.3', currentPeriodIdr: 0 },
      { lineId: 'WP-F.1', currentPeriodIdr: 520_000_000 },
      { lineId: 'WP-F.2', currentPeriodIdr: 0 },
      { lineId: 'WP-F.3', currentPeriodIdr: 310_000_000 },
    ];

    const inputs = extractFinancialInputs(lines, {
      totalAssetsIdr: 1_805_000_000,
      totalLiabilitiesIdr: 775_000_000,
      totalEquityIdr: 1_030_000_000,
      netIncomeIdr: 210_000_000,
    });

    expect(inputs).toEqual({
      currentAssetsIdr: 1_040_000_000,
      inventoryIdr: 350_000_000,
      cashAndEquivalentsIdr: 415_000_000,
      currentLiabilitiesIdr: 375_000_000,
      totalLiabilitiesIdr: 775_000_000,
      totalEquityIdr: 1_030_000_000,
      totalAssetsIdr: 1_805_000_000,
      revenueIdr: 520_000_000,
      grossProfitIdr: 520_000_000,
      operatingProfitIdr: 210_000_000,
      netProfitIdr: 210_000_000,
    });
  });
});
