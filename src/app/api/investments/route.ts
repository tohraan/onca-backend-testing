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

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Single investment
        if (id) {
            const { data: investment, error } = await supabase
                .from('investments')
                .select('*')
                .eq('id', id)
                .eq('org_id', profile.org_id)
                .single();

            if (error) {
                console.error('Fetch Investment Error:', error);
                return NextResponse.json({ error: 'Investment not found' }, { status: 404 });
            }

            return NextResponse.json({ investment });
        }

        // List investments
        const { data: investments, error } = await supabase
            .from('investments')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('investment_date', { ascending: false });

        if (error) {
            console.error('Fetch Investments Error:', error);
            return NextResponse.json({ error: 'Failed to fetch investments' }, { status: 500 });
        }

        // Calculate total
        const total = investments?.reduce((sum: number, inv: any) => sum + parseFloat(inv.amount), 0) || 0;

        return NextResponse.json({ investments, summary: { total } });

    } catch (error: any) {
        console.error('Investments API Error:', error);
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
        const { investment_type, amount, investment_date, notes } = body;

        // Validation
        if (!investment_type || !amount || !investment_date) {
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
            .from('investments')
            .insert({
                org_id: profile.org_id,
                investment_type,
                amount,
                investment_date,
                notes
            })
            .select()
            .single();

        if (error) {
            console.error('Create Investment Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, investment: data });

    } catch (error: any) {
        console.error('Investments API Error:', error);
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
            return NextResponse.json({ error: 'Investment ID required' }, { status: 400 });
        }

        const body = await request.json();
        const updates: any = {};

        if (body.investment_type !== undefined) updates.investment_type = body.investment_type;
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.investment_date !== undefined) updates.investment_date = body.investment_date;
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
            .from('investments')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update Investment Error:', error);
            return NextResponse.json({ error: 'Failed to update investment' }, { status: 500 });
        }

        return NextResponse.json({ success: true, investment: data });

    } catch (error: any) {
        console.error('Investments PATCH Error:', error);
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
            return NextResponse.json({ error: 'Investment ID required' }, { status: 400 });
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
            .from('investments')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete Investment Error:', error);
            return NextResponse.json({ error: 'Failed to delete investment' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Investments DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
