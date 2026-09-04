import { afterEach, describe, expect, it } from 'vitest';
import { POST as useAccessKey } from '@/app/api/v1/auth/access-key/route';

const originalDemoMode = process.env.FINOVA_DEMO_MODE;

afterEach(() => {
  process.env.FINOVA_DEMO_MODE = originalDemoMode;
});

describe('production authentication boundary', () => {
  it('disables evaluator access keys unless demo mode is explicitly enabled', async () => {
    process.env.FINOVA_DEMO_MODE = 'false';
    const response = await useAccessKey(
      new Request('http://localhost/api/v1/auth/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'FINOVA-MASTER-2026' }),
      }) as never,
    );

    expect(response.status).toBe(404);
  });

  it('never promotes an arbitrary string to guest partner access', async () => {
    process.env.FINOVA_DEMO_MODE = 'true';
    const response = await useAccessKey(
      new Request('http://localhost/api/v1/auth/access-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'ANY-RANDOM-STRING' }),
      }) as never,
    );

    expect(response.status).toBe(401);
  });
});
