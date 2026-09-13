create index tabula_licenses_issued_by_idx on public.tabula_licenses (issued_by);
create index tabula_platform_admins_created_by_idx on public.tabula_platform_admins (created_by);

drop policy "Platform admins can identify themselves" on public.tabula_platform_admins;
create policy "Platform admins can identify themselves"
on public.tabula_platform_admins for select to authenticated
using (user_id = (select auth.uid()));

drop policy "Platform admins can view all organizations" on public.tabula_organizations;
drop policy tabula_org_member_read on public.tabula_organizations;
create policy tabula_org_member_read
on public.tabula_organizations for select to authenticated
using (public.tabula_is_org_member(id) or private.tabula_is_platform_admin());

drop policy "Platform admins can view all memberships" on public.tabula_memberships;
drop policy tabula_membership_read on public.tabula_memberships;
create policy tabula_membership_read
on public.tabula_memberships for select to authenticated
using (public.tabula_is_org_member(org_id) or private.tabula_is_platform_admin());
