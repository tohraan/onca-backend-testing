-- Migration 008: Consolidate master_transactions into directive-based tables
-- Date: 2026-01-14
-- Purpose: Migrate data from master_transactions to proper layered architecture

-- ============================================================================
-- STEP 1: Backup master_transactions
-- ============================================================================

CREATE TABLE IF NOT EXISTS master_transactions_backup AS 
SELECT * FROM master_transactions;

-- ============================================================================
-- STEP 2: Ensure directive tables have all necessary columns
-- ============================================================================

-- Add source tracking columns to directive tables if not exists
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'MANUAL';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS row_index INTEGER;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS context TEXT;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'MANUAL';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS row_index INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15, 2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ref_id TEXT;

ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'MANUAL';
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS row_index INTEGER;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15, 2);
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS context TEXT;

-- ============================================================================
-- STEP 3: Migrate data from master_transactions to directive tables
-- ============================================================================

-- 3A: Migrate INCOME transactions to invoices (RECEIVABLE)
INSERT INTO invoices (
    org_id,
    invoice_type,
    counterparty_name,
    invoice_number,
    amount,
    tax_amount,
    invoice_date,
    due_date,
    status,
    source,
    notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    payment_mode,
    context,
    created_at,
    updated_at
)
SELECT 
    org_id,
    'RECEIVABLE' as invoice_type,
    entity as counterparty_name,
    ref_id as invoice_number,
    amount,
    gst_amount as tax_amount,
    date as invoice_date,
    date + INTERVAL '30 days' as due_date, -- Default 30 day payment terms
    CASE 
        WHEN status = 'completed' THEN 'PAID'
        WHEN status = 'pending' THEN 'UNPAID'
        ELSE 'UNPAID'
    END as status,
    'MANUAL' as source,
    COALESCE(description, context) as notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    payment_mode,
    context,
    created_at,
    updated_at
FROM master_transactions
WHERE type = 'income'
ON CONFLICT DO NOTHING;

-- 3B: Migrate EXPENSE transactions to expenses table
INSERT INTO expenses (
    org_id,
    expense_date,
    amount,
    category,
    vendor_name,
    payment_method,
    status,
    notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    ref_id,
    created_at,
    updated_at
)
SELECT 
    org_id,
    date as expense_date,
    amount,
    CASE 
        WHEN category ILIKE '%office%' THEN 'OFFICE'
        WHEN category ILIKE '%travel%' THEN 'TRAVEL'
        WHEN category ILIKE '%software%' OR category ILIKE '%tech%' THEN 'SOFTWARE'
        WHEN category ILIKE '%marketing%' OR category ILIKE '%ads%' THEN 'MARKETING'
        WHEN category ILIKE '%utilities%' OR category ILIKE '%rent%' THEN 'UTILITIES'
        ELSE 'MISC'
    END as category,
    entity as vendor_name,
    CASE 
        WHEN payment_mode ILIKE '%cash%' THEN 'CASH'
        WHEN payment_mode ILIKE '%card%' THEN 'CARD'
        WHEN payment_mode ILIKE '%bank%' OR payment_mode ILIKE '%transfer%' THEN 'BANK'
        ELSE 'UNKNOWN'
    END as payment_method,
    CASE 
        WHEN status = 'completed' THEN 'RECONCILED'
        ELSE 'UNRECONCILED'
    END as status,
    COALESCE(description, context) as notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    ref_id,
    created_at,
    updated_at
FROM master_transactions
WHERE type = 'expense'
ON CONFLICT DO NOTHING;

-- 3C: Migrate SALARY transactions to expenses (PAYROLL category)
INSERT INTO expenses (
    org_id,
    expense_date,
    amount,
    category,
    vendor_name,
    payment_method,
    status,
    notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    ref_id,
    created_at,
    updated_at
)
SELECT 
    org_id,
    date as expense_date,
    amount,
    'MISC' as category, -- We'll use notes to indicate it's salary
    entity as vendor_name,
    CASE 
        WHEN payment_mode ILIKE '%cash%' THEN 'CASH'
        WHEN payment_mode ILIKE '%card%' THEN 'CARD'
        WHEN payment_mode ILIKE '%bank%' OR payment_mode ILIKE '%transfer%' THEN 'BANK'
        ELSE 'UNKNOWN'
    END as payment_method,
    CASE 
        WHEN status = 'completed' THEN 'RECONCILED'
        ELSE 'UNRECONCILED'
    END as status,
    'SALARY: ' || COALESCE(description, context, '') as notes,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    ref_id,
    created_at,
    updated_at
FROM master_transactions
WHERE type = 'salary'
ON CONFLICT DO NOTHING;

