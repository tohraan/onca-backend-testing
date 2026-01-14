-- ONCA Primary Storage Schema

-- Organizations: Every user belongs to one organization (MVP constraint)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users: Scoped to organizations
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    org_id UUID REFERENCES organizations(id),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Add org_id to all subsequent tables to enforce isolation

-- Document Vault (Immutable Source Layer)
CREATE TABLE IF NOT EXISTS input_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    -- Categories for Financial Workflow (Directive 12)
    type TEXT CHECK (type IN ('INVOICE', 'RECEIPT', 'BANK_STMT', 'OTHER')),
    category TEXT CHECK (category IN ('PAYABLE', 'RECEIVABLE', 'EXPENSE')),
    
    -- Secure Storage References
    storage_path TEXT,
    original_filename TEXT,
    file_mime_type TEXT,
    file_size_bytes BIGINT,
    
    -- Processing State
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'NORMALIZED', 'FAILED')),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE input_documents ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see docs in their org
CREATE POLICY "Users can view own org documents" ON input_documents
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org documents" ON input_documents
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Manual Ledger (Phase 3 & Directive 05)
CREATE TABLE IF NOT EXISTS manual_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Expanded Types for Directive 05
    type TEXT CHECK (type IN ('PAYABLE', 'RECEIVABLE', 'EXPENSE', 'INCOME')),
    
    amount DECIMAL(15, 2) NOT NULL,
    counterparty TEXT NOT NULL, -- Vendor / Customer / Payee
    
    -- Timeline
    transaction_date DATE DEFAULT CURRENT_DATE, -- When it happened
    due_date DATE, -- When money moves (for Payable/Receivable) - Alias for expected_date
    
    invoice_number TEXT,
    category TEXT DEFAULT 'MISC',
    notes TEXT,
    payment_mode TEXT, -- CASH, BANK, UPI, etc.
    
    status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PAID', 'PARTIAL', 'OVERDUE', 'ARCHIVED')),
    
    linked_document_id UUID REFERENCES input_documents(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE manual_ledger_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org ledger" ON manual_ledger_entries
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org ledger" ON manual_ledger_entries
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org ledger" ON manual_ledger_entries
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- TDS Tracking (Phase 4)
CREATE TABLE IF NOT EXISTS tds_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    
    vendor_name TEXT NOT NULL,
    invoice_reference TEXT,
    payment_date DATE NOT NULL,
    
    payment_amount DECIMAL(15, 2) NOT NULL, -- Base amount
    tds_rate DECIMAL(5, 2) NOT NULL, -- e.g., 10.00 for 10%
    tds_amount DECIMAL(15, 2) NOT NULL, -- Calculated liability
    
    due_date DATE NOT NULL, -- TDS payment due date
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    
    linked_ledger_entry_id UUID REFERENCES manual_ledger_entries(id),
    linked_invoice_id UUID REFERENCES invoices(id), -- Optional link to invoice
    linked_task_id UUID REFERENCES financial_tasks(id), -- Optional link to payable task
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tds_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org tds" ON tds_entries
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org tds" ON tds_entries
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org tds" ON tds_entries
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Cash Flow Snapshots (Phase 5)
CREATE TABLE IF NOT EXISTS cash_snapshots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    available_balance DECIMAL(15, 2) NOT NULL,
    source TEXT DEFAULT 'MANUAL',
    created_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cash_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org cash snapshots" ON cash_snapshots
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org cash snapshots" ON cash_snapshots
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Update Ledger for Partial Payments (Phase 5 Modification)
-- Note: In a real migration, we would use ALTER TABLE. Here we assume we can append or check.
-- For the sake of this file serving as a source of truth for the schema:
-- DO NOT RUN 'ALTER TABLE' HERE if it's a fresh init file. 
-- However, since I am editing the schema file which might be used for initialization:
-- I will add comments for the intended changes if the table already existed.

-- Ideally: 
-- ALTER TABLE manual_ledger_entries ADD COLUMN IF NOT EXISTS amount_received DECIMAL(15, 2) DEFAULT 0;
-- ALTER TABLE manual_ledger_entries DROP CONSTRAINT IF EXISTS manual_ledger_entries_status_check;
-- ALTER TABLE manual_ledger_entries ADD CONSTRAINT manual_ledger_entries_status_check DO CHECK (status IN ('OPEN', 'PARTIAL', 'PAID', 'OVERDUE', 'ARCHIVED'));

-- Bank Statement Import (Phase 7 / Directive 06)
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    bank_name TEXT,
    account_label TEXT, -- User-defined label
    statement_period TEXT, -- e.g., "2024-01"
    file_hash TEXT, -- For duplicate detection
    storage_path TEXT, -- Link to vault
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org bank statements" ON bank_statements
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org bank statements" ON bank_statements
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    statement_id UUID REFERENCES bank_statements(id),
    
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    direction TEXT CHECK (direction IN ('DEBIT', 'CREDIT')),
    
    -- Reconciliation & Linking (Directive 14)
    linked_task_id UUID REFERENCES financial_tasks(id),
    linked_invoice_id UUID REFERENCES invoices(id),
    match_status TEXT DEFAULT 'PENDING' CHECK (match_status IN ('PENDING', 'MATCHED', 'USER_REVIEW')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org bank transactions" ON bank_transactions
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org bank transactions" ON bank_transactions
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Invoice System (Phase 9 / Directive 10A)
-- Invoices are obligations over time, separate from Ledger (truth) and Documents (evidence)
CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    invoice_type TEXT CHECK (invoice_type IN ('PAYABLE', 'RECEIVABLE')),
    counterparty_name TEXT NOT NULL,
    invoice_number TEXT,
    
    amount DECIMAL(15, 2) NOT NULL,
    tax_amount DECIMAL(15, 2) DEFAULT 0,
    
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    
    status TEXT DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIALLY_PAID', 'PAID', 'OVERDUE')),
    source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'OCR')),
    
    input_document_id UUID REFERENCES input_documents(id), -- Link to uploaded document (nullable)
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org invoices" ON invoices
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org invoices" ON invoices
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org invoices" ON invoices
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org invoices" ON invoices
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Invoice-Transaction Links (Future: Bank Reconciliation)
CREATE TABLE IF NOT EXISTS invoice_transaction_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    bank_transaction_id UUID NOT NULL REFERENCES bank_transactions(id) ON DELETE CASCADE,
    
    amount_matched DECIMAL(15, 2) NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE invoice_transaction_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org invoice links" ON invoice_transaction_links
    FOR SELECT USING (
        invoice_id IN (SELECT id FROM invoices WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
    );

CREATE POLICY "Users can insert own org invoice links" ON invoice_transaction_links
    FOR INSERT WITH CHECK (
        invoice_id IN (SELECT id FROM invoices WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()))
    );

