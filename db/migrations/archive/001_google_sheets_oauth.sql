-- Google Sheets OAuth Integration Schema
-- Migration: 001_google_sheets_oauth
-- Description: Add tables for storing OAuth connections and connected sheets

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Google Sheets OAuth Connections
-- Stores encrypted OAuth tokens for accessing user's Google Sheets
CREATE TABLE IF NOT EXISTS google_sheets_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Encrypted OAuth tokens
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT NOT NULL,
    token_expires_at TIMESTAMPTZ NOT NULL,
    
    -- User info from Google
    google_email TEXT,
    
    -- Connection metadata
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    last_synced_at TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked')),
    
    -- Ensure one connection per org (multiple users in same org share connection)
    UNIQUE(org_id, user_id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual Connected Sheets
-- Tracks which specific spreadsheets are being synced
CREATE TABLE IF NOT EXISTS connected_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connection_id UUID NOT NULL REFERENCES google_sheets_connections(id) ON DELETE CASCADE,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Spreadsheet identifiers
    spreadsheet_id TEXT NOT NULL,
    spreadsheet_title TEXT,
    sheet_url TEXT,
    
    -- Column mapping configuration (JSON)
    -- Example: {"date": "Column A", "amount": "Column B", "description": "Column C"}
    column_mappings JSONB,
    
    -- Sync control
    sync_enabled BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'syncing', 'completed', 'failed')),
    
    -- Ensure one entry per spreadsheet per connection
    UNIQUE(connection_id, spreadsheet_id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_google_sheets_connections_org_id ON google_sheets_connections(org_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_connections_user_id ON google_sheets_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_google_sheets_connections_status ON google_sheets_connections(status);
CREATE INDEX IF NOT EXISTS idx_connected_sheets_connection_id ON connected_sheets(connection_id);
CREATE INDEX IF NOT EXISTS idx_connected_sheets_org_id ON connected_sheets(org_id);

-- Row Level Security Policies
ALTER TABLE google_sheets_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE connected_sheets ENABLE ROW LEVEL SECURITY;

-- Users can only view connections for their own organization
CREATE POLICY "Users can view own org connections" ON google_sheets_connections
    FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can insert connections for their own organization
CREATE POLICY "Users can insert own org connections" ON google_sheets_connections
    FOR INSERT 
    WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can update connections for their own organization
CREATE POLICY "Users can update own org connections" ON google_sheets_connections
    FOR UPDATE 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can delete connections for their own organization
CREATE POLICY "Users can delete own org connections" ON google_sheets_connections
    FOR DELETE 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can view connected sheets for their own organization
CREATE POLICY "Users can view own org sheets" ON connected_sheets
    FOR SELECT 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can insert connected sheets for their own organization
CREATE POLICY "Users can insert own org sheets" ON connected_sheets
    FOR INSERT 
    WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can update connected sheets for their own organization
CREATE POLICY "Users can update own org sheets" ON connected_sheets
    FOR UPDATE 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Users can delete connected sheets for their own organization
CREATE POLICY "Users can delete own org sheets" ON connected_sheets
    FOR DELETE 
    USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_google_sheets_connections_updated_at 
    BEFORE UPDATE ON google_sheets_connections 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connected_sheets_updated_at 
    BEFORE UPDATE ON connected_sheets 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
