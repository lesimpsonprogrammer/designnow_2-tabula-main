import type { SupabaseClient } from '@supabase/supabase-js';
export type TypographyDesign = { brand: string; head: string; body: string; sample: string; size: number };
export type CloudTypography = { design: TypographyDesign; revision: number; updated_at: string };

export async function readTypographyCloud(client: SupabaseClient, orgId: string, userId: string): Promise<CloudTypography | null> {
  const {data,error} = await client.from('tabula_typography_designs')
    .select('design,revision,updated_at').eq('org_id',orgId).eq('user_id',userId).maybeSingle();
  if (error) throw error;
  return data as CloudTypography | null;
}
export async function saveTypographyCloud(client: SupabaseClient, orgId: string, design: TypographyDesign, expectedRevision: number): Promise<number> {
  const {data,error} = await client.rpc('tabula_save_typography_design', {
    p_org_id: orgId, p_design: design, p_expected_revision: expectedRevision,
  });
  if (error) throw error;
  if (!Number.isInteger(data) || data < 1) throw new Error('Cloud did not confirm a valid revision.');
  return data;
}
