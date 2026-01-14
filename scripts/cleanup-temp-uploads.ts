/**
 * Temp Uploads Cleanup Script
 * Deletes expired temporary uploads from database and storage
 * Run daily via cron job
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupExpiredUploads() {
    console.log('[Cleanup] Starting temp uploads cleanup...');
    const startTime = Date.now();

    try {
        // 1. Find expired uploads
        const { data: expiredUploads, error: fetchError } = await supabase
            .from('temp_uploads')
            .select('id, storage_path')
            .lt('expires_at', new Date().toISOString());

        if (fetchError) {
            throw new Error(`Failed to fetch expired uploads: ${fetchError.message}`);
        }

        if (!expiredUploads || expiredUploads.length === 0) {
            console.log('[Cleanup] No expired uploads found');
            return;
        }

        console.log(`[Cleanup] Found ${expiredUploads.length} expired uploads`);

        // 2. Delete files from storage
        let storageDeletedCount = 0;
        for (const upload of expiredUploads) {
            if (upload.storage_path) {
                const { error: storageError } = await supabase.storage
                    .from('documents')
                    .remove([upload.storage_path]);

                if (storageError) {
                    console.warn(`[Cleanup] Failed to delete storage file: ${upload.storage_path}`, storageError);
                } else {
                    storageDeletedCount++;
                }
            }
        }

        // 3. Delete database records
        const { error: deleteError } = await supabase
            .from('temp_uploads')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (deleteError) {
            throw new Error(`Failed to delete database records: ${deleteError.message}`);
        }

        const duration = Date.now() - startTime;
        console.log(`[Cleanup] Successfully cleaned up:`);
        console.log(`  - Database records: ${expiredUploads.length}`);
        console.log(`  - Storage files: ${storageDeletedCount}`);
        console.log(`  - Duration: ${duration}ms`);

    } catch (error) {
        console.error('[Cleanup] Error during cleanup:', error);
        process.exit(1);
    }
}

// Run cleanup
cleanupExpiredUploads()
    .then(() => {
        console.log('[Cleanup] Cleanup completed successfully');
        process.exit(0);
    })
    .catch((error) => {
        console.error('[Cleanup] Cleanup failed:', error);
        process.exit(1);
    });
