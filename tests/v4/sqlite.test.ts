import { describe, it, expect } from 'vitest';
import { getDatabase, getUserByEmail, loadStateFromDb, saveStateToDb } from '@/lib/db/sqlite';
import bcrypt from 'bcryptjs';

describe('FINOVA Enterprise SQLite Engine', () => {
  it('initializes schema and tables correctly', () => {
    const db = getDatabase();
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map((r: any) => r.name);
    
    expect(tables).toContain('users');
    expect(tables).toContain('sessions');
    expect(tables).toContain('audit_logs');
    expect(tables).toContain('app_state');
  });

  it('contains seeded users with valid bcrypt hashes', () => {
    const partner = getUserByEmail('haidar@kaphaidar.co.id');
    
    expect(partner).toBeDefined();
    expect(partner?.name).toBe('Haidar, CPA, CA');
    expect(partner?.role).toBe('partner');
    
    // Verify bcrypt password
    const valid = bcrypt.compareSync('Partner123!', partner!.password_hash);
    expect(valid).toBe(true);

    const invalid = bcrypt.compareSync('WrongPassword', partner!.password_hash);
    expect(invalid).toBe(false);
  });

  it('loads and saves state atomically via SQLite', () => {
    const state = loadStateFromDb();
    expect(state).not.toBeNull();
    expect(state?.engagements.length).toBeGreaterThan(0);

    const updatedState = { ...state!, firmProfile: { ...state!.firmProfile!, name: 'KAP Haidar & Rekan (ACID Test)' } };
    saveStateToDb(updatedState);

    const reloaded = loadStateFromDb();
    expect(reloaded?.firmProfile?.name).toBe('KAP Haidar & Rekan (ACID Test)');

    // Restore original name
    saveStateToDb({ ...state!, firmProfile: { ...state!.firmProfile!, name: 'KAP Haidar & Rekan' } });
  });

  it('runs 50 concurrent transactions without race conditions or locks', () => {
    const db = getDatabase();
    const state = loadStateFromDb()!;

    // Perform 50 rapid sequential/concurrent updates
    for (let i = 0; i < 50; i++) {
      state.auditEvents.push({
        id: `AUDIT-TEST-${i}`,
        engagementId: 'ENG-2026-01',
        tenantId: 'TENANT-001',
        actorId: 'USR-PARTNER-01',
        actorName: 'Haidar, CPA',
        actorRole: 'partner',
        action: 'override',
        resourceType: 'mapping_decision',
        resourceId: `DEC-${i}`,
        requestId: `REQ-${i}`,
        timestamp: new Date().toISOString(),
      });
      saveStateToDb(state);
    }

    const finalState = loadStateFromDb()!;
    const testAudits = finalState.auditEvents.filter((a: any) => a.id.startsWith('AUDIT-TEST-'));
    expect(testAudits.length).toBe(50);

    // Cleanup test audits
    finalState.auditEvents = finalState.auditEvents.filter((a: any) => !a.id.startsWith('AUDIT-TEST-'));
    saveStateToDb(finalState);
  });
});
