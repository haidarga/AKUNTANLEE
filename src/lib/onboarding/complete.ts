import type { FirmProfile } from '@/types/domain-v4';

type FirmProfileResponse = {
  success: boolean;
  data?: Partial<FirmProfile>;
  error?: string;
};

type CompleteOnboardingDependencies = {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<{ json: () => Promise<FirmProfileResponse> }>;
  persistProfile: (profile: Partial<FirmProfile>) => void;
  navigate: (destination: string) => void;
};

/** Saves the KAP profile before entering the protected engagement workspace. */
export async function completeOnboarding(
  profile: Partial<FirmProfile>,
  { request, persistProfile, navigate }: CompleteOnboardingDependencies,
): Promise<Partial<FirmProfile>> {
  const response = await request('/api/v1/firm', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Gagal menyimpan profil KAP');
  }

  const savedProfile = data.data || profile;
  persistProfile(savedProfile);
  navigate('/engagements');
  return savedProfile;
}
