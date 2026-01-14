import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@core/ingestion/google-sheets-oauth';
import { listUserSpreadsheets } from '@core/source/sheets';

/**
 * List Spreadsheets Route
 * Returns all Google Sheets accessible to the connected user
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .maybeSingle();

        if (!profile?.org_id) {
            return NextResponse.json({ spreadsheets: [] });
        }

        const accessToken = await getValidAccessToken(user.id, profile.org_id);
        console.log(`[DEBUG] Access token acquired for user ${user.id}:`, accessToken ? 'SUCCESS' : 'FAILED');

        if (!accessToken) {
            return NextResponse.json({ error: 'Not connected to Google Sheets' }, { status: 403 });
        }

        try {
            const spreadsheets = await listUserSpreadsheets(accessToken);
            console.log(`[DEBUG] listUserSpreadsheets returned ${spreadsheets.length} items`);
            return NextResponse.json({ spreadsheets });
        } catch (googleError: any) {
            console.error('[DEBUG] Google API List Error:', googleError.message);
            return NextResponse.json({ error: googleError.message }, { status: 502 });
        }
    } catch (error: any) {
        console.error('[DEBUG] INTERNAL LIST ROUTE ERROR:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
