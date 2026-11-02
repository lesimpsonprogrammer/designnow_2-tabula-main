// Cloud project transport. All Neon access stays behind the authenticated server API.
import type { SupabaseClient } from '@supabase/supabase-js';

type ProjectSummary = { id: string; name: string; revision: number; updatedAt: string };
type ProjectDetail = ProjectSummary & { document: Record<string, unknown> };
type ErrorResult = { error?: string };

async function request<T>(client: SupabaseClient, path: string, init?: RequestInit): Promise<T> {
  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session?.access_token) throw new Error('Sign in to access cloud projects');
  const response = await fetch(path, {
    ...init,
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as T & ErrorResult;
  if (!response.ok) {
    const message = payload.error ?? 'Cloud project request failed';
    if (response.status === 409) throw new Error('Your project has changed elsewhere. Reload it before saving.');
    throw new Error(message);
  }
  return payload;
}

export function listCloudProjects(client: SupabaseClient, orgId: string) {
  return request<{ projects: ProjectSummary[] }>(client, `/api/projects?orgId=${encodeURIComponent(orgId)}`);
}
export function loadCloudProject(client: SupabaseClient, orgId: string, projectId: string) {
  return request<{ project: ProjectDetail }>(client, `/api/projects?orgId=${encodeURIComponent(orgId)}&projectId=${encodeURIComponent(projectId)}`);
}
export function createCloudProject(client: SupabaseClient, orgId: string, name: string, document: Record<string, unknown>) {
  return request<{ project: ProjectSummary }>(client, '/api/projects', {
    method: 'POST', body: JSON.stringify({ orgId, name, document }),
  });
}
export function saveCloudProject(
  client: SupabaseClient, orgId: string, projectId: string,
  name: string, document: Record<string, unknown>, expectedRevision: number,
) {
  return request<{ project: ProjectSummary }>(client, '/api/projects', {
    method: 'PATCH', body: JSON.stringify({ orgId, projectId, name, document, expectedRevision }),
  });
}
