-- SME Master Tracker - Core Financial Transactions
-- Migration: 002_master_transactions
-- Description: Create a central repository for all financial data 

CREATE TABLE IF NOT EXISTS master_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Provenance metadata
    source_type TEXT NOT NULL DEFAULT 'google_sheet' CHECK (source_type IN ('google_sheet', 'manual_upload', 'bank_feed')),
    source_id UUID, -- Reference to connected_sheets.id or similar
    row_index INTEGER, -- For sheets, the row number to aid debugging
    
    -- Transaction Data
    date DATE NOT NULL,
    ref_id TEXT, -- Invoice/Ref number
    entity TEXT NOT NULL, -- Vendor/Customer
    description TEXT,
    amount DECIMAL(15, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'salary', 'transfer', 'other')),
    category TEXT, -- Operations, HR, Sales, etc.
    payment_mode TEXT, -- Bank, Cash, Card
    doc_link TEXT, -- Reference to the source document
    status TEXT DEFAULT 'completed', -- Paid, Unpaid, Pending, etc.
    
    -- Tax Data
    gst_percent DECIMAL(5, 2) DEFAULT 0,
    gst_amount DECIMAL(15, 2) GENERATED ALWAYS AS (amount * (gst_percent / 100.0)) STORED,
    
    -- Contextual Data (for AI)
    context TEXT, -- The manual input/note from the user
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_master_transactions_org_id ON master_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_master_transactions_date ON master_transactions(date);
CREATE INDEX IF NOT EXISTS idx_master_transactions_type ON master_transactions(type);
CREATE INDEX IF NOT EXISTS idx_master_transactions_ref_id ON master_transactions(ref_id);

-- Row Level Security
ALTER TABLE master_transactions ENABLE ROW LEVEL SECURITY;

-- Users can only view/manage transactions for their own organization
CREATE POLICY "Users can manage own org transactions" ON master_transactions
    FOR ALL
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
    WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_master_transactions_updated_at 
    BEFORE UPDATE ON master_transactions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
