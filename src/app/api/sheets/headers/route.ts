import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@core/ingestion/google-sheets-oauth';
import { getSheetHeaders, extractSpreadsheetId } from '@core/source/sheets';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const url = searchParams.get('url');
        const sheetName = searchParams.get('sheet') || 'Sheet1';

        if (!url) {
            return NextResponse.json({ error: 'Missing URL' }, { status: 400 });
        }

        const spreadsheetId = extractSpreadsheetId(url);
        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Invalid Spreadsheet URL' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const accessToken = await getValidAccessToken(user.id, profile.org_id);
        if (!accessToken) {
            return NextResponse.json({ error: 'Google Sheets not connected' }, { status: 403 });
        }

        const headers = await getSheetHeaders(accessToken, spreadsheetId, sheetName);

        return NextResponse.json({ headers });

    } catch (error: any) {
        console.error('[HEADERS ERROR] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
