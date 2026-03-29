-- Add sent_at column to quotations table to track when quotations are sent to clients
alter table if exists public.quotations
  add column if not exists sent_at timestamp with time zone;

create index if not exists quotations_sent_at_idx on public.quotations (sent_at);
