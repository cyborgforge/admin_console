-- Seed migration: insert dummy clients into public.clients
-- This seeds records for the first existing auth user.

with seed_user as (
  select id as user_id
  from auth.users
  order by created_at asc
  limit 1
)
insert into public.clients (
  id,
  user_id,
  name,
  role,
  organization,
  industry,
  city,
  email,
  phone,
  status,
  product,
  total_billed,
  quotes_count,
  since_label,
  color,
  gst,
  notes
)
select
  seed_rows.id,
  seed_user.user_id,
  seed_rows.name,
  seed_rows.role,
  seed_rows.organization,
  seed_rows.industry,
  seed_rows.city,
  seed_rows.email,
  seed_rows.phone,
  seed_rows.status,
  seed_rows.product,
  seed_rows.total_billed,
  seed_rows.quotes_count,
  seed_rows.since_label,
  seed_rows.color,
  seed_rows.gst,
  seed_rows.notes
from seed_user
cross join (
  values
    ('CL-001', 'Ravi Kumar', 'Procurement Head', 'Apollo Pharmacy', 'Pharmacy', 'Chennai', 'ravi@apollo.in', '+91 98765 11111', 'active', 'Pharmacy Suite', 116400.00, 3, 'Jan 2024', '#3b82f6', '33AABCA0000A1Z5', 'Key account. Interested in delivery module add-on.'),
    ('CL-002', 'Dr. Priya Nair', 'Medical Director', 'Green Cross Clinic', 'Clinic', 'Kochi', 'priya@greencross.in', '+91 98765 22222', 'active', 'Clinic Suite', 69000.00, 2, 'Feb 2024', '#10b981', '32AABCB0000A1Z5', 'Expanding to a second branch in Q3.'),
    ('CL-003', 'Suresh Mehta', 'Operations Manager', 'MedPlus Pharma', 'Pharmacy', 'Mumbai', 'suresh@medplus.in', '+91 98765 33333', 'active', 'Pharmacy Suite', 51920.00, 1, 'Mar 2024', '#8b5cf6', '27AABCC0000A1Z5', 'Fast decision cycle. Responded well to demo.'),
    ('CL-004', 'Ananya Singh', 'CEO', 'City Hospital', 'Clinic', 'Delhi', 'ananya@cityhospital.in', '+91 98765 44444', 'prospect', 'Clinic Suite', 0.00, 1, 'Mar 2025', '#f59e0b', '-', 'In evaluation phase. Quote pending approval.'),
    ('CL-005', 'Kartik Rao', 'Retail Head', 'Reliance Retail', 'Retail', 'Bangalore', 'kartik@reliance.in', '+91 98765 55555', 'prospect', 'Retail Suite', 0.00, 1, 'Mar 2025', '#ef4444', '29AABCE0000A1Z5', 'Large deal in review by finance team.'),
    ('CL-006', 'Meena Iyer', 'Director', 'Wellness First', 'Pharmacy', 'Hyderabad', 'meena@wellnessfirst.in', '+91 98765 66666', 'churned', 'Pharmacy Suite', 41600.00, 2, 'Sep 2023', '#6b7280', '36AABCF0000A1Z5', 'Contract ended. May re-engage for retail suite.'),
    ('CL-007', 'Dr. Arun Thomas', 'Hospital Admin', 'Lifeline Hospital', 'Clinic', 'Trivandrum', 'arun@lifeline.in', '+91 98765 77777', 'active', 'Clinic Suite', 55000.00, 1, 'Feb 2024', '#10b981', '32AABCG0000A1Z5', 'Happy customer. Referred two new prospects.'),
    ('CL-008', 'Vikram Shetty', 'Owner', 'Quick Mart', 'Retail', 'Mangalore', 'vikram@quickmart.in', '+91 98765 88888', 'active', 'Retail Suite', 38750.00, 1, 'Jan 2025', '#f59e0b', '29AABCH0000A1Z5', 'Wants online ordering integration urgently.')
) as seed_rows(
  id,
  name,
  role,
  organization,
  industry,
  city,
  email,
  phone,
  status,
  product,
  total_billed,
  quotes_count,
  since_label,
  color,
  gst,
  notes
)
on conflict (id) do nothing;