-- Expense Tracking System (Phase 10 / Directive 11)
-- Expenses are costs already incurred, separate from Invoices (obligations) and Ledger (settled truth)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    expense_date DATE NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    
    category TEXT CHECK (category IN ('OFFICE', 'TRAVEL', 'SOFTWARE', 'MARKETING', 'UTILITIES', 'MISC')),
    vendor_name TEXT NOT NULL,
    payment_method TEXT DEFAULT 'UNKNOWN' CHECK (payment_method IN ('CASH', 'CARD', 'BANK', 'UNKNOWN')),
    
    status TEXT DEFAULT 'UNRECONCILED' CHECK (status IN ('UNRECONCILED', 'RECONCILED')),
    
    input_document_id UUID REFERENCES input_documents(id), -- Link to receipt/bill (nullable)
    
    notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org expenses" ON expenses
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org expenses" ON expenses
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org expenses" ON expenses
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete own org expenses" ON expenses
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Manual Payables & Receivables System (Phase 11 / Directive 12)
-- Financial Tasks are intent/commitments, separate from Invoices (formal) and Expenses (incurred)
CREATE TABLE IF NOT EXISTS financial_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    type TEXT CHECK (type IN ('PAYABLE', 'RECEIVABLE')),
    counterparty_name TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    expected_date DATE NOT NULL,
    
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE', 'CANCELLED')),
    source TEXT DEFAULT 'MANUAL' CHECK (source IN ('MANUAL', 'INVOICE', 'BANK_MATCH')),
    
    linked_invoice_id UUID REFERENCES invoices(id), -- Optional link to invoice (nullable)
    
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

-- Investments Placeholder (Directive 16)
-- Manual investment tracking for MVP, no calculations or bank linking
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
