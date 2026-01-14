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

        const { data: entries } = await supabase
            .from('tds_entries')
            .select('*')
            .eq('org_id', profile.org_id);

        const today = new Date().toISOString().split('T')[0];
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const sevenDaysStr = sevenDaysFromNow.toISOString().split('T')[0];

        // Get current month range
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

        // Calculate summary
        const totalPayableMonth = entries
            ?.filter((e: any) => e.due_date >= firstDay && e.due_date <= lastDay && e.status === 'PENDING')
            .reduce((sum: number, e: any) => sum + parseFloat(e.tds_amount), 0) || 0;

        const overdueCount = entries
            ?.filter((e: any) => e.due_date < today && e.status === 'PENDING')
            .length || 0;

        const upcomingCount = entries
            ?.filter((e: any) => e.due_date >= today && e.due_date <= sevenDaysStr && e.status === 'PENDING')
            .length || 0;

        return NextResponse.json({
            summary: {
                totalPayableMonth,
                overdueCount,
                upcomingCount
            }
        });

    } catch (error: any) {
        console.error('TDS Summary API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
