-- ONCA System Stabilizer & Schema Repair
-- Description: Consolidates all required columns and constraints for the Multi-Currency and Sync systems.
-- Run this once in the Supabase SQL Editor.

-- 1. Upgrade master_transactions Table
ALTER TABLE master_transactions 
ADD COLUMN IF NOT EXISTS source_amount DECIMAL(15, 2),
ADD COLUMN IF NOT EXISTS source_currency TEXT,
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(15, 6);

-- 2. Prevent Duplicates (Unique Constraint)
-- We drop and re-add to ensure it exists exactly as expected
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'master_transactions_sync_unique') THEN
        ALTER TABLE master_transactions 
        ADD CONSTRAINT master_transactions_sync_unique 
        UNIQUE (org_id, source_type, row_index);
    END IF;
END $$;

-- 3. Upgrade organization_configs Table
ALTER TABLE organization_configs
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_row_count INTEGER;

-- 4. Fix Check Constraints
-- If the 'type' constraint is too strict, we can relax it to allow more variants
-- But since we map them in the code now, we just ensure 'income' exists (which it does).
-- We'll add 'revenue' as a valid native type just in case.
ALTER TABLE master_transactions 
DROP CONSTRAINT IF EXISTS master_transactions_type_check;

ALTER TABLE master_transactions 
ADD CONSTRAINT master_transactions_type_check 
CHECK (type IN ('income', 'revenue', 'expense', 'salary', 'transfer', 'other'));

-- 5. Backfill any NULL source data
UPDATE master_transactions 
SET source_amount = amount, 
    source_currency = currency 
WHERE source_amount IS NULL;

-- 6. Done!
RAISE NOTICE 'ONCA System Stabilizer: Complete.';
