ALTER TABLE master_transactions 
ADD CONSTRAINT master_transactions_sync_unique 
UNIQUE (org_id, source_type, row_index);

ALTER TABLE organization_configs
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_row_count INTEGER;
