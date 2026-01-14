import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getConnectionStatus } from '@core/ingestion/google-sheets-oauth';

/**
 * Connection Status Route
 * Returns whether user has an active Google Sheets connection
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
            return NextResponse.json({ isConnected: false });
        }

        const status = await getConnectionStatus(user.id, profile.org_id);
        return NextResponse.json(status);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
