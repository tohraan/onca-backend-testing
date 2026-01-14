import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { available_balance } = body;

        // Validation
        if (available_balance === undefined || available_balance === null) {
            return NextResponse.json({ error: 'Missing balance' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('cash_snapshots')
            .insert({
                org_id: profile.org_id,
                created_by: session.user.id,
                available_balance: available_balance,
                source: 'MANUAL'
            })
            .select()
            .single();

        if (error) {
            console.error('Create Snapshot Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, snapshot: data });

    } catch (error: any) {
        console.error('Cash Snapshot API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
