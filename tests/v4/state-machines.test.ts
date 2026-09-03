import { describe, it, expect } from 'vitest';
import { repo } from '@/lib/db/repo-v4';

describe('R04 / PRD §40: Domain State Machines & Staleness Invariants', () => {
  it('records mapping decision overrides and captures audit trail', () => {
    const user = repo.getState().users.find((u) => u.role === 'senior')!;
    const dec = repo.getState().mappingDecisions.find((d) => d.sourceAccountCode === '2199-00')!;

    const updated = repo.updateMappingDecision({
      decisionId: dec.id,
      action: 'override',
      targetLineId: 'WP-F.4',
      reason: 'Direklasifikasi ke Beban Lain-lain',
      actor: user,
    });

    expect(updated.status).toBe('mapped');
    expect(updated.effectiveTarget).toBe('WP-F.4');
    expect(updated.overrideReason).toBe('Direklasifikasi ke Beban Lain-lain');
  });

  it('marks workpapers stale when upstream mappings change', () => {
    const user = repo.getState().users.find((u) => u.role === 'senior')!;
    const dec = repo.getState().mappingDecisions[0];

    repo.updateMappingDecision({
      decisionId: dec.id,
      action: 'override',
      targetLineId: 'WP-A.1',
      reason: 'Penyesuaian kas kecil',
      actor: user,
    });

    const wp = repo.getState().workpaperVersions[0];
    expect(wp.isStale).toBe(true);
    expect(wp.staleReason).toContain('Perubahan pemetaan');
  });

  it('recalculating workpaper clears stale status and issues new version', () => {
    const user = repo.getState().users.find((u) => u.role === 'senior')!;
    const prevVersionNumber = repo.getState().workpaperVersions[0].versionNumber;

    const recalculated = repo.recalculateWorkpaper('ENG-2026-01', user);

    expect(recalculated.isStale).toBe(false);
    expect(recalculated.versionNumber).toBeGreaterThan(prevVersionNumber);
  });
});
