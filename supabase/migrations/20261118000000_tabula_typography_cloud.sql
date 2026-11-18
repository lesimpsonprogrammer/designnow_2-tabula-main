-- Tabula Typography Studio cloud persistence (per user, per organization).
create table if not exists public.tabula_typography_designs (
  org_id uuid not null references public.tabula_organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  design jsonb not null,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (org_id, user_id),
  constraint tabula_typography_design_object check (jsonb_typeof(design) = 'object'),
  constraint tabula_typography_design_size check (octet_length(design::text) <= 8192)
);
create index if not exists tabula_typography_designs_user_idx on public.tabula_typography_designs(user_id);
alter table public.tabula_typography_designs enable row level security;
revoke all on public.tabula_typography_designs from anon;
grant select, insert, update on public.tabula_typography_designs to authenticated;
create policy "Typography owners can read their own organization designs"
on public.tabula_typography_designs for select to authenticated
using (user_id = (select auth.uid()) and public.tabula_is_org_member(org_id));
create policy "Typography owners can create their own organization designs"
on public.tabula_typography_designs for insert to authenticated
with check (user_id = (select auth.uid()) and public.tabula_is_org_member(org_id) and revision = 1);
-- Revisions are advanced through a compare-and-swap RPC. Direct UPDATE is denied.
create or replace function public.tabula_save_typography_design(
 p_org_id uuid, p_design jsonb, p_expected_revision integer
) returns integer
language plpgsql security definer set search_path = ''
as $$
declare v_user uuid := auth.uid(); v_revision integer;
begin
 if v_user is null or not public.tabula_is_org_member(p_org_id) then
   raise exception 'Access denied' using errcode = '42501';
 end if;
 if p_design is null or jsonb_typeof(p_design) <> 'object' or octet_length(p_design::text) > 8192 then
   raise exception 'Invalid typography design';
 end if;
 if p_expected_revision = 0 then
   insert into public.tabula_typography_designs(org_id,user_id,design,revision)
   values(p_org_id,v_user,p_design,1)
   on conflict do nothing
   returning revision into v_revision;
 else
   update public.tabula_typography_designs
   set design=p_design,revision=revision+1,updated_at=now()
   where org_id=p_org_id and user_id=v_user and revision=p_expected_revision
   returning revision into v_revision;
 end if;
 if v_revision is null then
   raise exception 'Typography design changed on another device. Reload before saving.'
   using errcode = '40001';
 end if;
 return v_revision;
end;
$$;
revoke all on function public.tabula_save_typography_design(uuid,jsonb,integer) from public,anon;
grant execute on function public.tabula_save_typography_design(uuid,jsonb,integer) to authenticated;
