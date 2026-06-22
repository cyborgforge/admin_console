-- Supabase migration: deals and activities tables + RLS policies

-- Create public.deals table
create table if not exists public.deals (
  id text primary key default (
    'DL-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  client_id text not null references public.clients(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  name text not null,
  value numeric(12, 2) not null default 0 check (value >= 0),
  stage text not null check (stage in ('Prospect', 'Qualified', 'Proposal', 'Negotiation', 'Closed Won')),
  expected_close_date date,
  notes text default '',
  priority text not null default 'medium' check (priority in ('high', 'medium', 'low')),
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.deals enable row level security;

-- RLS policies for deals
drop policy if exists deals_select_own on public.deals;
create policy deals_select_own on public.deals
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists deals_insert_own on public.deals;
create policy deals_insert_own on public.deals
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists deals_update_own on public.deals;
create policy deals_update_own on public.deals
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists deals_delete_own on public.deals;
create policy deals_delete_own on public.deals
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists deals_client_id_idx on public.deals (client_id);
create index if not exists deals_user_id_idx on public.deals (user_id);
create index if not exists deals_stage_idx on public.deals (stage);


-- Create public.activities table
create table if not exists public.activities (
  id text primary key default (
    'AC-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  client_id text not null references public.clients(id) on delete cascade,
  user_id uuid not null default auth.uid(),
  type text not null check (type in ('Call', 'Email', 'Meeting', 'Task', 'Note')),
  title text not null,
  description text default '',
  date_time timestamptz not null default timezone('utc', now()),
  assigned_user text not null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.activities enable row level security;

-- RLS policies for activities
drop policy if exists activities_select_own on public.activities;
create policy activities_select_own on public.activities
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists activities_insert_own on public.activities;
create policy activities_insert_own on public.activities
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists activities_update_own on public.activities;
create policy activities_update_own on public.activities
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists activities_delete_own on public.activities;
create policy activities_delete_own on public.activities
  for delete to authenticated using (auth.uid() = user_id);

create index if not exists activities_client_id_idx on public.activities (client_id);
create index if not exists activities_user_id_idx on public.activities (user_id);
create index if not exists activities_created_at_idx on public.activities (created_at desc);
