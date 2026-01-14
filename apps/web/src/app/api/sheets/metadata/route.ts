import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSpreadsheetMetadata, extractSpreadsheetId } from '@core/source/sheets';

export async function POST(request: Request) {
  try {
    const { url } = await request.json();
    const spreadsheetId = extractSpreadsheetId(url);

    if (!spreadsheetId) {
      return NextResponse.json({ error: 'Invalid Google Sheets URL' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's org_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('org_id')
      .eq('id', session.user.id)
      .single();

    if (!profile?.org_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 404 });
    }

    // Get valid access token from stored OAuth connection
    const { getValidAccessToken } = await import('@core/ingestion/google-sheets-oauth');
    const accessToken = await getValidAccessToken(session.user.id, profile.org_id);

    if (!accessToken) {
      return NextResponse.json({
        error: 'Please connect your Google Sheets account first',
        needsConnection: true
      }, { status: 403 });
    }

    const metadata = await getSpreadsheetMetadata(accessToken, spreadsheetId);

    // Add tracker validation
    const { getSheetHeaders, validateTrackerStructure } = await import('@core/source/sheets');
    let isMasterTracker = false;

    if (metadata.sheets.length > 0) {
      try {
        const headers = await getSheetHeaders(accessToken, spreadsheetId, metadata.sheets[0]);
        isMasterTracker = validateTrackerStructure(headers);
      } catch (e) {
        console.warn('[DEBUG] Failed to fetch headers for validation', e);
      }
    }

    return NextResponse.json({
      ...metadata,
      isMasterTracker
    });
  } catch (error: any) {
    console.error('Sheets Metadata API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
