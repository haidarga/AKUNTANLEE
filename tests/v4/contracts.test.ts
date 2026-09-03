import { describe, it, expect } from 'vitest';
import { computeSha256 } from '@/lib/importer/pipeline';

describe('R02 / PRD §18: Input Contracts & Checksum Integrity', () => {
  it('computes repeatable SHA-256 checksums from binary payloads', () => {
    const payload = Buffer.from('FINOVA_TB_CONTRACT_TEST_2026');
    const hash1 = computeSha256(payload);
    const hash2 = computeSha256(payload);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
  });
});
