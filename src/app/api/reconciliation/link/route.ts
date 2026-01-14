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
        const { transaction_id, match_type, match_id } = body;

        if (!transaction_id || !match_type || !match_id) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Update bank transaction with link
        const updates: any = {
            match_status: 'MATCHED'
        };

        if (match_type === 'task') {
            updates.linked_task_id = match_id;
        } else if (match_type === 'invoice') {
            updates.linked_invoice_id = match_id;
        }

        const { data, error } = await supabase
            .from('bank_transactions')
            .update(updates)
            .eq('id', transaction_id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Link Transaction Error:', error);
            return NextResponse.json({ error: 'Failed to link transaction' }, { status: 500 });
        }

        return NextResponse.json({ success: true, transaction: data });

    } catch (error: any) {
        console.error('Link API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
