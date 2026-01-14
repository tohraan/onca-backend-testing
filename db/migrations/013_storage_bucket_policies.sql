-- Migration: Set up storage bucket policies for document uploads
-- Created: 2026-01-14
-- Purpose: Allow authenticated users to upload files to the documents bucket

-- NOTE: Storage bucket policies are configured via Supabase Dashboard or SQL.
-- This migration creates the policies needed for authenticated users to upload.

-- IMPORTANT: You need to run these commands in your Supabase SQL Editor or
-- ensure the 'documents' bucket exists and is configured correctly.

-- ============================================================================
-- STEP 1: Create the storage bucket (if it doesn't exist)
-- You can do this in Supabase Dashboard > Storage > Create bucket
-- Name: documents
-- Public: false (private bucket)
-- ============================================================================

-- Insert bucket if it doesn't exist (this may fail if bucket already exists, that's OK)
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- STEP 2: Create RLS policies for the documents bucket
-- ============================================================================

-- Policy: Allow authenticated users to upload files to their own folder
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to view their own files
CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to update their own files
CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- INSTRUCTIONS FOR MANUAL SETUP (if SQL doesn't work):
-- 
-- 1. Go to Supabase Dashboard > Storage
-- 2. Create bucket named "documents" if it doesn't exist (set as private)
-- 3. Go to Policies tab for the bucket
-- 4. Add these policies:
--
--    INSERT: 
--      - Name: "Users can upload to their own folder"
--      - Target: authenticated
--      - Check expression: (storage.foldername(name))[1] = auth.uid()::text
--
--    SELECT:
--      - Name: "Users can view their own files"
--      - Target: authenticated
--      - Using expression: (storage.foldername(name))[1] = auth.uid()::text
--
--    DELETE:
--      - Name: "Users can delete their own files"
--      - Target: authenticated
--      - Using expression: (storage.foldername(name))[1] = auth.uid()::text
--
-- ============================================================================
