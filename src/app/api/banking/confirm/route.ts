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
        const {
            bank_name,
            account_label,
            statement_period,
            file_hash,
            transactions
        } = body;

        if (!bank_name || !statement_period || !file_hash || !transactions) {
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

        // Create statement record
        const { data: statement, error: statementError } = await supabase
            .from('bank_statements')
            .insert({
                org_id: profile.org_id,
                bank_name,
                account_label,
                statement_period,
                file_hash,
                uploaded_by: session.user.id
            })
            .select()
            .single();

        if (statementError) {
            console.error('Create Statement Error:', statementError);
            return NextResponse.json({ error: 'Failed to create statement' }, { status: 500 });
        }

        // Insert transactions
        const transactionsToInsert = transactions.map((t: any) => ({
            org_id: profile.org_id,
            statement_id: statement.id,
            transaction_date: t.transaction_date,
            description: t.description,
            amount: t.amount,
            direction: t.direction
        }));

        const { error: txError } = await supabase
            .from('bank_transactions')
            .insert(transactionsToInsert);

        if (txError) {
            console.error('Insert Transactions Error:', txError);
            return NextResponse.json({ error: 'Failed to insert transactions' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            statement_id: statement.id,
            transaction_count: transactions.length
        });

    } catch (error: any) {
        console.error('Bank Confirm API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
