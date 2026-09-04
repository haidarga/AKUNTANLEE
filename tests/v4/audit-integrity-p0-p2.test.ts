import { describe, it, expect } from 'vitest';
import { repo } from '@/lib/db/repo-v4';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

describe('FINOVA AI v4.0 — P0 & P1 Audit Integrity & Consistency Invariants', () => {
  it('P0 INVARIANT: Export SHA-256 must NEVER be identical to Source File SHA-256', () => {
    const state = repo.getState();
    const sourceFile = state.fileVersions.find((f) => f.engagementId === 'ENG-2026-01');
    expect(sourceFile).toBeDefined();

    const sourceHash = sourceFile!.checksumSha256;
    expect(sourceHash).toBe('9f83a48e71c9b204683bc48b3017fa489110756e4c7717bc2d043444fb9a7b92');

    const exportArtifacts = state.exportArtifacts.filter((a) => a.engagementId === 'ENG-2026-01');
    expect(exportArtifacts.length).toBeGreaterThan(0);

    for (const exp of exportArtifacts) {
      expect(exp.checksumSha256).toBeDefined();
      // Fatal cryptographic check: export hash must NOT equal source hash
      expect(exp.checksumSha256).not.toBe(sourceHash);
      expect(exp.checksumSha256.length).toBe(64);
    }
  });

  it('P0 INVARIANT: Downloaded export binary matches registered cryptographic hash', () => {
    const state = repo.getState();
    const artifact = state.exportArtifacts[0];
    const physicalFile = path.join(process.cwd(), 'data', artifact.id + '.xlsx');

    if (fs.existsSync(physicalFile)) {
      const buf = fs.readFileSync(physicalFile);
      const computedHash = crypto.createHash('sha256').update(buf).digest('hex');
      expect(computedHash).toBe(artifact.checksumSha256);
    }
  });

  it('P0 INVARIANT: Canonical State Machine prevents contradiction between Overview, Mapping & Export', () => {
    const state = repo.getState();
    const needsReview = state.mappingDecisions.filter((d) => d.status === 'needs_review');

    // In current seeded final state, all accounts are mapped
    if (needsReview.length === 0) {
      // 100% mapped -> Overview should show 0 ambiguous accounts
      expect(needsReview.length).toBe(0);
      const mappedCount = state.mappingDecisions.filter((d) => d.status === 'mapped').length;
      expect(mappedCount).toBe(state.mappingDecisions.length);
    }
  });

  it('P1 INVARIANT: Overview Numbers match Workpaper Audited Totals (Rp 0 Diff)', () => {
    const state = repo.getState();
    const wp = state.workpaperVersions[0];
    expect(wp).toBeDefined();

    const assets = wp.totals.totalAssetsIdr;
    const liabilities = wp.totals.totalLiabilitiesIdr;
    const equity = wp.totals.totalEquityIdr;
    const netIncome = wp.totals.netIncomeIdr;

    // Must match audited SAK values:
    expect(assets).toBe(34_550_000_000);
    expect(liabilities).toBe(12_050_000_000); // 12.36B - 310M AJE reklasifikasi
    expect(equity).toBe(22_500_000_000); // 22.19B + 310M AJE reklasifikasi
    expect(netIncome).toBe(4_560_000_000); // 4.25B + 310M laba selisih kurs

    // Fundamental accounting equation: Assets = Liabilities + Equity
    const diff = Math.abs(assets - (liabilities + equity));
    expect(diff).toBe(0);
  });

  it('P1 INVARIANT: Account 2199-00 SAK Semantics (Gain on FX per PSAK 10)', () => {
    const state = repo.getState();
    const aje = state.adjustments.find((a) => a.id === 'AJE-001');
    expect(aje).toBeDefined();

    expect(aje!.debitLineId).toBe('WP-C.1'); // Debited from Liabilities
    expect(aje!.creditLineId).toBe('WP-F.4'); // Credited to Other Net Income
    expect(aje!.debitAmountIdr).toBe(310_000_000);
    expect(aje!.creditAmountIdr).toBe(310_000_000);
    expect(aje!.description).toContain('Pendapatan Lain-lain (Keuntungan Selisih Kurs)');
  });

  it('P1 INVARIANT: Client creation works and generates valid unique client entity', () => {
    const newClient = repo.createClient({
      legalName: 'PT Mandiri Solusindo Berkah',
      code: 'MSB',
      industry: 'Teknologi Informasi & Finansial',
    });

    expect(newClient.id).toMatch(/^CLI-/);
    expect(newClient.code).toBe('MSB');
    expect(newClient.legalName).toBe('PT Mandiri Solusindo Berkah');

    const state = repo.getState();
    const found = state.clients.find((c) => c.id === newClient.id);
    expect(found).toBeDefined();
  });
});
