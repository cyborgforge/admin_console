-- Client onboarding module schema

create table if not exists public.onboarding_clients (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null,
  start_date timestamptz default current_timestamp,
  due_date timestamptz,
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Skipped')),
  forms_filled integer not null default 0 check (forms_filled >= 0),
  forms_total integer not null default 0 check (forms_total >= 0),
  documents_filled integer not null default 0 check (documents_filled >= 0),
  documents_total integer not null default 0 check (documents_total >= 0),
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  created_by uuid,
  constraint fk_onboarding_clients_client foreign key (client_id) references public.clients(id) on delete cascade
);

create table if not exists public.onboarding_forms_list (
  id uuid primary key default gen_random_uuid(),
  form_name varchar(255) not null,
  form_description text,
  template_version integer not null default 1 check (template_version > 0),
  is_active boolean not null default true,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  created_by uuid
);

create table if not exists public.onboarding_forms_assigned (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null,
  onboarding_id uuid not null,
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Skipped')),
  current_submission_id uuid,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  created_by uuid,
  constraint fk_onboarding_forms_assigned_form foreign key (form_id) references public.onboarding_forms_list(id) on delete cascade,
  constraint fk_onboarding_forms_assigned_onboarding foreign key (onboarding_id) references public.onboarding_clients(id) on delete cascade
);

create table if not exists public.onboarding_forms_response (
  id uuid primary key default gen_random_uuid(),
  form_assigned_id uuid not null,
  version_number integer not null default 1 check (version_number > 0),
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Skipped')),
  response_data jsonb not null default '{}'::jsonb,
  submitted_date timestamptz,
  review_note text,
  review_by uuid,
  review_date timestamptz,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  constraint fk_onboarding_forms_response_assigned foreign key (form_assigned_id) references public.onboarding_forms_assigned(id) on delete cascade
);

alter table if exists public.onboarding_forms_assigned
  add constraint fk_onboarding_forms_assigned_current_submission
  foreign key (current_submission_id) references public.onboarding_forms_response(id) on delete set null;

create table if not exists public.onboarding_documents_list (
  id uuid primary key default gen_random_uuid(),
  name varchar(255) not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  created_by uuid
);

create table if not exists public.onboarding_documents_assigned (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null,
  onboarding_id uuid not null,
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Skipped')),
  current_submission_id uuid,
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  created_by uuid,
  constraint fk_onboarding_documents_assigned_document foreign key (document_id) references public.onboarding_documents_list(id) on delete cascade,
  constraint fk_onboarding_documents_assigned_onboarding foreign key (onboarding_id) references public.onboarding_clients(id) on delete cascade
);

create table if not exists public.onboarding_documents_response (
  id uuid primary key default gen_random_uuid(),
  document_assigned_id uuid not null,
  version_number integer not null default 1 check (version_number > 0),
  status varchar(50) not null default 'Pending' check (status in ('Pending', 'In Progress', 'Under Review', 'Approved', 'Rejected', 'Skipped')),
  document_link text,
  due_date timestamptz,
  completed_at timestamptz,
  submission_count integer not null default 1 check (submission_count >= 0),
  submitted_date timestamptz,
  review_note text,
  review_by uuid,
  review_date timestamptz,
  created_at timestamptz default current_timestamp,
  updated_at timestamptz default current_timestamp,
  constraint fk_onboarding_documents_response_assigned foreign key (document_assigned_id) references public.onboarding_documents_assigned(id) on delete cascade
);

alter table if exists public.onboarding_documents_assigned
  add constraint fk_onboarding_documents_assigned_current_submission
  foreign key (current_submission_id) references public.onboarding_documents_response(id) on delete set null;

create index if not exists idx_onboarding_clients_client_id on public.onboarding_clients(client_id);
create index if not exists idx_onboarding_clients_status on public.onboarding_clients(status);
create index if not exists idx_onboarding_forms_assigned_onboarding_id on public.onboarding_forms_assigned(onboarding_id);
create index if not exists idx_onboarding_forms_assigned_status on public.onboarding_forms_assigned(status);
create index if not exists idx_onboarding_forms_response_assigned_id on public.onboarding_forms_response(form_assigned_id);
create index if not exists idx_onboarding_documents_assigned_onboarding_id on public.onboarding_documents_assigned(onboarding_id);
create index if not exists idx_onboarding_documents_assigned_status on public.onboarding_documents_assigned(status);
create index if not exists idx_onboarding_documents_response_assigned_id on public.onboarding_documents_response(document_assigned_id);

alter table public.onboarding_clients enable row level security;
alter table public.onboarding_forms_list enable row level security;
alter table public.onboarding_forms_assigned enable row level security;
alter table public.onboarding_forms_response enable row level security;
alter table public.onboarding_documents_list enable row level security;
alter table public.onboarding_documents_assigned enable row level security;
alter table public.onboarding_documents_response enable row level security;

create policy "Users can view onboarding clients" on public.onboarding_clients for select using (true);
create policy "Users can create onboarding clients" on public.onboarding_clients for insert with check (true);
create policy "Users can update onboarding clients" on public.onboarding_clients for update using (true) with check (true);
create policy "Users can delete onboarding clients" on public.onboarding_clients for delete using (true);

create policy "Users can view onboarding forms list" on public.onboarding_forms_list for select using (true);
create policy "Users can create onboarding forms list" on public.onboarding_forms_list for insert with check (true);
create policy "Users can update onboarding forms list" on public.onboarding_forms_list for update using (true) with check (true);
create policy "Users can delete onboarding forms list" on public.onboarding_forms_list for delete using (true);

create policy "Users can view onboarding forms assigned" on public.onboarding_forms_assigned for select using (true);
create policy "Users can create onboarding forms assigned" on public.onboarding_forms_assigned for insert with check (true);
create policy "Users can update onboarding forms assigned" on public.onboarding_forms_assigned for update using (true) with check (true);
create policy "Users can delete onboarding forms assigned" on public.onboarding_forms_assigned for delete using (true);

create policy "Users can view onboarding forms response" on public.onboarding_forms_response for select using (true);
create policy "Users can create onboarding forms response" on public.onboarding_forms_response for insert with check (true);
create policy "Users can update onboarding forms response" on public.onboarding_forms_response for update using (true) with check (true);
create policy "Users can delete onboarding forms response" on public.onboarding_forms_response for delete using (true);

create policy "Users can view onboarding documents list" on public.onboarding_documents_list for select using (true);
create policy "Users can create onboarding documents list" on public.onboarding_documents_list for insert with check (true);
create policy "Users can update onboarding documents list" on public.onboarding_documents_list for update using (true) with check (true);
create policy "Users can delete onboarding documents list" on public.onboarding_documents_list for delete using (true);

create policy "Users can view onboarding documents assigned" on public.onboarding_documents_assigned for select using (true);
create policy "Users can create onboarding documents assigned" on public.onboarding_documents_assigned for insert with check (true);
create policy "Users can update onboarding documents assigned" on public.onboarding_documents_assigned for update using (true) with check (true);
create policy "Users can delete onboarding documents assigned" on public.onboarding_documents_assigned for delete using (true);

create policy "Users can view onboarding documents response" on public.onboarding_documents_response for select using (true);
create policy "Users can create onboarding documents response" on public.onboarding_documents_response for insert with check (true);
create policy "Users can update onboarding documents response" on public.onboarding_documents_response for update using (true) with check (true);
create policy "Users can delete onboarding documents response" on public.onboarding_documents_response for delete using (true);
