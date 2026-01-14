-- Fix for manual_ledger_entries table - add missing columns
-- Run this in Supabase SQL Editor

-- Create table if doesn't exist
CREATE TABLE IF NOT EXISTS manual_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    
    type TEXT CHECK (type IN ('PAYABLE', 'RECEIVABLE', 'EXPENSE', 'INCOME')),
    
    amount DECIMAL(15, 2) NOT NULL,
    counterparty TEXT NOT NULL,
    
    transaction_date DATE DEFAULT CURRENT_DATE,
    due_date DATE,
    
    invoice_number TEXT,
    category TEXT DEFAULT 'MISC',
    notes TEXT,
    payment_mode TEXT,
    
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'ARCHIVED')),
    
    linked_document_id UUID,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2);
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS counterparty TEXT;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS due_date DATE;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS invoice_number TEXT;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'MISC';
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS payment_mode TEXT;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN';
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Update type constraint
DO $$ 
BEGIN
    ALTER TABLE manual_ledger_entries DROP CONSTRAINT IF EXISTS manual_ledger_entries_type_check;
    ALTER TABLE manual_ledger_entries ADD CONSTRAINT manual_ledger_entries_type_check 
        CHECK (type IN ('PAYABLE', 'RECEIVABLE', 'EXPENSE', 'INCOME'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Update status constraint
DO $$ 
BEGIN
    ALTER TABLE manual_ledger_entries DROP CONSTRAINT IF EXISTS manual_ledger_entries_status_check;
    ALTER TABLE manual_ledger_entries ADD CONSTRAINT manual_ledger_entries_status_check 
        CHECK (status IN ('OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'ARCHIVED'));
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- Enable RLS
ALTER TABLE manual_ledger_entries ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely
DROP POLICY IF EXISTS "Users can view own org ledger" ON manual_ledger_entries;
DROP POLICY IF EXISTS "Users can insert own org ledger" ON manual_ledger_entries;
DROP POLICY IF EXISTS "Users can update own org ledger" ON manual_ledger_entries;
DROP POLICY IF EXISTS "Users can delete own org ledger" ON manual_ledger_entries;

CREATE POLICY "Users can view own org ledger" ON manual_ledger_entries
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org ledger" ON manual_ledger_entries
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org ledger" ON manual_ledger_entries
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org ledger" ON manual_ledger_entries
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ledger_org_type ON manual_ledger_entries(org_id, type);
CREATE INDEX IF NOT EXISTS idx_ledger_status ON manual_ledger_entries(status);
