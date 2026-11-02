import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';

const jsonError = (res: VercelResponse, status: number, message: string) => res.status(status).json({ error: message });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'PATCH') return res.status(405).setHeader('Allow', 'GET, POST, PATCH').end();
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
      const projectId = String(req.query.projectId ?? '');
      if (projectId) {
        if (!/^[0-9a-f-]{36}$/i.test(projectId)) return jsonError(res, 400, 'Invalid project ID');
        const projects = await sql`SELECT id, name, document, revision, updated_at AS "updatedAt" FROM projects WHERE id = ${projectId}::uuid AND organization_id = ${orgId}::uuid LIMIT 1`;
        if (!projects.length) return jsonError(res, 404, 'Project not found');
        return res.status(200).json({ project: projects[0] });
      }
      const projects = await sql`SELECT id, name, revision, updated_at AS "updatedAt" FROM projects WHERE organization_id = ${orgId}::uuid ORDER BY updated_at DESC LIMIT 100`;
      return res.status(200).json({ projects });
    }
    const name = String(req.body?.name ?? 'Untitled Project').trim().slice(0, 120);
    const document = req.body?.document;
    if (!name || !document || typeof document !== 'object' || Array.isArray(document)) return jsonError(res, 400, 'Project name and document object required');
    if (JSON.stringify(document).length > 1_000_000) return jsonError(res, 413, 'Project document exceeds size limit');
    if (req.method === 'PATCH') {
      const projectId = String(req.body?.projectId ?? '');
      const expectedRevision = req.body?.expectedRevision;
      if (!/^[0-9a-f-]{36}$/i.test(projectId) || !Number.isSafeInteger(expectedRevision) || expectedRevision < 1) {
        return jsonError(res, 400, 'Project ID and expected revision are required');
      }
      // This statement atomically updates the document and records its revision.
      // A stale browser session cannot silently overwrite a newer revision.
      const updated = await sql`
        WITH changed AS (
          UPDATE projects
          SET document = ${JSON.stringify(document)}::jsonb, name = ${name},
              revision = revision + 1, updated_at = now()
          WHERE id = ${projectId}::uuid AND organization_id = ${orgId}::uuid
            AND revision = ${expectedRevision}
          RETURNING id, name, revision, document, updated_at
        ), history AS (
          INSERT INTO project_versions(project_id, revision, document, saved_by)
          SELECT id, revision, document, ${userId}::uuid FROM changed
          RETURNING id
        )
        SELECT changed.id, changed.name, changed.revision, changed.updated_at AS "updatedAt"
        FROM changed JOIN history ON TRUE`;
      if (!updated.length) return jsonError(res, 409, 'Revision conflict or project not found; reload before saving');
      return res.status(200).json({ project: updated[0] });
    }
    const projectId = randomUUID();
    const created = await sql`
      WITH inserted AS (
        INSERT INTO projects (id, organization_id, name, document, created_by)
        VALUES (${projectId}::uuid, ${orgId}::uuid, ${name}, ${JSON.stringify(document)}::jsonb, ${userId}::uuid)
        RETURNING id, name, revision, document
      ), history AS (
        INSERT INTO project_versions(project_id, revision, document, saved_by)
        SELECT id, revision, document, ${userId}::uuid FROM inserted RETURNING id
      )
      SELECT inserted.id, inserted.name, inserted.revision FROM inserted JOIN history ON TRUE`;
    return res.status(201).json({ project: created[0] });
  } catch {
    return jsonError(res, 500, 'Unable to access project storage');
  }
}
