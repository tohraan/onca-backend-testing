import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // Fetch unlinked bank transactions
        const { data: unlinkedTransactions } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('org_id', profile.org_id)
            .is('linked_task_id', null)
            .is('linked_invoice_id', null)
            .order('transaction_date', { ascending: false });

        // Fetch outstanding payables/receivables
        const { data: outstandingTasks } = await supabase
            .from('financial_tasks')
            .select('*')
            .eq('org_id', profile.org_id)
            .in('status', ['PENDING', 'OVERDUE'])
            .order('expected_date', { ascending: true });

        // Fetch outstanding invoices
        const { data: outstandingInvoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('org_id', profile.org_id)
            .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE'])
            .order('due_date', { ascending: true });

        // Calculate bank balance
        const { data: allTransactions } = await supabase
            .from('bank_transactions')
            .select('amount, direction')
            .eq('org_id', profile.org_id);

        let bankBalance = 0;
        allTransactions?.forEach((tx: any) => {
            if (tx.direction === 'CREDIT') {
                bankBalance += parseFloat(tx.amount);
            } else {
                bankBalance -= parseFloat(tx.amount);
            }
        });

        // Calculate expected cash from tasks
        let expectedReceivables = 0;
        let expectedPayables = 0;

        outstandingTasks?.forEach((task: any) => {
            if (task.type === 'RECEIVABLE') {
                expectedReceivables += parseFloat(task.amount);
            } else {
                expectedPayables += parseFloat(task.amount);
            }
        });

        outstandingInvoices?.forEach((inv: any) => {
            if (inv.invoice_type === 'RECEIVABLE') {
                expectedReceivables += parseFloat(inv.amount);
            } else {
                expectedPayables += parseFloat(inv.amount);
            }
        });

        const expectedCash = bankBalance + expectedReceivables - expectedPayables;

        return NextResponse.json({
            summary: {
                bankBalance,
                expectedReceivables,
                expectedPayables,
                expectedCash,
                unlinkedCount: unlinkedTransactions?.length || 0,
                outstandingTasksCount: outstandingTasks?.length || 0,
                outstandingInvoicesCount: outstandingInvoices?.length || 0
            },
            unlinkedTransactions: unlinkedTransactions || [],
            outstandingTasks: outstandingTasks || [],
            outstandingInvoices: outstandingInvoices || []
        });

    } catch (error: any) {
        console.error('Reconciliation API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
