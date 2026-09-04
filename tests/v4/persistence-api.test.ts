import { describe, it, expect } from 'vitest';
import { GET as getEngagements, POST as postEngagement } from '@/app/api/v1/engagements/route';
import { GET as getEngagementDetail, PATCH as patchEngagementDetail } from '@/app/api/v1/engagements/[id]/route';

describe('Engagement Persistence & Dynamic Client API', () => {
  it('should atomically create custom client and engagement with custom PT parameters', async () => {
    const payload = {
      clientName: 'PT Orbit Audit Digital',
      clientCode: 'OAD26',
      industry: 'Teknologi Informasi & SaaS',
      taxIdNpwp: '01.999.888.7-011.000',
      periodYear: '2026',
      materialityIdr: 987654321,
      accountingStandard: 'SAK_INDONESIA',
      name: 'Audit Kertas Kerja Tahunan OAD FY 2026',
    };

    const postReq = new Request('http://localhost:3000/api/v1/engagements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const res = await postEngagement(postReq);
    expect(res.status).toBe(201);

    const json = await res.json();
    expect(json.data).toBeDefined();
    expect(json.data.id).toMatch(/^ENG-2026-\d+/);
    expect(json.client.legalName).toBe('PT Orbit Audit Digital');
    expect(json.client.code).toBe('OAD26');
    expect(json.client.taxIdNpwp).toBe('01.999.888.7-011.000');
    expect(json.data.materialityIdr).toBe(987654321);

    // Verify cookies are set for serverless resilience
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toBeTruthy();
    expect(setCookie).toContain('finova_custom_engagements');

    const createdId = json.data.id;

    // Test GET detail endpoint
    const getDetailReq = new Request(`http://localhost:3000/api/v1/engagements/${createdId}`);
    const detailRes = await getEngagementDetail(getDetailReq, {
      params: Promise.resolve({ id: createdId }),
    });

    expect(detailRes.status).toBe(200);
    const detailJson = await detailRes.json();
    expect(detailJson.data.engagement.id).toBe(createdId);
    expect(detailJson.data.client.legalName).toBe('PT Orbit Audit Digital');

    // Test PATCH detail endpoint
    const patchReq = new Request(`http://localhost:3000/api/v1/engagements/${createdId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: 'PT Orbit Audit Digital Perkasa',
        materialityIdr: 1200000000,
      }),
    });

    const patchRes = await patchEngagementDetail(patchReq, {
      params: Promise.resolve({ id: createdId }),
    });

    expect(patchRes.status).toBe(200);
    const patchJson = await patchRes.json();
    expect(patchJson.data.client.legalName).toBe('PT Orbit Audit Digital Perkasa');
    expect(patchJson.data.engagement.materialityIdr).toBe(1200000000);

    // Test GET list endpoint
    const listReq = new Request('http://localhost:3000/api/v1/engagements');
    const listRes = await getEngagements(listReq);
    expect(listRes.status).toBe(200);
    const listJson = await listRes.json();
    expect(listJson.data.some((e: any) => e.id === createdId)).toBe(true);
  });
});
