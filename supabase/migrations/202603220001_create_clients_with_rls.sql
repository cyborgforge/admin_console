-- Supabase migration: clients table + RLS policies

create table if not exists public.clients (
  id text primary key default (
    'CL-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  name text not null,
  role text not null default 'Owner',
  organization text not null,
  industry text not null default 'Pharmacy',
  city text not null default 'Chennai',
  email text not null,
  phone text not null default '+91 90000 00000',
  status text not null default 'prospect' check (status in ('active', 'prospect', 'churned')),
  product text not null default 'Pharmacy Suite',
  total_billed numeric(12, 2) not null default 0 check (total_billed >= 0),
  quotes_count integer not null default 0 check (quotes_count >= 0),
  since_label text not null default to_char(now(), 'Mon YYYY'),
  color text not null default '#3b82f6',
  gst text not null default '-',
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
before update on public.clients
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.clients enable row level security;

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own
on public.clients
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own
on public.clients
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own
on public.clients
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists clients_delete_own on public.clients;
create policy clients_delete_own
on public.clients
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_created_at_idx on public.clients (created_at desc);
create index if not exists clients_status_idx on public.clients (status);
