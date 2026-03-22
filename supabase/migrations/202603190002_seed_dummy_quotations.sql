-- Seed migration: insert dummy quotations into public.quotations
-- This seeds records for the first existing auth user.

with seed_user as (
  select id as user_id
  from auth.users
  order by created_at asc
  limit 1
)
insert into public.quotations (
  id,
  user_id,
  client,
  organization,
  product,
  amount,
  status,
  expiry,
  color,
  discount,
  line_items,
  notes
)
select
  seed_rows.id,
  seed_user.user_id,
  seed_rows.client,
  seed_rows.organization,
  seed_rows.product,
  seed_rows.amount,
  seed_rows.status,
  seed_rows.expiry,
  seed_rows.color,
  seed_rows.discount,
  seed_rows.line_items,
  seed_rows.notes
from seed_user
cross join (
  values
    (
      'QT-2025-048',
      'Apollo Pharmacy',
      'Apollo Health',
      'Pharmacy Suite',
      58200.00,
      'sent',
      'Apr 10, 2025',
      '#3b82f6',
      0.00,
      '[{"name":"Core Platform","quantity":1,"unitPrice":42000},{"name":"Delivery Module","quantity":1,"unitPrice":16200}]'::jsonb,
      'Prepared and sent to procurement team.'
    ),
    (
      'QT-2025-047',
      'Green Cross Clinic',
      'GCC Healthcare',
      'Clinic Suite',
      34500.00,
      'accepted',
      'Apr 5, 2025',
      '#10b981',
      1500.00,
      '[{"name":"Clinic Core","quantity":1,"unitPrice":22000},{"name":"Appointments","quantity":1,"unitPrice":14000}]'::jsonb,
      'Accepted with discount for annual contract.'
    ),
    (
      'QT-2025-046',
      'MedPlus Pharma',
      'MedPlus Pvt Ltd',
      'Pharmacy Suite',
      51920.00,
      'accepted',
      'Apr 19, 2025',
      '#8b5cf6',
      2080.00,
      '[{"name":"Core Platform","quantity":1,"unitPrice":35000},{"name":"Inventory Module","quantity":1,"unitPrice":19000}]'::jsonb,
      'Closed after technical review.'
    ),
    (
      'QT-2025-045',
      'City Hospital',
      'City Health Group',
      'Clinic Suite',
      29000.00,
      'draft',
      '-',
      '#f59e0b',
      0.00,
      '[{"name":"Clinic Core","quantity":1,"unitPrice":29000}]'::jsonb,
      'Draft pending final scope confirmation.'
    ),
    (
      'QT-2025-044',
      'Reliance Retail',
      'Reliance Industries',
      'Retail Suite',
      82000.00,
      'review',
      'Mar 28, 2025',
      '#ef4444',
      0.00,
      '[{"name":"Retail Core","quantity":1,"unitPrice":50000},{"name":"Warehouse Sync","quantity":1,"unitPrice":32000}]'::jsonb,
      'In review with finance and IT teams.'
    ),
    (
      'QT-2025-043',
      'Wellness First',
      'WF Pharma',
      'Pharmacy Suite',
      41600.00,
      'expired',
      'Mar 1, 2025',
      '#6b7280',
      0.00,
      '[{"name":"Core Platform","quantity":1,"unitPrice":28000},{"name":"Inventory Module","quantity":1,"unitPrice":13600}]'::jsonb,
      'Expired without response.'
    ),
    (
      'QT-2025-042',
      'Lifeline Hospital',
      'Lifeline Trust',
      'Clinic Suite',
      55000.00,
      'accepted',
      'Apr 22, 2025',
      '#10b981',
      0.00,
      '[{"name":"Clinic Core","quantity":1,"unitPrice":36000},{"name":"Billing Module","quantity":1,"unitPrice":19000}]'::jsonb,
      'Accepted. Implementation starts next month.'
    ),
    (
      'QT-2025-041',
      'Quick Mart',
      'Quick Retail Chain',
      'Retail Suite',
      38750.00,
      'sent',
      'Apr 8, 2025',
      '#f59e0b',
      1250.00,
      '[{"name":"Retail Core","quantity":1,"unitPrice":26000},{"name":"POS Add-on","quantity":1,"unitPrice":14000}]'::jsonb,
      'Sent and awaiting operations approval.'
    )
) as seed_rows(
  id,
  client,
  organization,
  product,
  amount,
  status,
  expiry,
  color,
  discount,
  line_items,
  notes
)
on conflict (id) do nothing;
