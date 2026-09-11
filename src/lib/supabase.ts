import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const CONFIG_KEY = 'tabula.supabase.config';
export type SupabaseConfig = { url: string; publishableKey: string };

export function getSupabaseConfig(): SupabaseConfig | null {
  const envUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
  const envKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (envUrl && envKey) return { url: envUrl, publishableKey: envKey };
  try {
    const value = JSON.parse(window.localStorage.getItem(CONFIG_KEY) ?? 'null') as Partial<SupabaseConfig> | null;
    return value?.url && value?.publishableKey ? { url: value.url, publishableKey: value.publishableKey } : null;
  } catch {
    return null;
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): SupabaseClient {
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  return makeSupabaseClient(config)!;
}

export function makeSupabaseClient(config = getSupabaseConfig()): SupabaseClient | null {
  if (!config) return null;
  return createClient(config.url, config.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}
