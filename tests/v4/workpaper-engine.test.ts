import { describe, it, expect } from 'vitest';
import { repo } from '@/lib/db/repo-v4';
import { calculateWorkpaperVersion, APPROVED_LEAD_SCHEDULE_TEMPLATE } from '@/lib/workpaper/engine';

describe('R05, R06 / PRD §44, §45: Workpaper Population & Evidence Lineage', () => {
  it('calculates lead schedule and verifies 100% balanced tie-outs on standard fixtures', () => {
    const state = repo.getState();
    const result = calculateWorkpaperVersion({
      tenantId: 'TENANT-001',
      engagementId: 'ENG-2025-01',
      datasetVersionId: 'DSV-001',
      mappingSetId: 'MAPSET-001',
      accounts: state.accounts,
      mappingDecisions: state.mappingDecisions,
      template: APPROVED_LEAD_SCHEDULE_TEMPLATE,
    });

    // Verify Tie-out check 1: TB Balance
    const tbCheck = result.checks.find((c) => c.ruleId === 'RULE-TIE-OUT-TB-DEBIT-CREDIT');
    expect(tbCheck?.status).toBe('pass');
    expect(tbCheck?.difference).toBe(0);

    // Verify Tie-out check 2: Balance sheet equation
    const bsCheck = result.checks.find((c) => c.ruleId === 'RULE-BALANCE-SHEET-EQUATION');
    expect(bsCheck?.status).toBe('pass');
    expect(bsCheck?.difference).toBe(0);

    // Verify lines populated
    expect(result.lines.length).toBe(APPROVED_LEAD_SCHEDULE_TEMPLATE.lines.length);

    // Verify Evidence Link exists for Cash line
    const cashLine = result.lines.find((l) => l.lineId === 'WP-A.1');
    expect(cashLine?.primaryEvidenceLinkId).toBeDefined();

    const ev = result.evidenceLinks.find((e) => e.targetLineId === 'WP-A.1');
    expect(ev).toBeDefined();
    expect(ev?.sheetName).toBe('Trial Balance');
    expect(ev?.cellRange).toBeDefined();
    expect(ev?.transformChain.length).toBeGreaterThan(0);
  });
});
