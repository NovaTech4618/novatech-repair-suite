create table if not exists public.technical_services (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  branch_id uuid not null references public.branches(id) on delete restrict,
  name text not null,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(company_id, branch_id, name)
);

alter table public.technical_services enable row level security;
create index if not exists technical_services_company_branch_idx on public.technical_services(company_id, branch_id, is_active);

drop policy if exists "Technical services visible in accessible branches" on public.technical_services;
create policy "Technical services visible in accessible branches" on public.technical_services
for select to authenticated
using (
  company_id = (select company_id from public.profiles where id = (select auth.uid()))
  and exists (select 1 from public.branches b where b.id = technical_services.branch_id and b.company_id = technical_services.company_id and b.is_active = true)
);

drop policy if exists "Technical services managed by authorized staff" on public.technical_services;
create policy "Technical services managed by authorized staff" on public.technical_services
for all to authenticated
using (
  company_id = (select company_id from public.profiles where id = (select auth.uid()))
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.company_id = technical_services.company_id and p.role in ('owner','branch_manager') and p.is_active = true)
)
with check (
  company_id = (select company_id from public.profiles where id = (select auth.uid()))
  and exists (select 1 from public.branches b where b.id = technical_services.branch_id and b.company_id = technical_services.company_id)
);

grant select, insert, update, delete on public.technical_services to authenticated;
