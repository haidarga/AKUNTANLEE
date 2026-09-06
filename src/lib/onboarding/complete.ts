import type { FirmProfile } from '@/types/domain-v4';

type FirmProfileResponse = {
  success: boolean;
  data?: Partial<FirmProfile>;
  error?: string;
  code?: string;
  message?: string;
};

type CompleteOnboardingDependencies = {
  request: (input: RequestInfo | URL, init?: RequestInit) => Promise<{
    status?: number;
    json: () => Promise<FirmProfileResponse>;
  }>;
  persistProfile: (profile: Partial<FirmProfile>) => void;
  navigate: (destination: string) => void;
};

/** Raised when the firm API correctly requires a session before saving onboarding. */
export class OnboardingAuthenticationRequiredError extends Error {
  constructor() {
    super('Sesi login diperlukan untuk menyimpan profil KAP.');
    this.name = 'OnboardingAuthenticationRequiredError';
  }
}

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

  if (response.status === 401 || data.code === 'UNAUTHENTICATED') {
    throw new OnboardingAuthenticationRequiredError();
  }

  if (!data.success) {
    throw new Error(data.error || data.message || 'Gagal menyimpan profil KAP');
  }

  const savedProfile = data.data || profile;
  persistProfile(savedProfile);
  navigate('/engagements');
  return savedProfile;
}
