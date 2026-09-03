import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken,
} from '@/lib/auth/session';
import { getUserByEmail, DEFAULT_CREDENTIALS } from '@/lib/db/sqlite';

describe('FINOVA Enterprise Authentication System', () => {
  it('hashes and verifies passwords securely using bcrypt', async () => {
    const password = 'SecureAuditPassword2026!';
    const hash = await hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2')).toBe(true);

    const isMatch = await verifyPassword(password, hash);
    expect(isMatch).toBe(true);

    const isBadMatch = await verifyPassword('WrongPassword', hash);
    expect(isBadMatch).toBe(false);
  });

  it('signs and verifies JWT session tokens with HMAC-SHA256', async () => {
    const payload = {
      userId: 'USR-PARTNER-01',
      email: 'haidar@kaphaidar.co.id',
      role: 'partner',
      name: 'Haidar, CPA, CA',
      title: 'Managing Partner',
    };

    const token = await createSessionToken(payload);
    expect(token).toBeDefined();
    expect(token.split('.').length).toBe(3);

    const decoded = await verifySessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe(payload.role);
  });

  it('rejects tampered or malformed tokens', async () => {
    const validToken = await createSessionToken({
      userId: 'USR-MGR-01',
      email: 'siti.r@kaphaidar.co.id',
      role: 'manager',
      name: 'Siti Rahmawati, CA',
      title: 'Audit Manager',
    });

    // Tamper with the token
    const tampered = validToken.substring(0, validToken.length - 5) + 'xxxxx';
    const decoded = await verifySessionToken(tampered);
    expect(decoded).toBeNull();

    const emptyDecoded = await verifySessionToken('');
    expect(emptyDecoded).toBeNull();
  });

  it('verifies all 4 default enterprise auditor role accounts', async () => {
    const accounts = [
      { email: 'haidar@kaphaidar.co.id', pass: 'Partner123!', expectedRole: 'partner' },
      { email: 'siti.r@kaphaidar.co.id', pass: 'Manager123!', expectedRole: 'manager' },
      { email: 'ahmad.p@kaphaidar.co.id', pass: 'Senior123!', expectedRole: 'senior' },
      { email: 'budi.s@kaphaidar.co.id', pass: 'Preparer123!', expectedRole: 'preparer' },
    ];

    for (const acc of accounts) {
      const user = getUserByEmail(acc.email);
      expect(user).not.toBeNull();
      expect(user?.role).toBe(acc.expectedRole);

      const isValid = await verifyPassword(acc.pass, user!.password_hash);
      expect(isValid).toBe(true);
    }
  });
});
