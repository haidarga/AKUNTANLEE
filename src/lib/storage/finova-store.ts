// FINOVA AI v4.0 — Universal Persistent Store Adapter
// Client-side LocalStorage + Cookie syncing for stateless Vercel Serverless

export interface StoredCustomEngagement {
  id: string;
  clientId: string;
  name: string;
  clientName: string;
  clientCode: string;
  taxIdNpwp?: string;
  industry?: string;
  periodStart: string;
  periodEnd: string;
  periodYear: string;
  materialityIdr: number;
  status: string;
  accountingStandard: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredCustomClient {
  id: string;
  legalName: string;
  code: string;
  industry: string;
  taxIdNpwp?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

const STORAGE_KEY_ENGAGEMENTS = 'finova_custom_engagements';
const STORAGE_KEY_CLIENTS = 'finova_custom_clients';
const COOKIE_NAME = 'finova_custom_engagements';

export function getStoredCustomEngagements(): StoredCustomEngagement[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENGAGEMENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading custom engagements from localStorage:', e);
    return [];
  }
}

export function getStoredCustomClients(): StoredCustomClient[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CLIENTS);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed reading custom clients from localStorage:', e);
    return [];
  }
}

export function saveStoredCustomEngagement(
  eng: Partial<StoredCustomEngagement> & { id: string },
  client?: Partial<StoredCustomClient>
): void {
  if (typeof window === 'undefined') return;

  try {
    // 1. Update Engagements in LocalStorage
    const existingEngs = getStoredCustomEngagements();
    const clientName = client?.legalName || eng.clientName || 'Klien Audit';
    const clientCode = (client?.code || eng.clientCode || 'KLN').toUpperCase();

    const updatedEng: StoredCustomEngagement = {
      id: eng.id,
      clientId: eng.clientId || client?.id || `CLI-${Date.now().toString(36).toUpperCase()}`,
      name: eng.name || `Kertas Kerja Audit FY ${eng.periodYear || '2026'}`,
      clientName,
      clientCode,
      taxIdNpwp: client?.taxIdNpwp || eng.taxIdNpwp || '01.234.567.8-012.000',
      industry: client?.industry || eng.industry || 'Manufaktur & Fabrikasi',
      periodStart: eng.periodStart || '2026-01-01',
      periodEnd: eng.periodEnd || '2026-12-31',
      periodYear: eng.periodYear || '2026',
      materialityIdr: eng.materialityIdr || 250_000_000,
      status: eng.status || 'preparing',
      accountingStandard: eng.accountingStandard || 'SAK_INDONESIA',
      createdAt: eng.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const filteredEngs = existingEngs.filter((e) => e.id !== eng.id);
    filteredEngs.unshift(updatedEng);
    localStorage.setItem(STORAGE_KEY_ENGAGEMENTS, JSON.stringify(filteredEngs));

    // 2. Update Clients in LocalStorage
    if (client || clientName) {
      const existingClients = getStoredCustomClients();
      const updatedClient: StoredCustomClient = {
        id: updatedEng.clientId,
        legalName: clientName,
        code: clientCode,
        industry: updatedEng.industry || 'Manufaktur & Fabrikasi',
        taxIdNpwp: updatedEng.taxIdNpwp,
        status: 'active',
        createdAt: new Date().toISOString(),
      };
      const filteredClients = existingClients.filter((c) => c.id !== updatedClient.id);
      filteredClients.unshift(updatedClient);
      localStorage.setItem(STORAGE_KEY_CLIENTS, JSON.stringify(filteredClients));
    }

    // 3. Sync to Cookie so Server Components (layout.tsx) can read it on next page load
    const cookiePayload = encodeURIComponent(JSON.stringify(filteredEngs.slice(0, 10)));
    document.cookie = `${COOKIE_NAME}=${cookiePayload}; path=/; max-age=31536000; SameSite=Lax`;
  } catch (e) {
    console.error('Failed saving custom engagement to storage & cookie:', e);
  }
}
