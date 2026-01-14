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
        const category = searchParams.get('category'); // Optional filtering

        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        let query = supabase
            .from('input_documents')
            .select('*')
            .eq('org_id', profile.org_id)
            .order('ingested_at', { ascending: false });

        if (category) {
            query = query.eq('category', category);
        }

        const { data: documents, error } = await query;

        if (error) {
            console.error('Fetch Documents Error:', error);
            return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
        }

        return NextResponse.json({ documents });

    } catch (error: any) {
        console.error('Documents API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
