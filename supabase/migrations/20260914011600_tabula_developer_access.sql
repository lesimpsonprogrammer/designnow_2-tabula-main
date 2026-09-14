drop policy if exists "tabula_project_member_read" on public.tabula_projects;
create policy "tabula_project_member_read"
on public.tabula_projects for select to authenticated
using (
  private.tabula_is_platform_admin()
  or exists (
    select 1 from public.tabula_memberships m
    where m.org_id = tabula_projects.org_id
      and m.user_id = (select auth.uid())
  )
);

drop policy if exists "tabula_invite_admin_read" on public.tabula_invites;
create policy "tabula_invite_admin_read"
on public.tabula_invites for select to authenticated
using (
  private.tabula_is_platform_admin()
  or exists (
    select 1 from public.tabula_memberships m
    where m.org_id = tabula_invites.org_id
      and m.user_id = (select auth.uid())
      and m.role = any (array['owner'::text, 'admin'::text])
  )
);

drop policy if exists "Teams members can view organization setup" on public.tabula_org_setups;
create policy "Teams members can view organization setup"
on public.tabula_org_setups for select to authenticated
using (
  private.tabula_is_platform_admin()
  or (
    private.tabula_has_active_teams_license(org_id)
    and public.tabula_is_org_member(org_id)
  )
);

drop policy if exists "Teams Org Admin can create organization setup" on public.tabula_org_setups;
create policy "Teams Org Admin can create organization setup"
on public.tabula_org_setups for insert to authenticated
with check (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams Org Admin can update organization setup" on public.tabula_org_setups;
create policy "Teams Org Admin can update organization setup"
on public.tabula_org_setups for update to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
)
with check (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams Org Admin can delete organization setup" on public.tabula_org_setups;
create policy "Teams Org Admin can delete organization setup"
on public.tabula_org_setups for delete to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams members can view team assignments" on public.tabula_team_members;
create policy "Teams members can view team assignments"
on public.tabula_team_members for select to authenticated
using (
  private.tabula_is_platform_admin()
  or (
    private.tabula_has_active_teams_license(org_id)
    and public.tabula_is_org_member(org_id)
  )
);

drop policy if exists "Teams Org Admin can create team assignments" on public.tabula_team_members;
create policy "Teams Org Admin can create team assignments"
on public.tabula_team_members for insert to authenticated
with check (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams Org Admin can update team assignments" on public.tabula_team_members;
create policy "Teams Org Admin can update team assignments"
on public.tabula_team_members for update to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
)
with check (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams Org Admin can delete team assignments" on public.tabula_team_members;
create policy "Teams Org Admin can delete team assignments"
on public.tabula_team_members for delete to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);

drop policy if exists "Teams admins can view permitted access requests" on public.tabula_user_access_requests;
create policy "Teams admins can view permitted access requests"
on public.tabula_user_access_requests for select to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
  or (
    private.tabula_is_teams_site_admin(org_id)
    and requested_by = (select auth.uid())
  )
);

drop policy if exists "Teams Org Admin can review access requests" on public.tabula_user_access_requests;
create policy "Teams Org Admin can review access requests"
on public.tabula_user_access_requests for update to authenticated
using (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
)
with check (
  private.tabula_is_platform_admin()
  or private.tabula_is_teams_org_admin(org_id)
);
