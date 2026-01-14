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
        const type = searchParams.get('type'); // PAYABLE | RECEIVABLE

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Single task
        if (id) {
            const { data: task, error } = await supabase
                .from('financial_tasks')
                .select('*')
                .eq('id', id)
                .eq('org_id', profile.org_id)
                .single();

            if (error) {
                console.error('Fetch Financial Task Error:', error);
                return NextResponse.json({ error: 'Task not found' }, { status: 404 });
            }

            return NextResponse.json({ task });
        }

        // List tasks
        let query = supabase
            .from('financial_tasks')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('expected_date', { ascending: true });

        if (type) {
            query = query.eq('type', type);
        }

        const { data: tasks, error } = await query;

        if (error) {
            console.error('Fetch Financial Tasks Error:', error);
            return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
        }

        // Auto-calculate overdue status
        const today = new Date().toISOString().split('T')[0];
        const tasksWithStatus = tasks.map((task: any) => {
            if (task.status === 'PENDING' && task.expected_date < today) {
                return { ...task, status: 'OVERDUE' };
            }
            return task;
        });

        return NextResponse.json({ tasks: tasksWithStatus });

    } catch (error: any) {
        console.error('Financial Tasks API Error:', error);
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
            type,
            counterparty_name,
            amount,
            expected_date,
            notes,
            linked_invoice_id
        } = body;

        // Validation
        if (!type || !counterparty_name || !amount || !expected_date) {
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
            .from('financial_tasks')
            .insert({
                org_id: profile.org_id,
                type,
                counterparty_name,
                amount,
                expected_date,
                notes,
                linked_invoice_id,
                source: 'MANUAL',
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error('Create Financial Task Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, task: data });

    } catch (error: any) {
        console.error('Financial Tasks API Error:', error);
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
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
        }

        const body = await request.json();
        const updates: any = {};

        // Allow updating specific fields
        if (body.counterparty_name !== undefined) updates.counterparty_name = body.counterparty_name;
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.expected_date !== undefined) updates.expected_date = body.expected_date;
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
            .from('financial_tasks')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update Financial Task Error:', error);
            return NextResponse.json({ error: 'Failed to update task' }, { status: 500 });
        }

        return NextResponse.json({ success: true, task: data });

    } catch (error: any) {
        console.error('Financial Tasks PATCH Error:', error);
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
            return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
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
            .from('financial_tasks')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete Financial Task Error:', error);
            return NextResponse.json({ error: 'Failed to delete task' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Financial Tasks DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
