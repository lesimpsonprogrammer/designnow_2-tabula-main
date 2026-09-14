create table if not exists public.tabula_org_setups (
  org_id uuid primary key references public.tabula_organizations(id) on delete cascade,
  workspace_name text not null default '',
  website text not null default '',
  industry text not null default '',
  company_size text not null default '',
  operating_region text not null default '',
  primary_use text not null default '',
  project_stage text not null default '',
  template_key text not null default '',
  environment_type text not null default '',
  environment_name text not null default '',
  separate_environments text[] not null default '{}',
  technologies text[] not null default '{}',
  setup_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tabula_team_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.tabula_organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text not null,
  role text not null check (role in ('site_admin', 'section_leader', 'site_designer', 'logo_designer')),
  section_name text,
  asset_design_approved boolean not null default false,
  status text not null default 'pending' check (status in ('active', 'pending', 'inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, email, role),
  constraint tabula_section_leader_section_check check (
    role <> 'section_leader' or nullif(btrim(section_name), '') is not null
  ),
  constraint tabula_logo_designer_asset_check check (
    role <> 'logo_designer' or asset_design_approved = true
  )
);

create table if not exists public.tabula_user_access_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.tabula_organizations(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  requested_role text not null check (requested_role in ('site_admin', 'section_leader', 'site_designer', 'logo_designer')),
  section_name text,
  asset_design_requested boolean not null default false,
  reason text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tabula_access_request_section_check check (
    requested_role <> 'section_leader' or nullif(btrim(section_name), '') is not null
  )
);

create index if not exists tabula_team_members_org_id_idx on public.tabula_team_members(org_id);
create index if not exists tabula_team_members_user_id_idx on public.tabula_team_members(user_id);
create index if not exists tabula_team_members_email_idx on public.tabula_team_members(lower(email));
create index if not exists tabula_user_access_requests_org_id_idx on public.tabula_user_access_requests(org_id);
create index if not exists tabula_user_access_requests_requested_by_idx on public.tabula_user_access_requests(requested_by);

create or replace function private.tabula_has_active_teams_license(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.tabula_licenses l
    where l.org_id = p_org_id
      and l.license_type = 'teams'
      and l.status = 'active'
      and (l.expires_at is null or l.expires_at > now())
  );
$$;

create or replace function private.tabula_is_teams_org_admin(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.tabula_has_active_teams_license(p_org_id)
    and exists (
      select 1
      from public.tabula_memberships m
      where m.org_id = p_org_id
        and m.user_id = p_user_id
        and m.role = 'owner'
    );
$$;

create or replace function private.tabula_is_teams_site_admin(p_org_id uuid, p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.tabula_has_active_teams_license(p_org_id)
    and exists (
      select 1
      from public.tabula_memberships m
      where m.org_id = p_org_id
        and m.user_id = p_user_id
        and m.role = 'admin'
    );
$$;

create or replace function private.tabula_teams_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function private.tabula_resolve_team_member_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  matched_user_id uuid;
  membership_role text;
begin
  select u.id into matched_user_id
  from auth.users u
  where lower(u.email) = lower(new.email)
  limit 1;

  if matched_user_id is not null then
    new.user_id := matched_user_id;
    new.status := case when new.status = 'inactive' then 'inactive' else 'active' end;
    membership_role := case when new.role = 'site_admin' then 'admin' else 'member' end;

    insert into public.tabula_memberships (org_id, user_id, role)
    values (new.org_id, matched_user_id, membership_role)
    on conflict do nothing;

    update public.tabula_memberships
    set role = case
      when role = 'owner' then 'owner'
      when new.role = 'site_admin' then 'admin'
      else role
    end
    where org_id = new.org_id
      and user_id = matched_user_id;
  end if;

  return new;
end;
$$;

create or replace function private.tabula_activate_pending_team_members_for_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  assignment record;
  membership_role text;
begin
  for assignment in
    select tm.id, tm.org_id, tm.role
    from public.tabula_team_members tm
    where tm.user_id is null
      and lower(tm.email) = lower(new.email)
      and tm.status <> 'inactive'
  loop
    membership_role := case when assignment.role = 'site_admin' then 'admin' else 'member' end;

    insert into public.tabula_memberships (org_id, user_id, role)
    values (assignment.org_id, new.id, membership_role)
    on conflict do nothing;

    update public.tabula_memberships
    set role = case
      when role = 'owner' then 'owner'
      when assignment.role = 'site_admin' then 'admin'
      else role
    end
    where org_id = assignment.org_id
      and user_id = new.id;

    update public.tabula_team_members
    set user_id = new.id,
        status = 'active',
        updated_at = now()
    where id = assignment.id;
  end loop;

  return new;
end;
$$;

revoke all on function private.tabula_has_active_teams_license(uuid) from public;
revoke all on function private.tabula_is_teams_org_admin(uuid, uuid) from public;
revoke all on function private.tabula_is_teams_site_admin(uuid, uuid) from public;
revoke all on function private.tabula_teams_touch_updated_at() from public;
revoke all on function private.tabula_resolve_team_member_user() from public;
revoke all on function private.tabula_activate_pending_team_members_for_user() from public;

grant usage on schema private to authenticated;
grant execute on function private.tabula_has_active_teams_license(uuid) to authenticated;
grant execute on function private.tabula_is_teams_org_admin(uuid, uuid) to authenticated;
grant execute on function private.tabula_is_teams_site_admin(uuid, uuid) to authenticated;

drop trigger if exists tabula_org_setups_touch_updated_at on public.tabula_org_setups;
create trigger tabula_org_setups_touch_updated_at
before update on public.tabula_org_setups
for each row execute function private.tabula_teams_touch_updated_at();

drop trigger if exists tabula_team_members_touch_updated_at on public.tabula_team_members;
create trigger tabula_team_members_touch_updated_at
before update on public.tabula_team_members
for each row execute function private.tabula_teams_touch_updated_at();

drop trigger if exists tabula_team_members_resolve_user on public.tabula_team_members;
create trigger tabula_team_members_resolve_user
before insert or update of email, role, status on public.tabula_team_members
for each row execute function private.tabula_resolve_team_member_user();

drop trigger if exists tabula_user_access_requests_touch_updated_at on public.tabula_user_access_requests;
create trigger tabula_user_access_requests_touch_updated_at
before update on public.tabula_user_access_requests
for each row execute function private.tabula_teams_touch_updated_at();

drop trigger if exists tabula_activate_pending_team_members on auth.users;
create trigger tabula_activate_pending_team_members
after insert or update of email on auth.users
for each row execute function private.tabula_activate_pending_team_members_for_user();

alter table public.tabula_org_setups enable row level security;
alter table public.tabula_team_members enable row level security;
alter table public.tabula_user_access_requests enable row level security;

grant select, insert, update, delete on public.tabula_org_setups to authenticated;
grant select, insert, update, delete on public.tabula_team_members to authenticated;
grant select, insert, update on public.tabula_user_access_requests to authenticated;

create policy "Teams members can view organization setup"
on public.tabula_org_setups for select to authenticated
using (
  private.tabula_has_active_teams_license(org_id)
  and public.tabula_is_org_member(org_id)
);

create policy "Teams Org Admin can create organization setup"
on public.tabula_org_setups for insert to authenticated
with check (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Org Admin can update organization setup"
on public.tabula_org_setups for update to authenticated
using (private.tabula_is_teams_org_admin(org_id))
with check (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Org Admin can delete organization setup"
on public.tabula_org_setups for delete to authenticated
using (private.tabula_is_teams_org_admin(org_id));

create policy "Teams members can view team assignments"
on public.tabula_team_members for select to authenticated
using (
  private.tabula_has_active_teams_license(org_id)
  and public.tabula_is_org_member(org_id)
);

create policy "Teams Org Admin can create team assignments"
on public.tabula_team_members for insert to authenticated
with check (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Org Admin can update team assignments"
on public.tabula_team_members for update to authenticated
using (private.tabula_is_teams_org_admin(org_id))
with check (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Org Admin can delete team assignments"
on public.tabula_team_members for delete to authenticated
using (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Org Admin can view all access requests"
on public.tabula_user_access_requests for select to authenticated
using (private.tabula_is_teams_org_admin(org_id));

create policy "Teams Site Admin can view own access requests"
on public.tabula_user_access_requests for select to authenticated
using (
  private.tabula_is_teams_site_admin(org_id)
  and requested_by = auth.uid()
);

create policy "Teams Site Admin can submit access requests"
on public.tabula_user_access_requests for insert to authenticated
with check (
  private.tabula_is_teams_site_admin(org_id)
  and requested_by = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
);

create policy "Teams Org Admin can review access requests"
on public.tabula_user_access_requests for update to authenticated
using (private.tabula_is_teams_org_admin(org_id))
with check (private.tabula_is_teams_org_admin(org_id));
