import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), 'apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl!, supabaseServiceKey!)

const SQL = `
CREATE TABLE IF NOT EXISTS connected_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_id UUID NOT NULL,
    type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    external_id VARCHAR(255) NOT NULL,
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES connected_sources(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    source_column VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(source_id, field_name)
);

CREATE TABLE IF NOT EXISTS sheet_ingestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES connected_sources(id) ON DELETE CASCADE,
    org_id UUID NOT NULL,
    raw_data JSONB NOT NULL,
    processed BOOLEAN DEFAULT FALSE,
    ingested_at TIMESTAMPTZ DEFAULT NOW()
);
`

async function setupTables() {
    console.log('Running database setup...')
    // Note: Supabase JS client doesn't have a direct 'query' method for raw SQL for safety.
    // Usually migrations are done via CLI or Dashboard.
    // I will output the SQL for the user and attempt to use a hidden RPC if available (unlikely).
    console.log('--- SQL TO RUN IN SUPABASE SQL EDITOR ---')
    console.log(SQL)
    console.log('-----------------------------------------')
}

setupTables()
