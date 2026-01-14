-- Fix for existing expenses table - add missing columns
-- Run this in Supabase SQL Editor

-- Add missing columns if they don't exist
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'UNRECONCILED';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'UNKNOWN';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS input_document_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'MANUAL';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS source_id UUID;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS row_index INTEGER;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS gst_percent DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS gst_amount DECIMAL(15, 2);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS context TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS ref_id TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add constraint for status (drop first if exists to avoid errors)
DO $$ 
BEGIN
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_status_check;
    ALTER TABLE expenses ADD CONSTRAINT expenses_status_check 
        CHECK (status IN ('UNRECONCILED', 'RECONCILED'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Add constraint for payment_method
DO $$ 
BEGIN
    ALTER TABLE expenses DROP CONSTRAINT IF EXISTS expenses_payment_method_check;
    ALTER TABLE expenses ADD CONSTRAINT expenses_payment_method_check 
        CHECK (payment_method IN ('CASH', 'CARD', 'BANK', 'UNKNOWN'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Ensure RLS is enabled
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely
DROP POLICY IF EXISTS "Users can view own org expenses" ON expenses;
DROP POLICY IF EXISTS "Users can insert own org expenses" ON expenses;
DROP POLICY IF EXISTS "Users can update own org expenses" ON expenses;
DROP POLICY IF EXISTS "Users can delete own org expenses" ON expenses;

CREATE POLICY "Users can view own org expenses" ON expenses
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org expenses" ON expenses
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org expenses" ON expenses
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org expenses" ON expenses
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Create indexes (safe to run multiple times)
CREATE INDEX IF NOT EXISTS idx_expenses_org_date ON expenses(org_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_status ON expenses(status);
