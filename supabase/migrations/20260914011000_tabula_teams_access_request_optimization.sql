create index if not exists tabula_user_access_requests_reviewed_by_idx
  on public.tabula_user_access_requests(reviewed_by);

drop policy if exists "Teams Org Admin can view all access requests" on public.tabula_user_access_requests;
drop policy if exists "Teams Site Admin can view own access requests" on public.tabula_user_access_requests;

create policy "Teams admins can view permitted access requests"
on public.tabula_user_access_requests for select to authenticated
using (
  private.tabula_is_teams_org_admin(org_id)
  or (
    private.tabula_is_teams_site_admin(org_id)
    and requested_by = (select auth.uid())
  )
);

drop policy if exists "Teams Site Admin can submit access requests" on public.tabula_user_access_requests;

create policy "Teams Site Admin can submit access requests"
on public.tabula_user_access_requests for insert to authenticated
with check (
  private.tabula_is_teams_site_admin(org_id)
  and requested_by = (select auth.uid())
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);
