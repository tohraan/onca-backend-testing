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
        const id = searchParams.get('id');
        const filter = searchParams.get('filter'); // 'month' | 'unreconciled'

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (profileError) {
            console.error('Profile Error:', profileError);
            return NextResponse.json({ error: 'Profile lookup failed', details: profileError.message }, { status: 500 });
        }

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Single expense
        if (id) {
            const { data: expense, error } = await supabase
                .from('expenses')
                .select('*')
                .eq('id', id)
                .eq('org_id', profile.org_id)
                .single();

            if (error) {
                console.error('Fetch Expense Error:', error);
                return NextResponse.json({ error: 'Expense not found', details: error.message }, { status: 404 });
            }

            return NextResponse.json({ expense });
        }

        // List expenses
        let query = supabase
            .from('expenses')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('expense_date', { ascending: false });

        if (filter === 'month') {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            query = query.gte('expense_date', firstDay).lte('expense_date', lastDay);
        } else if (filter === 'unreconciled') {
            query = query.eq('status', 'UNRECONCILED');
        }

        const { data: expenses, error } = await query;

        if (error) {
            console.error('Fetch Expenses Error:', error);
            // Check if table doesn't exist
            if (error.message.includes('relation') || error.code === '42P01') {
                return NextResponse.json({
                    error: 'Expenses table not found. Please run the migration script.',
                    details: error.message
                }, { status: 500 });
            }
            return NextResponse.json({ error: 'Failed to fetch expenses', details: error.message }, { status: 500 });
        }

        return NextResponse.json({ expenses: expenses || [] });

    } catch (error: any) {
        console.error('Expenses API Error:', error);
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
            expense_date,
            amount,
            category,
            vendor_name,
            payment_method,
            input_document_id,
            notes
        } = body;

        // Validation
        if (!expense_date || !amount || !vendor_name) {
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

        const { data, error } = await supabase
            .from('expenses')
            .insert({
                org_id: profile.org_id,
                expense_date,
                amount,
                category: category || 'MISC',
                vendor_name,
                payment_method: payment_method || 'UNKNOWN',
                input_document_id,
                notes,
                status: 'UNRECONCILED'
            })
            .select()
            .single();

        if (error) {
            console.error('Create Expense Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, expense: data });

    } catch (error: any) {
        console.error('Expenses API Error:', error);
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
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const body = await request.json();
        const updates: any = {};

        // Allow updating specific fields
        if (body.expense_date !== undefined) updates.expense_date = body.expense_date;
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.category !== undefined) updates.category = body.category;
        if (body.vendor_name !== undefined) updates.vendor_name = body.vendor_name;
        if (body.payment_method !== undefined) updates.payment_method = body.payment_method;
        if (body.status !== undefined) updates.status = body.status;
        if (body.notes !== undefined) updates.notes = body.notes;

        updates.updated_at = new Date().toISOString();

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const { data, error } = await supabase
            .from('expenses')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update Expense Error:', error);
            return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true, expense: data });

    } catch (error: any) {
        console.error('Expenses PATCH Error:', error);
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
            return NextResponse.json({ error: 'Expense ID required' }, { status: 400 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete Expense Error:', error);
            return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Expenses DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
