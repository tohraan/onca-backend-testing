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

        // 1. Get Latest Cash Snapshot
        const { data: snapshot } = await supabase
            .from('cash_snapshots')
            .select('available_balance, created_at')
            .eq('org_id', profile.org_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        const currentCash = snapshot?.available_balance || 0;
        const lastUpdated = snapshot?.created_at;

        // 2. Get Open Receivables
        const { data: receivables } = await supabase
            .from('manual_ledger_entries')
            .select('amount, status')
            .eq('org_id', profile.org_id)
            .eq('type', 'RECEIVABLE')
            .in('status', ['OPEN', 'PARTIAL', 'OVERDUE']);

        // 3. Get Open Payables
        const { data: payables } = await supabase
            .from('manual_ledger_entries')
            .select('amount, status')
            .eq('org_id', profile.org_id)
            .eq('type', 'PAYABLE')
            .in('status', ['OPEN', 'PARTIAL', 'OVERDUE']);

        const totalReceivables = receivables?.reduce((sum, r) => sum + r.amount, 0) || 0;
        const totalPayables = payables?.reduce((sum, p) => sum + p.amount, 0) || 0;

        // 4. Calculate Projections
        const projectedOptimistic = currentCash + totalReceivables - totalPayables;
        const projectedConservative = currentCash - totalPayables; // Assume 0 receivables come in

        return NextResponse.json({
            currentCash,
            lastUpdated,
            receivables: {
                total: totalReceivables
            },
            payables: {
                total: totalPayables
            },
            projections: {
                optimistic: projectedOptimistic,
                conservative: projectedConservative
            }
        });

    } catch (error: any) {
        console.error('Cash Flow API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
