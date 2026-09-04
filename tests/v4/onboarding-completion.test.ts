import { describe, expect, it, vi } from 'vitest';
import type { FirmProfile } from '@/types/domain-v4';
import { completeOnboarding } from '@/lib/onboarding/complete';

const profile: Partial<FirmProfile> = {
  name: 'KAP Cakrawala Audit Nusantara',
  managingPartnerName: 'Dimas Cakrawala, CPA, CA',
};

describe('onboarding completion', () => {
  it('persists the saved profile and navigates into the workspace immediately', async () => {
    const navigate = vi.fn();
    const persistProfile = vi.fn();
    const response = { success: true, data: profile };
    const request = vi.fn().mockResolvedValue({ json: async () => response });

    await completeOnboarding(profile, { request, persistProfile, navigate });

    expect(request).toHaveBeenCalledWith('/api/v1/firm', expect.objectContaining({ method: 'PUT' }));
    expect(persistProfile).toHaveBeenCalledWith(profile);
    expect(navigate).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledWith('/engagements');
  });

  it('does not navigate when the profile API rejects the update', async () => {
    const navigate = vi.fn();
    const persistProfile = vi.fn();
    const request = vi.fn().mockResolvedValue({ json: async () => ({ success: false, error: 'Rejected' }) });

    await expect(completeOnboarding(profile, { request, persistProfile, navigate })).rejects.toThrow('Rejected');
    expect(persistProfile).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
