-- ONCA Primary Storage Schema (CORRECTED - Proper Dependency Order)

-- Organizations: Every user belongs to one organization (MVP constraint)
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Configs: User preferences and settings for each org
CREATE TABLE IF NOT EXISTS organization_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
    
    -- Business DNA
    business_type TEXT DEFAULT 'service',
    currency TEXT DEFAULT 'INR',
    target_margin INTEGER DEFAULT 20,
    
    -- General Settings
    business_name TEXT,
    owner_name TEXT,
    
    -- Contact Info
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Alert Settings
    alerts_enabled BOOLEAN DEFAULT false,
    alert_payable_threshold DECIMAL(15, 2) DEFAULT 100000,
    alert_receivable_threshold DECIMAL(15, 2) DEFAULT 100000,
    
    -- Report Settings
    report_email TEXT,
    report_frequency TEXT DEFAULT 'WEEKLY',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE organization_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org config" ON organization_configs
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org config" ON organization_configs
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org config" ON organization_configs
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

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

-- Document Vault (Immutable Source Layer)
CREATE TABLE IF NOT EXISTS input_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    type TEXT CHECK (type IN ('INVOICE', 'RECEIPT', 'BANK_STMT', 'OTHER')),
    category TEXT CHECK (category IN ('PAYABLE', 'RECEIVABLE', 'EXPENSE')),
    
    storage_path TEXT,
    original_filename TEXT,
    file_mime_type TEXT,
    file_size_bytes BIGINT,
    
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'NORMALIZED', 'FAILED')),
    ingested_at TIMESTAMPTZ DEFAULT NOW(),
    
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE input_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org documents" ON input_documents
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org documents" ON input_documents
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Manual Ledger (System of Record)
CREATE TABLE IF NOT EXISTS manual_ledger_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    
    entry_type TEXT CHECK (entry_type IN ('INCOME', 'EXPENSE', 'RECEIVABLE', 'PAYABLE')),
    counterparty_name TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    
    transaction_date DATE NOT NULL,
    expected_date DATE,
    
    category TEXT,
    notes TEXT,
    
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

CREATE POLICY "Users can delete own org ledger" ON manual_ledger_entries
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Cash Flow Snapshots
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

-- Bank Statements
CREATE TABLE IF NOT EXISTS bank_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    statement_date DATE NOT NULL,
    opening_balance DECIMAL(15, 2),
    closing_balance DECIMAL(15, 2),
    
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org bank statements" ON bank_statements
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org bank statements" ON bank_statements
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Invoices (CREATE BEFORE financial_tasks and tds_entries)
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
    
    input_document_id UUID REFERENCES input_documents(id),
    
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

-- Financial Tasks (CREATE BEFORE tds_entries and bank_transactions)
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

-- TDS Tracking (NOW invoices and financial_tasks exist)
CREATE TABLE IF NOT EXISTS tds_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    user_id UUID REFERENCES auth.users(id),
    
    vendor_name TEXT NOT NULL,
    invoice_reference TEXT,
    payment_date DATE NOT NULL,
    
    payment_amount DECIMAL(15, 2) NOT NULL,
    tds_rate DECIMAL(5, 2) NOT NULL,
    tds_amount DECIMAL(15, 2) NOT NULL,
    
    due_date DATE NOT NULL,
    status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'OVERDUE')),
    
    linked_ledger_entry_id UUID REFERENCES manual_ledger_entries(id),
    linked_invoice_id UUID REFERENCES invoices(id),
    linked_task_id UUID REFERENCES financial_tasks(id),
    
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

CREATE POLICY "Users can delete own org tds" ON tds_entries
    FOR DELETE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Bank Transactions (NOW financial_tasks and invoices exist)
CREATE TABLE IF NOT EXISTS bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    statement_id UUID REFERENCES bank_statements(id),
    
    transaction_date DATE NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    direction TEXT CHECK (direction IN ('DEBIT', 'CREDIT')),
    
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

CREATE POLICY "Users can update own org bank transactions" ON bank_transactions
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Invoice-Transaction Links
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

-- Expense Tracking System
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id),
    
    expense_date DATE NOT NULL,
    category TEXT NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    vendor_name TEXT,
    
    reconciliation_status TEXT DEFAULT 'UNRECONCILED' CHECK (reconciliation_status IN ('UNRECONCILED', 'RECONCILED')),
    
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

-- Investments Placeholder
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
