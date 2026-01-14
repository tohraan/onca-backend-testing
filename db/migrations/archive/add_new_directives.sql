-- =====================================================
-- ONCA Schema Updates - Directives 12, 14, 15, 16
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Update TDS Entries (Directive 15)
-- Add new columns to existing tds_entries table
ALTER TABLE tds_entries 
ADD COLUMN IF NOT EXISTS due_date DATE NOT NULL DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS linked_invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES financial_tasks(id);

-- 2. Create Financial Tasks Table (Directive 12)
CREATE TABLE IF NOT EXISTS financial_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    type TEXT CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
    counterparty_name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    expected_date DATE NOT NULL,
    
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'INVOICE', 'BANK_MATCH')),
    
    linked_invoice_id UUID REFERENCES invoices(id),
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE financial_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org financial tasks" ON financial_tasks
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org financial tasks" ON financial_tasks
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org financial tasks" ON financial_tasks
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org financial tasks" ON financial_tasks
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 3. Update Bank Transactions (Directive 14)
-- Add reconciliation columns to existing bank_transactions table
ALTER TABLE bank_transactions 
ADD COLUMN IF NOT EXISTS linked_task_id UUID REFERENCES financial_tasks(id),
ADD COLUMN IF NOT EXISTS linked_invoice_id UUID REFERENCES invoices(id),
ADD COLUMN IF NOT EXISTS match_status TEXT DEFAULT 'PENDING' CHECK (match_status IN ('PENDING', 'MATCHED', 'USER_REVIEW'));

-- 4. Create Investments Table (Directive 16)
CREATE TABLE IF NOT EXISTS investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    investment_type TEXT CHECK (investment_type IN ('EQUITY', 'FIXED_DEPOSIT', 'MUTUAL_FUND', 'OTHER')),
    amount DECIMAL(15, 2) NOT NULL,
    investment_date DATE NOT NULL,
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org investments" ON investments
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org investments" ON investments
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org investments" ON investments
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org investments" ON investments
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- =====================================================
-- Migration Complete
-- =====================================================
