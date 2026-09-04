import { describe, expect, it } from 'vitest';
import { getStateMirrorPath } from '@/lib/db/sqlite';

describe('Vercel state mirror path', () => {
  it('keeps the JSON compatibility mirror inside the writable runtime data directory', () => {
    expect(getStateMirrorPath('/tmp/finova_data')).toBe('/tmp/finova_data/finova_store.json');
  });
});
