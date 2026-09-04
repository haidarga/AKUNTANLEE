import { afterEach, describe, expect, it } from 'vitest';
import { POST as useAccessKey } from '@/app/api/v1/auth/access-key/route';
import { middleware } from '@/middleware';
import { NextRequest } from 'next/server';

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

  it('redirects unauthenticated pages and rejects unauthenticated APIs', async () => {
    process.env.FINOVA_DEMO_MODE = 'false';

    const pageResponse = await middleware(
      new NextRequest('https://finova.example/engagements/ENG-MANDIRI-2026/files'),
    );
    expect(pageResponse.status).toBe(307);
    expect(pageResponse.headers.get('location')).toBe(
      'https://finova.example/login?redirect=%2Fengagements%2FENG-MANDIRI-2026%2Ffiles',
    );

    const apiResponse = await middleware(
      new NextRequest('https://finova.example/api/v1/exports', { method: 'POST' }),
    );
    expect(apiResponse.status).toBe(401);
    expect(await apiResponse.json()).toEqual({ code: 'UNAUTHENTICATED', message: 'Sesi login diperlukan.' });
  });
});
