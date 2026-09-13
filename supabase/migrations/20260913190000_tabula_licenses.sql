create schema if not exists private;

create table public.tabula_platform_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.tabula_licenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null unique references public.tabula_organizations(id) on delete cascade,
  license_type text not null check (license_type in ('individual', 'teams')),
  status text not null default 'active' check (status in ('active', 'suspended', 'expired')),
  seat_limit integer not null,
  expires_at timestamptz,
  issued_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tabula_license_seats_check check (
    (license_type = 'individual' and seat_limit = 1)
    or (license_type = 'teams' and seat_limit >= 2)
  )
);

insert into public.tabula_platform_admins (user_id, created_by)
select id, id from auth.users
where lower(email) = 'larry.simpson@momentumdatasolutions.com'
on conflict (user_id) do nothing;

create or replace function private.tabula_is_platform_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.tabula_platform_admins
    where user_id = p_user_id
  );
$$;

revoke all on function private.tabula_is_platform_admin(uuid) from public;
grant usage on schema private to authenticated;
grant execute on function private.tabula_is_platform_admin(uuid) to authenticated;

create or replace function private.tabula_sync_license_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  update public.tabula_organizations
  set plan = case
    when new.status = 'active' and (new.expires_at is null or new.expires_at > now()) then 'active'
    else 'expired'
  end
  where id = new.org_id;
  return new;
end;
$$;

revoke all on function private.tabula_sync_license_plan() from public;

create trigger tabula_sync_license_plan
before insert or update on public.tabula_licenses
for each row execute function private.tabula_sync_license_plan();

alter table public.tabula_platform_admins enable row level security;
alter table public.tabula_licenses enable row level security;

grant select on public.tabula_platform_admins to authenticated;
grant select, insert, update on public.tabula_licenses to authenticated;

create policy "Platform admins can identify themselves"
on public.tabula_platform_admins for select to authenticated
using (user_id = auth.uid());

create policy "Members can view their organization license"
on public.tabula_licenses for select to authenticated
using (
  private.tabula_is_platform_admin()
  or public.tabula_is_org_member(org_id)
);

create policy "Platform admins can issue licenses"
on public.tabula_licenses for insert to authenticated
with check (private.tabula_is_platform_admin());

create policy "Platform admins can update licenses"
on public.tabula_licenses for update to authenticated
using (private.tabula_is_platform_admin())
with check (private.tabula_is_platform_admin());

create policy "Platform admins can view all organizations"
on public.tabula_organizations for select to authenticated
using (private.tabula_is_platform_admin());

create policy "Platform admins can view all memberships"
on public.tabula_memberships for select to authenticated
using (private.tabula_is_platform_admin());
