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
        const { start_date, end_date, format } = body;

        if (!start_date || !end_date || !format) {
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

        // Aggregate data from all sources
        const [ledgerRes, invoicesRes, expensesRes, tdsRes] = await Promise.all([
            supabase.from('manual_ledger_entries')
                .select('*')
                .eq('org_id', profile.org_id)
                .gte('transaction_date', start_date)
                .lte('transaction_date', end_date),

            supabase.from('invoices')
                .select('*')
                .eq('org_id', profile.org_id)
                .gte('issue_date', start_date)
                .lte('issue_date', end_date),

            supabase.from('expenses')
                .select('*')
                .eq('org_id', profile.org_id)
                .gte('expense_date', start_date)
                .lte('expense_date', end_date),

            supabase.from('tds_entries')
                .select('*')
                .eq('org_id', profile.org_id)
                .gte('payment_date', start_date)
                .lte('payment_date', end_date)
        ]);

        // Calculate summaries
        const ledgerEntries = ledgerRes.data || [];
        const invoices = invoicesRes.data || [];
        const expenses = expensesRes.data || [];
        const tdsEntries = tdsRes.data || [];

        const totalIncome = ledgerEntries
            .filter((e: any) => e.entry_type === 'INCOME')
            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

        const totalExpenses = expenses
            .reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0);

        const totalReceivables = invoices
            .filter((i: any) => i.invoice_type === 'RECEIVABLE' && i.status !== 'PAID')
            .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

        const totalPayables = invoices
            .filter((i: any) => i.invoice_type === 'PAYABLE' && i.status !== 'PAID')
            .reduce((sum: number, i: any) => sum + parseFloat(i.amount), 0);

        const totalTDS = tdsEntries
            .filter((t: any) => t.status === 'PENDING')
            .reduce((sum: number, t: any) => sum + parseFloat(t.tds_amount), 0);

        const reportData = {
            period: { start_date, end_date },
            summary: {
                totalIncome,
                totalExpenses,
                netIncome: totalIncome - totalExpenses,
                totalReceivables,
                totalPayables,
                netCashPosition: totalReceivables - totalPayables,
                totalTDS
            },
            details: {
                ledger: ledgerEntries,
                invoices,
                expenses,
                tds: tdsEntries
            }
        };

        // For MVP, return JSON data
        // In production, generate actual PDF/Excel here
        return NextResponse.json({
            success: true,
            format,
            report: reportData,
            message: 'Report generated successfully. Download functionality coming soon.'
        });

    } catch (error: any) {
        console.error('Report Generation Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
