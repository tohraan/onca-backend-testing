/**
 * Ingestion Layer - Google Sheets OAuth Connection Management
 * Handles OAuth connection lifecycle, token storage, and refresh
 */

import { createClient } from '@/lib/supabase/server';
import { encrypt, decrypt } from '@lib/encryption';
import { refreshAccessToken } from '@core/source/sheets';
import { logger } from '@lib/logging';

export interface ConnectionStatus {
    isConnected: boolean;
    googleEmail?: string;
    connectedAt?: Date;
    lastSynced?: Date;
    status?: string;
}

/**
 * Store OAuth tokens securely in database
 * Encrypts tokens before storage and enforces org-level isolation
 */
export async function storeOAuthConnection(
    userId: string,
    orgId: string,
    tokens: { access_token: string; refresh_token: string; expires_in: number },
    googleEmail: string
): Promise<void> {
    const supabase = await createClient();

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Check for existing connection for this user/org
    const { data: existing } = await supabase
        .from('google_sheets_connections')
        .select('id')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .maybeSingle();

    const connectionData = {
        user_id: userId,
        org_id: orgId,
        access_token_encrypted: encrypt(tokens.access_token),
        refresh_token_encrypted: encrypt(tokens.refresh_token),
        token_expires_at: expiresAt.toISOString(),
        google_email: googleEmail,
        status: 'active',
        connected_at: existing ? undefined : new Date().toISOString(),
        updated_at: new Date().toISOString(),
    };

    let result;
    if (existing) {
        result = await supabase
            .from('google_sheets_connections')
            .update(connectionData)
            .eq('id', existing.id);
    } else {
        result = await supabase
            .from('google_sheets_connections')
            .insert(connectionData);
    }

    if (result.error) {
        logger.error('Failed to store OAuth connection', result.error);
        throw new Error('Failed to save connection');
    }

    logger.info('OAuth connection stored successfully', { userId, orgId });
}

/**
 * Get valid access token, automatically refreshing if expired
 * Returns null if no connection exists or refresh fails
 */
export async function getValidAccessToken(userId: string, orgId: string): Promise<string | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('google_sheets_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .eq('status', 'active')
        .single();

    if (error || !data) {
        return null;
    }

    const now = new Date();
    const expiresAt = new Date(data.token_expires_at);

    // If token is still valid (with 5 min buffer), return it
    if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
        return decrypt(data.access_token_encrypted);
    }

    // Token expired or expiring soon, refresh it
    try {
        const refreshToken = decrypt(data.refresh_token_encrypted);
        const newTokens = await refreshAccessToken(refreshToken);

        const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000);

        await supabase
            .from('google_sheets_connections')
            .update({
                access_token_encrypted: encrypt(newTokens.access_token),
                token_expires_at: newExpiresAt.toISOString(),
            })
            .eq('id', data.id);

        logger.info('Access token refreshed', { userId });
        return newTokens.access_token;
    } catch (err) {
        logger.error('Failed to refresh token', err);

        // Mark connection as expired
        await supabase
            .from('google_sheets_connections')
            .update({ status: 'expired' })
            .eq('id', data.id);

        return null;
    }
}

/**
 * Check connection status for a user/org
 */
export async function getConnectionStatus(userId: string, orgId: string): Promise<ConnectionStatus> {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('google_sheets_connections')
        .select('google_email, connected_at, last_synced_at, status')
        .eq('user_id', userId)
        .eq('org_id', orgId)
        .single();

    if (error || !data) {
        return { isConnected: false };
    }

    return {
        isConnected: data.status === 'active',
        googleEmail: data.google_email,
        connectedAt: new Date(data.connected_at),
        lastSynced: data.last_synced_at ? new Date(data.last_synced_at) : undefined,
        status: data.status,
    };
}

/**
 * Disconnect (revoke) OAuth connection
 * Marks connection as revoked without deleting data
 */
export async function disconnectGoogleSheets(userId: string, orgId: string): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
        .from('google_sheets_connections')
        .update({ status: 'revoked' })
        .eq('user_id', userId)
        .eq('org_id', orgId);

    if (error) {
        throw new Error('Failed to disconnect');
    }

    logger.info('Google Sheets disconnected', { userId, orgId });
}
