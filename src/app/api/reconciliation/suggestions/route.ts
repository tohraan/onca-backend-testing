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

        // Fetch unlinked transactions
        const { data: transactions } = await supabase
            .from('bank_transactions')
            .select('*')
            .eq('org_id', profile.org_id)
            .is('linked_task_id', null)
            .is('linked_invoice_id', null);

        // Fetch tasks and invoices
        const { data: tasks } = await supabase
            .from('financial_tasks')
            .select('*')
            .eq('org_id', profile.org_id)
            .in('status', ['PENDING', 'OVERDUE']);

        const { data: invoices } = await supabase
            .from('invoices')
            .select('*')
            .eq('org_id', profile.org_id)
            .in('status', ['UNPAID', 'PARTIALLY_PAID', 'OVERDUE']);

        // Generate suggestions
        const suggestions: any[] = [];

        transactions?.forEach((tx: any) => {
            const txAmount = Math.abs(parseFloat(tx.amount));
            const txDesc = tx.description.toLowerCase();

            // Match with tasks
            tasks?.forEach((task: any) => {
                const taskAmount = parseFloat(task.amount);
                const counterparty = task.counterparty_name.toLowerCase();

                // Exact amount match + counterparty in description
                if (Math.abs(txAmount - taskAmount) < 0.01 && txDesc.includes(counterparty)) {
                    suggestions.push({
                        transaction_id: tx.id,
                        transaction: tx,
                        match_type: 'task',
                        match_id: task.id,
                        match_data: task,
                        confidence: 'HIGH',
                        reason: `Amount match (${txAmount}) + counterparty "${task.counterparty_name}" found in description`
                    });
                }
                // Amount match only
                else if (Math.abs(txAmount - taskAmount) < 0.01) {
                    suggestions.push({
                        transaction_id: tx.id,
                        transaction: tx,
                        match_type: 'task',
                        match_id: task.id,
                        match_data: task,
                        confidence: 'MEDIUM',
                        reason: `Amount match (${txAmount})`
                    });
                }
            });

            // Match with invoices
            invoices?.forEach((inv: any) => {
                const invAmount = parseFloat(inv.amount);
                const counterparty = inv.counterparty_name.toLowerCase();
                const invNumber = inv.invoice_number?.toLowerCase();

                // Invoice number in description
                if (invNumber && txDesc.includes(invNumber)) {
                    suggestions.push({
                        transaction_id: tx.id,
                        transaction: tx,
                        match_type: 'invoice',
                        match_id: inv.id,
                        match_data: inv,
                        confidence: 'HIGH',
                        reason: `Invoice number "${inv.invoice_number}" found in description`
                    });
                }
                // Amount + counterparty match
                else if (Math.abs(txAmount - invAmount) < 0.01 && txDesc.includes(counterparty)) {
                    suggestions.push({
                        transaction_id: tx.id,
                        transaction: tx,
                        match_type: 'invoice',
                        match_id: inv.id,
                        match_data: inv,
                        confidence: 'HIGH',
                        reason: `Amount match (${txAmount}) + counterparty "${inv.counterparty_name}" found in description`
                    });
                }
                // Amount match only
                else if (Math.abs(txAmount - invAmount) < 0.01) {
                    suggestions.push({
                        transaction_id: tx.id,
                        transaction: tx,
                        match_type: 'invoice',
                        match_id: inv.id,
                        match_data: inv,
                        confidence: 'MEDIUM',
                        reason: `Amount match (${txAmount})`
                    });
                }
            });
        });

        // Remove duplicates (keep highest confidence)
        const uniqueSuggestions = suggestions.reduce((acc: any[], curr: any) => {
            const existing = acc.find(s => s.transaction_id === curr.transaction_id && s.match_id === curr.match_id);
            if (!existing || (curr.confidence === 'HIGH' && existing.confidence !== 'HIGH')) {
                return [...acc.filter(s => !(s.transaction_id === curr.transaction_id && s.match_id === curr.match_id)), curr];
            }
            return acc;
        }, []);

        return NextResponse.json({ suggestions: uniqueSuggestions });

    } catch (error: any) {
        console.error('Suggestions API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
