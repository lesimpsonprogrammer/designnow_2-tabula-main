# Tabula Design Now — Teams Organization Builder

## Scope

This feature is available only to organizations with an active `teams` license.

## Roles

- Org Admin — organization owner; full Teams administration and Organization Builder access.
- Site Admin — organization admin; broad access, Settings view-only, and User Access Change requests.
- Section Leader — member assigned to one section.
- Site Designer — member who may work across sections; Asset Design Module access requires Org Admin approval.
- Logo Designer — member with Asset Design Module access reserved for the forthcoming module.

## Organization Builder

The Org Admin completes four steps:

1. Organization
2. Template recommendation
3. Environment
4. Role appointment

The Builder automatically opens for a Teams Org Admin when setup has not been completed and remains available afterward for revisions.

## Settings

Teams Organization Settings includes:

- Access Permissions
- User Account Setup
- User Access Changes

Site Admin can view Settings but cannot directly modify permissions or user setup. Site Admin submits a User Access Change request, which the Org Admin can approve or reject.

## Persistence

The migration `supabase/migrations/20260914001500_tabula_teams_organization_builder.sql` adds:

- `tabula_org_setups`
- `tabula_team_members`
- `tabula_user_access_requests`
- Teams license and role helper functions
- RLS policies enforcing the Teams access model

## Rollout gate

Do not merge/deploy this feature until the migration has been applied and verified against the Supabase project used by Tabula Design Now. Do not apply this migration to CPSM Knowledge Hub.

## Verification

`.github/workflows/verify.yml` runs on feature branches and pull requests and must pass:

- `npm ci`
- `npm run lint`
- `npm run build`
