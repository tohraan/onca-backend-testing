import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@core/ingestion/google-sheets-oauth';
import { getSheetRows, extractSpreadsheetId, MASTER_TRACKER_COLUMNS } from '@core/source/sheets';

/**
 * Standardization Bridge
 * Takes a non-standard sheet, normalizes data, and returns a CSV in the ONCA template
 */
export async function POST(request: Request) {
    try {
        const { url, sheetName, mapping } = await request.json();
        const spreadsheetId = extractSpreadsheetId(url);

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Invalid Spreadsheet URL' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // 1. Get Google Access Token
        const accessToken = await getValidAccessToken(user.id, profile.org_id);
        if (!accessToken) {
            return NextResponse.json({ error: 'Google Sheets not connected' }, { status: 403 });
        }

        // 2. Fetch Rows from Google Sheets
        const targetSheet = sheetName || 'Sheet1';
        const rows = await getSheetRows(accessToken, spreadsheetId, targetSheet);

        if (rows.length < 2) {
            return NextResponse.json({ error: 'Sheet is empty or missing headers' }, { status: 400 });
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        // 3. Create Column Map
        const colMap: Record<string, number> = {};
        if (mapping) {
            Object.keys(mapping).forEach(internalField => {
                const sheetCol = mapping[internalField];
                colMap[internalField.toLowerCase()] = sheetCol ? headers.indexOf(sheetCol.toLowerCase().trim()) : -1;
            });
        } else {
            // Best effort matching if no mapping provided
            MASTER_TRACKER_COLUMNS.forEach(col => {
                colMap[col.toLowerCase()] = headers.indexOf(col.toLowerCase());
            });
        }

        // 4. Transform into ONCA Template CSV
        // Header Row
        const csvRows = [MASTER_TRACKER_COLUMNS.join(',')];

        dataRows.forEach(row => {
            const rowData = MASTER_TRACKER_COLUMNS.map(col => {
                const idx = colMap[col.toLowerCase()];
                let val = idx !== -1 ? row[idx] : '';

                // Basic cleanup for CSV (strip commas and newlines)
                if (val) {
                    val = val.toString().replace(/,/g, '').replace(/\n/g, ' ').trim();
                }
                return val || '';
            });
            csvRows.push(rowData.join(','));
        });

        const csvString = csvRows.join('\n');

        return new Response(csvString, {
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="onca_standardized_template.csv"`
            }
        });

    } catch (error: any) {
        console.error('[STANDARDIZE ERROR] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
