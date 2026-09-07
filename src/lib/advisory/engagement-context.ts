export interface AdvisoryEngagementContext {
  clientName: string;
  industry: string;
}

/**
 * The advisory page receives its identity from the canonical engagement API.
 * It must never infer an industry from the browser demo repository.
 */
export function resolveAdvisoryEngagementContext(data: any): AdvisoryEngagementContext {
  return {
    clientName: data?.client?.legalName || data?.engagement?.name || 'Entitas Klien',
    industry: data?.client?.industry || 'Belum ditentukan',
  };
}
