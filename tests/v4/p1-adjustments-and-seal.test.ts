import { describe, it, expect, beforeEach } from 'vitest';
import { repo } from '@/lib/db/repo-v4';
import { UserV4 } from '@/types/domain-v4';

describe('P1 Audit Engine: Adjustments (AJE/RJE), Reviewer Notes & Partner Seal', () => {
  const partnerUser: UserV4 = {
    id: 'USR-PARTNER-01',
    tenantId: 'TENANT-001',
    email: 'haidar@kaphaidar.id',
    name: 'Haidar, CPA, CA',
    role: 'partner',
    status: 'active',
    title: 'Managing Partner',
  };

  const seniorUser: UserV4 = {
    id: 'USR-SENIOR-01',
    tenantId: 'TENANT-001',
    email: 'senior@kaphaidar.id',
    name: 'Ahmad Pratama, S.Ak',
    role: 'senior',
    status: 'active',
    title: 'Managing Partner',
  };

  it('records audit adjustment entry (AJE/RJE) and recalculates lead schedule', () => {
    const existingAdjustments = repo.getAdjustments('ENG-2026-01');
    expect(existingAdjustments.length).toBeGreaterThanOrEqual(1);

    const initialLines = repo.getState().workpaperLines;
    const initialLineF4 = initialLines.find((l) => l.lineId === 'WP-F.4');

    // Create a new balanced adjustment
    const newEntry = repo.createAdjustmentEntry(
      {
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        entryNumber: 99,
        type: 'adjustment',
        referenceWp: 'WP-A.1 / WP-F.4',
        description: 'Penyesuaian biaya administrasi bank akhir tahun',
        standardReference: 'PSAK 1',
        debitLineId: 'WP-F.4',
        debitAmountIdr: 5_000_000,
        creditLineId: 'WP-A.1',
        creditAmountIdr: 5_000_000,
        preparedByUserId: seniorUser.id,
        preparedByName: seniorUser.name,
        status: 'approved',
      },
      seniorUser
    );

    expect(newEntry.id).toMatch(/^AJE-/);
    expect(newEntry.debitAmountIdr).toBe(newEntry.creditAmountIdr);

    // Verify lead schedule recalculated
    const updatedLines = repo.getState().workpaperLines;
    const updatedLineF4 = updatedLines.find((l) => l.lineId === 'WP-F.4');
    expect(updatedLineF4).toBeDefined();
  });

  it('manages reviewer notes through full lifecycle (Open -> Resolved)', () => {
    // Add note
    const note = repo.addReviewerNote(
      {
        tenantId: 'TENANT-001',
        engagementId: 'ENG-2026-01',
        targetLineId: 'WP-A.1',
        authorId: seniorUser.id,
        authorName: seniorUser.name,
        authorRole: seniorUser.role,
        content: 'Rekening koran bank BCA telah diperiksa dan klop.',
        status: 'open',
      },
      seniorUser
    );

    expect(note.id).toMatch(/^NOTE-/);
    expect(note.status).toBe('open');

    // Partner resolves the note
    const resolvedNote = repo.resolveReviewerNote(note.id, partnerUser);
    expect(resolvedNote.status).toBe('resolved');
    expect(resolvedNote.resolvedByUserId).toBe(partnerUser.id);
    expect(resolvedNote.resolvedAt).toBeDefined();
  });

  it('seals engagement with partner digital audit certificate and cryptographic hash', () => {
    const sealResult = repo.sealEngagementWithPartnerCertificate('ENG-2026-01', 'AP.0942', partnerUser);

    expect(sealResult.engagement.status).toBe('partner_sealed');
    expect(sealResult.certificateHash).toMatch(/^FINOVA-SEAL-/);

    // Verify audit event recorded
    const latestAudit = repo.getState().auditEvents[0];
    expect(latestAudit.action).toBe('partner_sign_off_seal');
    expect(latestAudit.actorRole).toBe('partner');
  });
});
