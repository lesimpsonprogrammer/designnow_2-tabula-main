# Tabula Neon cloud-project rollout

Status: **development only; not connected to production**.

## Infrastructure
- Dedicated Neon project: `fragrant-wave-95561186`.
- Five existing tables: `organizations`, `memberships`, `projects`, `project_versions`, `project_assets`.
- Supabase Auth remains the identity provider.
- The API requires `DATABASE_URL`, `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` as **server-only** Vercel variables. Never use a VITE_ prefix for DATABASE_URL.

## Required migration before cloud saves
1. Verify original Supabase organization and membership IDs, roles, team roles and active licenses.
2. Copy organizations to Neon, retaining original UUIDs as the Neon organizations.id (and optionally legacy_supabase_id).
3. Copy memberships keeping original user_id and org_id UUIDs; verify counts and organizational isolation.
4. Do **not** copy raw passwords or Supabase auth.users into Neon.
5. Test login, unauthorized org, disabled membership, concurrent saves, reload, and two-browser recovery.
6. Enable app cloud syncing only after authentication and migrated org membership pass tests. Browser localStorage remains fallback until then.

## API contract
- `GET /api/projects?orgId=UUID` lists only the authenticated member's projects.
- `GET /api/projects?orgId=UUID&projectId=UUID` loads one project.
- `POST /api/projects` creates a project and its initial revision.
- `PATCH /api/projects` with projectId and expectedRevision saves only if revision matches. HTTP 409 signals concurrent edits.
- Database access takes place only through server-side verified Supabase Auth and Neon membership.

## Outstanding before deployment
- Synchronize package-lock.json with the new dependencies.
- Implement full UI hookup to list/load/create/save, with autosave queue, conflicts, retries and backup restore.
- Add full organization/team/ license schema migration and reconciliation.
- Integrate Cloudflare R2 for large assets; ensure project JSON excludes secrets and large binary blobs.
- Test server endpoints and build, configure deployment secrets, then staged rollout.

## CI verification
The dependency lockfile was regenerated and validated with `npm ci` and `npm run build`. GitHub's standard `Verify Tabula` workflow must run against the updated commit and pass all install, lint and build steps before merging.
