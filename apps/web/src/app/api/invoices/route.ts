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
        const type = searchParams.get('type'); // PAYABLE | RECEIVABLE
        const id = searchParams.get('id'); // Single invoice

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Single invoice
        if (id) {
            const { data: invoice, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('id', id)
                .eq('org_id', profile.org_id)
                .single();

            if (error) {
                console.error('Fetch Invoice Error:', error);
                return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
            }

            return NextResponse.json({ invoice });
        }

        // List invoices
        let query = supabase
            .from('invoices')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('due_date', { ascending: true });

        if (type) {
            query = query.eq('invoice_type', type);
        }

        const { data: invoices, error } = await query;

        if (error) {
            console.error('Fetch Invoices Error:', error);
            return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
        }

        return NextResponse.json({ invoices });

    } catch (error: any) {
        console.error('Invoices API Error:', error);
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
            invoice_type,
            counterparty_name,
            invoice_number,
            amount,
            tax_amount,
            invoice_date,
            due_date,
            source,
            input_document_id,
            notes
        } = body;

        // Validation
        if (!invoice_type || !counterparty_name || !amount || !invoice_date || !due_date) {
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
            .from('invoices')
            .insert({
                org_id: profile.org_id,
                invoice_type,
                counterparty_name,
                invoice_number,
                amount,
                tax_amount: tax_amount || 0,
                invoice_date,
                due_date,
                source: source || 'MANUAL',
                input_document_id,
                notes,
                status: 'UNPAID'
            })
            .select()
            .single();

        if (error) {
            console.error('Create Invoice Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, invoice: data });

    } catch (error: any) {
        console.error('Invoices API Error:', error);
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
            return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
        }

        const body = await request.json();
        const updates: any = {};

        // Allow updating specific fields
        if (body.counterparty_name !== undefined) updates.counterparty_name = body.counterparty_name;
        if (body.invoice_number !== undefined) updates.invoice_number = body.invoice_number;
        if (body.amount !== undefined) updates.amount = body.amount;
        if (body.tax_amount !== undefined) updates.tax_amount = body.tax_amount;
        if (body.invoice_date !== undefined) updates.invoice_date = body.invoice_date;
        if (body.due_date !== undefined) updates.due_date = body.due_date;
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
            .from('invoices')
            .update(updates)
            .eq('id', id)
            .eq('org_id', profile.org_id)
            .select()
            .single();

        if (error) {
            console.error('Update Invoice Error:', error);
            return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
        }

        return NextResponse.json({ success: true, invoice: data });

    } catch (error: any) {
        console.error('Invoices PATCH Error:', error);
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
            return NextResponse.json({ error: 'Invoice ID required' }, { status: 400 });
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
            .from('invoices')
            .delete()
            .eq('id', id)
            .eq('org_id', profile.org_id);

        if (error) {
            console.error('Delete Invoice Error:', error);
            return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Invoices DELETE Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
