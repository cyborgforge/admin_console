-- Migration to rename finish_date column to due_date in onboarding_clients table

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'onboarding_clients'
      and column_name = 'finish_date'
  ) then
    alter table public.onboarding_clients rename column finish_date to due_date;
  elsif not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'onboarding_clients'
      and column_name = 'due_date'
  ) then
    alter table public.onboarding_clients add column due_date timestamptz;
  end if;
end $$;
