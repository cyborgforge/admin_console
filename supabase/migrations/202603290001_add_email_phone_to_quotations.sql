-- Add email and phone fields to quotations so Bill To can show backend contact details
alter table if exists public.quotations
  add column if not exists email text not null default '',
  add column if not exists phone text not null default '';

create index if not exists quotations_email_idx on public.quotations (email);
