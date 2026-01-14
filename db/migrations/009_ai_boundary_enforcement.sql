-- AI Boundary Enforcement - Database Roles
-- Purpose: Ensure AI can only READ from specific tables, never WRITE
-- Date: 2026-01-14

-- ============================================================================
-- STEP 1: Create AI Reader Role (Read-Only Access)
-- ============================================================================

-- Create role for AI operations
CREATE ROLE IF NOT EXISTS ai_reader;

-- Grant CONNECT to database
GRANT CONNECT ON DATABASE postgres TO ai_reader;

-- Grant USAGE on schema
GRANT USAGE ON SCHEMA public TO ai_reader;

-- Grant SELECT only on safe tables (derived/cached data)
-- AI should NEVER see raw financial data, only aggregated/derived data

-- Allow AI to read from derived tables for explanations
GRANT SELECT ON TABLE organizations TO ai_reader;
GRANT SELECT ON TABLE profiles TO ai_reader;

-- AI can read aggregated financial data for insights
-- But NOT raw transactions, invoices, expenses, etc.

-- Create views for AI to read from (aggregated data only)
CREATE OR REPLACE VIEW ai_financial_summary AS
SELECT 
    org_id,
    DATE_TRUNC('month', invoice_date) as month,
    invoice_type,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM invoices
GROUP BY org_id, DATE_TRUNC('month', invoice_date), invoice_type;

CREATE OR REPLACE VIEW ai_expense_summary AS
SELECT 
    org_id,
    DATE_TRUNC('month', expense_date) as month,
    category,
    COUNT(*) as count,
    SUM(amount) as total_amount,
    AVG(amount) as avg_amount
FROM expenses
GROUP BY org_id, DATE_TRUNC('month', expense_date), category;

-- Grant SELECT on AI-safe views
GRANT SELECT ON ai_financial_summary TO ai_reader;
GRANT SELECT ON ai_expense_summary TO ai_reader;

-- Explicitly REVOKE all write permissions
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON ALL TABLES IN SCHEMA public FROM ai_reader;

-- ============================================================================
-- STEP 2: Create App Writer Role (Full Access)
-- ============================================================================

-- This role is used by the main application
CREATE ROLE IF NOT EXISTS app_writer;

-- Grant full access to app_writer
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_writer;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_writer;

-- ============================================================================
-- STEP 3: Create Service Accounts
-- ============================================================================

-- Note: In Supabase, you'll need to create these users in the Dashboard
-- and assign them to the appropriate roles

-- For now, we document the intended setup:
-- 1. Create a service account: ai_service_user
-- 2. Assign role: ai_reader
-- 3. Use this account's credentials in the AI client

-- ============================================================================
-- STEP 4: Row Level Security for AI Access
-- ============================================================================

-- Ensure RLS is enabled on all financial tables
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_tasks ENABLE ROW LEVEL SECURITY;

-- AI should never bypass RLS
ALTER TABLE invoices FORCE ROW LEVEL SECURITY;
ALTER TABLE expenses FORCE ROW LEVEL SECURITY;
ALTER TABLE manual_ledger_entries FORCE ROW LEVEL SECURITY;
ALTER TABLE financial_tasks FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check role permissions
DO $$
BEGIN
    RAISE NOTICE 'AI Reader Permissions:';
    RAISE NOTICE 'Can SELECT from ai_financial_summary: %', 
        has_table_privilege('ai_reader', 'ai_financial_summary', 'SELECT');
    RAISE NOTICE 'Can INSERT into invoices: %', 
        has_table_privilege('ai_reader', 'invoices', 'INSERT');
    RAISE NOTICE 'Can UPDATE invoices: %', 
        has_table_privilege('ai_reader', 'invoices', 'UPDATE');
    RAISE NOTICE 'Can DELETE from invoices: %', 
        has_table_privilege('ai_reader', 'invoices', 'DELETE');
END $$;

-- ============================================================================
-- NOTES
-- ============================================================================

-- To use these roles in your application:
-- 1. Create service users in Supabase Dashboard
-- 2. Assign ai_reader role to AI service user
-- 3. Use separate connection strings for AI vs app operations
-- 4. Never expose ai_reader credentials to client-side code
