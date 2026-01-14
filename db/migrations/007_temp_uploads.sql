-- Migration: Add temp_uploads table for column mapping workflow
-- Created: 2026-01-13
-- Purpose: Store uploaded files temporarily while user confirms column mappings

CREATE TABLE IF NOT EXISTS temp_uploads (
  id UUID PRIMARY KEY,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL CHECK (file_type IN ('BANK_STATEMENT', 'INVOICE', 'EXPENSE', 'GENERAL')),
  -- For CSV uploads we inline the content for fast column suggestion work.
  -- For non-CSV uploads we store a reference to the Supabase Storage object instead.
  file_content TEXT,
  storage_path TEXT,
  is_manual_required BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- Add RLS policies
ALTER TABLE temp_uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own uploads"
  ON temp_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own uploads"
  ON temp_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own uploads"
  ON temp_uploads FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_temp_uploads_org_id ON temp_uploads(org_id);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_user_id ON temp_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_temp_uploads_expires_at ON temp_uploads(expires_at);

-- Create function to clean up expired uploads
CREATE OR REPLACE FUNCTION cleanup_expired_uploads()
RETURNS void AS $$
BEGIN
  DELETE FROM temp_uploads WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_uploads() TO authenticated;

COMMENT ON TABLE temp_uploads IS 'Temporary storage for uploaded files during column mapping confirmation';
COMMENT ON COLUMN temp_uploads.expires_at IS 'Uploads expire after 24 hours';
