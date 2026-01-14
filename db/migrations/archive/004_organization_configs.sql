-- Migration: 004_organization_configs
-- Description: Ultra-simple business settings
-- RESET VERSION

DROP TABLE IF EXISTS organization_configs;

CREATE TABLE organization_configs (
    org_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    business_type TEXT NOT NULL DEFAULT 'service',
    currency TEXT NOT NULL DEFAULT 'INR',
    target_margin DECIMAL(5, 2) DEFAULT 20.0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Basic Security
ALTER TABLE organization_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own org config" ON organization_configs
    FOR ALL USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));
