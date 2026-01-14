import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { explain } from '@core/intelligence'
import { deriveSummary } from '@core/derivation'

export async function GET(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // 1. Derivation (Current Truth)
        const summary = await deriveSummary(user.id)

        // 2. Intelligence (AI Interpretation)
        const insight = await explain(summary)

        return NextResponse.json({ insight, summary })
    } catch (error: any) {
        console.error('Insights API error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
