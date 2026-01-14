-- Add metadata column to expenses and invoices to store dynamic AI fields
-- This enables storing "Exhaustive Mode" extraction results

alter table expenses 
add column if not exists metadata jsonb default '{}'::jsonb;

alter table invoices 
add column if not exists metadata jsonb default '{}'::jsonb;
