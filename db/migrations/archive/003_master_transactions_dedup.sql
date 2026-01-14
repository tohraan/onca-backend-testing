-- Migration: 003_master_transactions_dedup
-- Description: Adds a unique constraint to allow idempotent syncing from Google Sheets

ALTER TABLE master_transactions 
ADD CONSTRAINT master_transactions_sync_unique 
UNIQUE (org_id, source_type, row_index);
