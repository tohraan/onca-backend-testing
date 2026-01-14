import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // PAYABLE | RECEIVABLE | EXPENSE | INCOME

        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        let query = supabase
            .from('manual_ledger_entries')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false });

        if (type) {
            query = query.eq('type', type);
        }

        const { data: entries, error } = await query;

        if (error) {
            console.error('Fetch Ledger Error:', error);
            return NextResponse.json({ error: 'Failed to fetch ledger' }, { status: 500 });
        }

        return NextResponse.json({ entries });

    } catch (error: any) {
        console.error('Ledger API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            type, // PAYABLE, RECEIVABLE, EXPENSE, INCOME
            amount,
            counterparty,
            transaction_date,
            due_date, // Can be null if Expense/Income
            invoice_number,
            category,
            notes,
            payment_mode
        } = body;

        // Validation
        if (!type || !amount || !counterparty) {
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

        // Auto-settle immediate transactions
        const isImmediate = type === 'EXPENSE' || type === 'INCOME';
        const status = isImmediate ? 'PAID' : 'OPEN';

        const { data, error } = await supabase
            .from('manual_ledger_entries')
            .insert({
                org_id: profile.org_id,
                user_id: session.user.id,
                type,
                amount,
                counterparty,
                transaction_date: transaction_date || new Date().toISOString(),
                due_date: due_date || (isImmediate ? null : new Date().toISOString()),
                invoice_number,
                category: category || 'MISC',
                notes,
                payment_mode,
                status
            })
            .select()
            .single();

        if (error) {
            console.error('Create Ledger Entry Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error('Ledger API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
        }

        const body = await request.json();
        const updates: any = {};

        // Allow updating specific fields
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.counterparty !== undefined) updates.counterparty = body.counterparty;
        if (body.transaction_date !== undefined) updates.transaction_date = body.transaction_date;
        if (body.due_date !== undefined) updates.due_date = body.due_date;
        if (body.notes !== undefined) updates.notes = body.notes;
        if (body.status !== undefined) updates.status = body.status;
        if (body.payment_mode !== undefined) updates.payment_mode = body.payment_mode;

        updates.updated_at = new Date().toISOString();

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Update with org_id check for security
        const { data, error } = await supabase
            .from('manual_ledger_entries')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update Ledger Entry Error:', error);
            return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error('Ledger PATCH Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Entry ID required' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Delete with org_id check for security
        const { error } = await supabase
            .from('manual_ledger_entries')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete Ledger Entry Error:', error);
            return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Ledger DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
