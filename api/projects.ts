import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const jsonError = (res: VercelResponse, status: number, message: string) => res.status(status).json({ error: message });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST') return res.status(405).setHeader('Allow', 'GET, POST').end();
  const databaseUrl = process.env.DATABASE_URL;
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!databaseUrl || !supabaseUrl || !supabaseKey) return jsonError(res, 503, 'Project storage is not configured');
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization ?? '')?.[1];
  if (!token) return jsonError(res, 401, 'Sign in to access your projects');
  try {
    // getUser verifies the token with Supabase Auth; never trust client-supplied user IDs.
    const auth = createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.getUser(token);
    if (error || !data.user) return jsonError(res, 401, 'Invalid session');
    const userId = data.user.id;
    const sql = neon(databaseUrl);
    const orgId = String(req.method === 'GET' ? req.query.orgId ?? '' : req.body?.orgId ?? '');
    if (!/^[0-9a-f-]{36}$/i.test(orgId)) return jsonError(res, 400, 'Valid organization ID required');
    const membership = await sql`SELECT role FROM memberships WHERE organization_id = ${orgId}::uuid AND user_id = ${userId}::uuid LIMIT 1`;
    if (membership.length === 0) return jsonError(res, 403, 'No access to this organization');
    if (req.method === 'GET') {
      const projects = await sql`SELECT id, name, revision, updated_at AS "updatedAt" FROM projects WHERE organization_id = ${orgId}::uuid ORDER BY updated_at DESC LIMIT 100`;
      return res.status(200).json({ projects });
    }
    const name = String(req.body?.name ?? 'Untitled Project').trim().slice(0, 120);
    const document = req.body?.document;
    if (!name || !document || typeof document !== 'object' || Array.isArray(document)) return jsonError(res, 400, 'Project name and document object required');
    if (JSON.stringify(document).length > 1_000_000) return jsonError(res, 413, 'Project document exceeds size limit');
    const projectId = randomUUID();
    const created = await sql`INSERT INTO projects (id, organization_id, name, document, created_by) VALUES (${projectId}::uuid, ${orgId}::uuid, ${name}, ${JSON.stringify(document)}::jsonb, ${userId}::uuid) RETURNING id, name, revision`;
    return res.status(201).json({ project: created[0] });
  } catch {
    return jsonError(res, 500, 'Unable to access project storage');
  }
}
