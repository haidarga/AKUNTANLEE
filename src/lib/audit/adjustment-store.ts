import { AuditAdjustmentEntry, UserV4 } from '@/types/domain-v4';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase/client';

type AdjustmentInput = Omit<AuditAdjustmentEntry, 'id' | 'createdAt'>;

export async function getPersistentAdjustments(engagementId: string, firmId: string): Promise<AuditAdjustmentEntry[] | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('engagements')
    .select('metadata')
    .eq('id', engagementId)
    .eq('firm_id', firmId)
    .maybeSingle();
  if (error || !data) return null;
  const adjustments = data.metadata?.finovaAuditAdjustments;
  return Array.isArray(adjustments) ? adjustments : [];
}

/** Persist the double-entry audit journal atomically with its engagement. */
export async function createPersistentAdjustment(
  entry: AdjustmentInput,
  actor: UserV4,
): Promise<AuditAdjustmentEntry | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: existing, error: readError } = await supabase
    .from('engagements')
    .select('metadata')
    .eq('id', entry.engagementId)
    .eq('firm_id', actor.tenantId)
    .maybeSingle();
  if (readError || !existing) return null;

  const newEntry: AuditAdjustmentEntry = {
    ...entry,
    id: `AJE-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
  };
  const metadata = {
    ...(existing.metadata || {}),
    finovaAuditAdjustments: [...(Array.isArray(existing.metadata?.finovaAuditAdjustments) ? existing.metadata.finovaAuditAdjustments : []), newEntry],
  };
  const { error: writeError } = await supabase
    .from('engagements')
    .update({ metadata, updated_at: new Date().toISOString() })
    .eq('id', entry.engagementId)
    .eq('firm_id', actor.tenantId);
  return writeError ? null : newEntry;
}
