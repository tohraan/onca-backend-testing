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
        const filter = searchParams.get('filter'); // 'overdue' | 'upcoming'

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Single entry
        if (id) {
            const { data: entry, error } = await supabase
                .from('tds_entries')
                .select('*')
                .eq('id', id)
                .eq('org_id', profile.org_id)
                .single();

            if (error) {
                console.error('Fetch TDS Entry Error:', error);
                return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
            }

            return NextResponse.json({ entry });
        }

        // List entries
        let query = supabase
            .from('tds_entries')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('due_date', { ascending: true });

        const today = new Date().toISOString().split('T')[0];

        if (filter === 'overdue') {
            query = query.lt('due_date', today).eq('status', 'PENDING');
        } else if (filter === 'upcoming') {
            const sevenDaysFromNow = new Date();
            sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
            query = query.lte('due_date', sevenDaysFromNow.toISOString().split('T')[0]).eq('status', 'PENDING');
        }

        const { data: entries, error } = await query;

        if (error) {
            console.error('Fetch TDS Error:', error);
            return NextResponse.json({ error: 'Failed to fetch TDS entries' }, { status: 500 });
        }

        // Auto-calculate overdue status
        const entriesWithStatus = entries.map((entry: any) => {
            if (entry.status === 'PENDING' && entry.due_date < today) {
                return { ...entry, status: 'OVERDUE' };
            }
            return entry;
        });

        return NextResponse.json({ entries: entriesWithStatus });

    } catch (error: any) {
        console.error('TDS API Error:', error);
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
            vendor_name,
            invoice_reference,
            payment_date,
            payment_amount,
            tds_rate,
            due_date,
            linked_invoice_id,
            linked_task_id
        } = body;

        // Validation
        if (!vendor_name || !payment_date || !payment_amount || !tds_rate || !due_date) {
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

        // Calculate TDS Amount
        const tds_amount = (parseFloat(payment_amount) * parseFloat(tds_rate)) / 100;

        const { data, error } = await supabase
            .from('tds_entries')
            .insert({
                org_id: profile.org_id,
                user_id: session.user.id,
                vendor_name,
                invoice_reference,
                payment_date,
                payment_amount,
                tds_rate,
                tds_amount,
                due_date,
                linked_invoice_id,
                linked_task_id,
                status: 'PENDING'
            })
            .select()
            .single();

        if (error) {
            console.error('Create TDS Entry Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error('TDS API Error:', error);
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
        if (body.vendor_name !== undefined) updates.vendor_name = body.vendor_name;
        if (body.payment_amount !== undefined) {
            updates.payment_amount = body.payment_amount;
            // Recalculate TDS if amount changes
            if (body.tds_rate !== undefined) {
                updates.tds_amount = (parseFloat(body.payment_amount) * parseFloat(body.tds_rate)) / 100;
            }
        }
        if (body.tds_rate !== undefined) updates.tds_rate = body.tds_rate;
        if (body.due_date !== undefined) updates.due_date = body.due_date;
        if (body.status !== undefined) updates.status = body.status;

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
            .from('tds_entries')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update TDS Entry Error:', error);
            return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });

    } catch (error: any) {
        console.error('TDS PATCH Error:', error);
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

        const { error } = await supabase
            .from('tds_entries')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete TDS Entry Error:', error);
            return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('TDS DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
