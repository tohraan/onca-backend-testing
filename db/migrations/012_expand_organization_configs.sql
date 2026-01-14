-- User Settings Migration - Expand organization_configs
-- Run this in Supabase SQL Editor

-- Create organization_configs table if it doesn't exist
CREATE TABLE IF NOT EXISTS organization_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID NOT NULL REFERENCES organizations(id) UNIQUE,
    
    -- Business DNA (existing)
    business_type TEXT DEFAULT 'service',
    currency TEXT DEFAULT 'INR',
    target_margin INTEGER DEFAULT 20,
    
    -- General Settings (new)
    business_name TEXT,
    owner_name TEXT,
    
    -- Contact Info (new)
    contact_email TEXT,
    contact_phone TEXT,
    
    -- Alert Settings (new)
    alerts_enabled BOOLEAN DEFAULT false,
    alert_payable_threshold DECIMAL(15, 2) DEFAULT 100000,
    alert_receivable_threshold DECIMAL(15, 2) DEFAULT 100000,
    
    -- Report Settings (new)
    report_email TEXT,
    report_frequency TEXT DEFAULT 'WEEKLY',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS business_name TEXT;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS alerts_enabled BOOLEAN DEFAULT false;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS alert_payable_threshold DECIMAL(15, 2) DEFAULT 100000;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS alert_receivable_threshold DECIMAL(15, 2) DEFAULT 100000;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS report_email TEXT;
ALTER TABLE organization_configs ADD COLUMN IF NOT EXISTS report_frequency TEXT DEFAULT 'WEEKLY';

-- Enable RLS
ALTER TABLE organization_configs ENABLE ROW LEVEL SECURITY;

-- Recreate policies safely
DROP POLICY IF EXISTS "Users can view own org config" ON organization_configs;
DROP POLICY IF EXISTS "Users can insert own org config" ON organization_configs;
DROP POLICY IF EXISTS "Users can update own org config" ON organization_configs;

CREATE POLICY "Users can view own org config" ON organization_configs
    FOR SELECT USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert own org config" ON organization_configs
    FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update own org config" ON organization_configs
    FOR UPDATE USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Create index
CREATE INDEX IF NOT EXISTS idx_org_configs_org ON organization_configs(org_id);
