-- Supabase migration: quotations table + RLS policies
-- JWT key id (kid): 246ae551-0227-4405-b91f-824d8d43e9fe

create extension if not exists pgcrypto;

create table if not exists public.quotations (
  id text primary key default (
    'QT-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  client text not null,
  organization text not null,
  product text not null,
  amount numeric(12, 2) not null default 0 check (amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'review', 'sent', 'accepted', 'expired')),
  expiry text not null default '-',
  color text not null default '#3b82f6',
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  line_items jsonb not null default '[]'::jsonb,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists quotations_set_updated_at on public.quotations;
create trigger quotations_set_updated_at
before update on public.quotations
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table public.quotations enable row level security;

-- Allow authenticated users to read only their own quotations.
drop policy if exists quotations_select_own on public.quotations;
create policy quotations_select_own
on public.quotations
for select
to authenticated
using (auth.uid() = user_id);

-- Allow authenticated users to insert quotations for themselves.
drop policy if exists quotations_insert_own on public.quotations;
create policy quotations_insert_own
on public.quotations
for insert
to authenticated
with check (auth.uid() = user_id);

-- Allow authenticated users to update only their own quotations.
drop policy if exists quotations_update_own on public.quotations;
create policy quotations_update_own
on public.quotations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Optional delete policy (kept explicit for completeness).
drop policy if exists quotations_delete_own on public.quotations;
create policy quotations_delete_own
on public.quotations
for delete
to authenticated
using (auth.uid() = user_id);

create index if not exists quotations_user_id_idx on public.quotations (user_id);
create index if not exists quotations_created_at_idx on public.quotations (created_at desc);
create index if not exists quotations_status_idx on public.quotations (status);
