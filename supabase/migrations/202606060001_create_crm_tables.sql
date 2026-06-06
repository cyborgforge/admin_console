-- CRM prototype schema expansion: leads, contacts, deals, branches, and client/quotation attribute updates.

create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.leads (
  id text primary key default (
    'LD-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  lead_name text not null,
  company text not null,
  job_title text not null default '',
  email text not null,
  phone text not null default '',
  source text not null default '',
  status text not null default 'discovery' check (status in ('discovery', 'contacted', 'reviewing', 'closed-won', 'closed-lost')),
  assigned_to text not null default '',
  created_date date not null default current_date,
  last_activity_at timestamptz,
  last_activity_name text not null default '',
  next_follow_up date,
  state text not null default '',
  city text not null default '',
  tags text not null default '',
  product_interest text not null default 'Pharmacy' check (product_interest in ('Pharmacy', 'Hospital', 'Others')),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row
execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.contacts (
  id text primary key default (
    'CT-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  name text not null,
  designation text not null default '',
  department text not null default '',
  email text not null,
  mobile text not null default '',
  phone text not null default '',
  linkedin text not null default '',
  client_id text,
  branch_id text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists contacts_set_updated_at on public.contacts;
create trigger contacts_set_updated_at
before update on public.contacts
for each row
execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.branches (
  id text primary key default (
    'BR-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  client_id text not null,
  branch_name text not null,
  email text not null default '',
  phone text not null default '',
  address_line_1 text not null default '',
  city text not null default '',
  state text not null default '',
  country text not null default '',
  postal_code text not null default '',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at
before update on public.branches
for each row
execute procedure public.set_current_timestamp_updated_at();

create table if not exists public.deals (
  id text primary key default (
    'DL-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  user_id uuid not null default auth.uid(),
  deal_name text not null,
  client_id text,
  branch_id text,
  primary_contact_id text,
  stage text not null default 'new' check (stage in ('new', 'quote sent', 'negotiation', 'reviewing', 'hold', 'won', 'lost')),
  expected_value numeric(12, 2) not null default 0 check (expected_value >= 0),
  source_lead_id text,
  assigned_to text not null default '',
  description text not null default '',
  current_quotation_id text,
  lost_reason text not null default '',
  won_date date,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists deals_set_updated_at on public.deals;
create trigger deals_set_updated_at
before update on public.deals
for each row
execute procedure public.set_current_timestamp_updated_at();

alter table if exists public.clients
  add column if not exists company_name text not null default '',
  add column if not exists website text not null default '',
  add column if not exists gst_number text not null default '',
  add column if not exists company_size text not null default '',
  add column if not exists address_line_1 text not null default '',
  add column if not exists state text not null default '',
  add column if not exists country text not null default '',
  add column if not exists postal_code text not null default '',
  add column if not exists created_by uuid default auth.uid();

alter table if exists public.quotations
  add column if not exists quotation_number text not null default (
    'QTN-' || to_char(now(), 'YYYY') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6))
  ),
  add column if not exists deal_id text,
  add column if not exists client_id text,
  add column if not exists branch_id text,
  add column if not exists contact_id text,
  add column if not exists quotation_date date not null default current_date,
  add column if not exists valid_until date,
  add column if not exists subtotal_amount numeric(12, 2) not null default 0 check (subtotal_amount >= 0),
  add column if not exists discount_amount numeric(12, 2) not null default 0 check (discount_amount >= 0),
  add column if not exists tax_amount numeric(12, 2) not null default 0 check (tax_amount >= 0),
  add column if not exists total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  add column if not exists currency text not null default 'INR',
  add column if not exists created_by uuid default auth.uid();

alter table public.contacts
  add constraint contacts_client_id_fkey foreign key (client_id) references public.clients(id) on delete set null,
  add constraint contacts_branch_id_fkey foreign key (branch_id) references public.branches(id) on delete set null;

alter table public.branches
  add constraint branches_client_id_fkey foreign key (client_id) references public.clients(id) on delete cascade;

alter table public.deals
  add constraint deals_client_id_fkey foreign key (client_id) references public.clients(id) on delete set null,
  add constraint deals_branch_id_fkey foreign key (branch_id) references public.branches(id) on delete set null,
  add constraint deals_primary_contact_id_fkey foreign key (primary_contact_id) references public.contacts(id) on delete set null,
  add constraint deals_source_lead_id_fkey foreign key (source_lead_id) references public.leads(id) on delete set null,
  add constraint deals_current_quotation_id_fkey foreign key (current_quotation_id) references public.quotations(id) on delete set null;

alter table public.quotations
  add constraint quotations_deal_id_fkey foreign key (deal_id) references public.deals(id) on delete set null,
  add constraint quotations_client_id_fkey foreign key (client_id) references public.clients(id) on delete set null,
  add constraint quotations_branch_id_fkey foreign key (branch_id) references public.branches(id) on delete set null,
  add constraint quotations_contact_id_fkey foreign key (contact_id) references public.contacts(id) on delete set null;

alter table public.leads enable row level security;
alter table public.contacts enable row level security;
alter table public.branches enable row level security;
alter table public.deals enable row level security;

drop policy if exists leads_select_own on public.leads;
create policy leads_select_own on public.leads for select to authenticated using (auth.uid() = user_id);
drop policy if exists leads_insert_own on public.leads;
create policy leads_insert_own on public.leads for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists leads_update_own on public.leads;
create policy leads_update_own on public.leads for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists leads_delete_own on public.leads;
create policy leads_delete_own on public.leads for delete to authenticated using (auth.uid() = user_id);

drop policy if exists contacts_select_own on public.contacts;
create policy contacts_select_own on public.contacts for select to authenticated using (auth.uid() = user_id);
drop policy if exists contacts_insert_own on public.contacts;
create policy contacts_insert_own on public.contacts for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists contacts_update_own on public.contacts;
create policy contacts_update_own on public.contacts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists contacts_delete_own on public.contacts;
create policy contacts_delete_own on public.contacts for delete to authenticated using (auth.uid() = user_id);

drop policy if exists branches_select_own on public.branches;
create policy branches_select_own on public.branches for select to authenticated using (auth.uid() = user_id);
drop policy if exists branches_insert_own on public.branches;
create policy branches_insert_own on public.branches for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists branches_update_own on public.branches;
create policy branches_update_own on public.branches for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists branches_delete_own on public.branches;
create policy branches_delete_own on public.branches for delete to authenticated using (auth.uid() = user_id);

drop policy if exists deals_select_own on public.deals;
create policy deals_select_own on public.deals for select to authenticated using (auth.uid() = user_id);
drop policy if exists deals_insert_own on public.deals;
create policy deals_insert_own on public.deals for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists deals_update_own on public.deals;
create policy deals_update_own on public.deals for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists deals_delete_own on public.deals;
create policy deals_delete_own on public.deals for delete to authenticated using (auth.uid() = user_id);

create index if not exists leads_user_id_idx on public.leads (user_id);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_date_idx on public.leads (created_date desc);
create index if not exists leads_next_follow_up_idx on public.leads (next_follow_up);

create index if not exists contacts_user_id_idx on public.contacts (user_id);
create index if not exists contacts_client_id_idx on public.contacts (client_id);
create index if not exists contacts_branch_id_idx on public.contacts (branch_id);
create index if not exists contacts_email_idx on public.contacts (email);

create index if not exists branches_user_id_idx on public.branches (user_id);
create index if not exists branches_client_id_idx on public.branches (client_id);

create index if not exists deals_user_id_idx on public.deals (user_id);
create index if not exists deals_client_id_idx on public.deals (client_id);
create index if not exists deals_branch_id_idx on public.deals (branch_id);
create index if not exists deals_stage_idx on public.deals (stage);
create index if not exists deals_source_lead_id_idx on public.deals (source_lead_id);
create index if not exists deals_current_quotation_id_idx on public.deals (current_quotation_id);

create index if not exists clients_company_name_idx on public.clients (company_name);
create index if not exists clients_created_by_idx on public.clients (created_by);

create index if not exists quotations_quotation_number_idx on public.quotations (quotation_number);
create index if not exists quotations_deal_id_idx on public.quotations (deal_id);
create index if not exists quotations_client_id_idx on public.quotations (client_id);
create index if not exists quotations_branch_id_idx on public.quotations (branch_id);
create index if not exists quotations_contact_id_idx on public.quotations (contact_id);
create index if not exists quotations_created_by_idx on public.quotations (created_by);