-- 3D: Migrate TRANSFER and OTHER to manual_ledger_entries
INSERT INTO manual_ledger_entries (
    org_id,
    type,
    amount,
    counterparty,
    transaction_date,
    invoice_number,
    category,
    notes,
    payment_mode,
    status,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    created_at,
    updated_at
)
SELECT 
    org_id,
    CASE 
        WHEN type = 'transfer' THEN 'EXPENSE' -- Treat as expense for now
        ELSE 'EXPENSE'
    END as type,
    amount,
    entity as counterparty,
    date as transaction_date,
    ref_id as invoice_number,
    category,
    COALESCE(description, context) as notes,
    payment_mode,
    CASE 
        WHEN status = 'completed' THEN 'PAID'
        WHEN status = 'pending' THEN 'OPEN'
        ELSE 'OPEN'
    END as status,
    source_type,
    source_id,
    row_index,
    gst_percent,
    gst_amount,
    context,
    created_at,
    updated_at
FROM master_transactions
WHERE type IN ('transfer', 'other')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- STEP 4: Verification Queries
-- ============================================================================

-- Count records in each table
DO $$
DECLARE
    master_count INTEGER;
    invoice_count INTEGER;
    expense_count INTEGER;
    ledger_count INTEGER;
    total_migrated INTEGER;
BEGIN
    SELECT COUNT(*) INTO master_count FROM master_transactions;
    SELECT COUNT(*) INTO invoice_count FROM invoices WHERE source_type != 'MANUAL';
    SELECT COUNT(*) INTO expense_count FROM expenses WHERE source_type != 'MANUAL';
    SELECT COUNT(*) INTO ledger_count FROM manual_ledger_entries WHERE source_type != 'MANUAL';
    
    total_migrated := invoice_count + expense_count + ledger_count;
    
    RAISE NOTICE 'Migration Summary:';
    RAISE NOTICE '  master_transactions records: %', master_count;
    RAISE NOTICE '  Migrated to invoices: %', invoice_count;
    RAISE NOTICE '  Migrated to expenses: %', expense_count;
    RAISE NOTICE '  Migrated to manual_ledger: %', ledger_count;
    RAISE NOTICE '  Total migrated: %', total_migrated;
    
    IF total_migrated < master_count THEN
        RAISE WARNING 'Some records may not have been migrated. Please review.';
    END IF;
END $$;

-- ============================================================================
-- STEP 5: Create view for backward compatibility (temporary)
-- ============================================================================

CREATE OR REPLACE VIEW master_transactions_view AS
SELECT 
    id,
    org_id,
    source_type,
    source_id,
    row_index,
    invoice_date as date,
    invoice_number as ref_id,
    counterparty_name as entity,
    notes as description,
    amount,
    'INR' as currency,
    'income' as type,
    NULL as category,
    payment_mode,
    NULL as doc_link,
    CASE 
        WHEN status = 'PAID' THEN 'completed'
        ELSE 'pending'
    END as status,
    gst_percent,
    tax_amount as gst_amount,
    context,
    created_at,
    updated_at
FROM invoices
WHERE invoice_type = 'RECEIVABLE'

UNION ALL

SELECT 
    id,
    org_id,
    source_type,
    source_id,
    row_index,
    expense_date as date,
    ref_id,
    vendor_name as entity,
    notes as description,
    amount,
    'INR' as currency,
    'expense' as type,
    category,
    payment_method as payment_mode,
    NULL as doc_link,
    CASE 
        WHEN status = 'RECONCILED' THEN 'completed'
        ELSE 'pending'
    END as status,
    gst_percent,
    gst_amount,
    context,
    created_at,
    updated_at
FROM expenses

UNION ALL

SELECT 
    id,
    org_id,
    source_type,
    source_id,
    row_index,
    transaction_date as date,
    invoice_number as ref_id,
    counterparty as entity,
    notes as description,
    amount,
    'INR' as currency,
    type,
    category,
    payment_mode,
    NULL as doc_link,
    CASE 
        WHEN status = 'PAID' THEN 'completed'
        ELSE 'pending'
    END as status,
    gst_percent,
    gst_amount,
    context,
    created_at,
    updated_at
FROM manual_ledger_entries;

-- ============================================================================
-- STEP 6: Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_invoices_source ON invoices(source_type, source_id, row_index);
CREATE INDEX IF NOT EXISTS idx_expenses_source ON expenses(source_type, source_id, row_index);
CREATE INDEX IF NOT EXISTS idx_ledger_source ON manual_ledger_entries(source_type, source_id, row_index);

-- ============================================================================
-- NOTES
-- ============================================================================

-- DO NOT DROP master_transactions yet!
-- Keep it for reference and rollback capability
-- After verifying the migration in production, we can:
-- 1. Rename master_transactions to master_transactions_deprecated
-- 2. Update all API routes to use directive tables
-- 3. After 30 days of successful operation, drop the deprecated table

-- The master_transactions_view provides backward compatibility
-- for any code still querying master_transactions
