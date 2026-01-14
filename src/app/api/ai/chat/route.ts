import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

/**
 * AI Chat API Endpoint
 * Provides conversational access to user's financial data
 */

export async function POST(request: NextRequest) {
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { message, history = [] } = await request.json();

        if (!message) {
            return NextResponse.json({ error: 'Message is required' }, { status: 400 });
        }

        // Get user profile and org
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id, email, full_name')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 400 });
        }

        // Fetch all financial context in parallel
        const [
            orgConfig,
            cashFlow,
            tdsData,
            investmentsData,
            expensesData,
            invoicesData,
            ledgerData
        ] = await Promise.all([
            // Organization config/settings
            supabase
                .from('organization_configs')
                .select('*')
                .eq('org_id', profile.org_id)
                .single(),

            // Cash flow data
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/cash/flow`, {
                headers: { cookie: request.headers.get('cookie') || '' }
            }).then(r => r.json()).catch(() => null),

            // TDS summary
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/tds/summary`, {
                headers: { cookie: request.headers.get('cookie') || '' }
            }).then(r => r.json()).catch(() => null),

            // Investments
            fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/investments`, {
                headers: { cookie: request.headers.get('cookie') || '' }
            }).then(r => r.json()).catch(() => null),

            // Expenses
            supabase
                .from('expenses')
                .select('amount, category, status')
                .eq('org_id', profile.org_id),

            // Invoices
            supabase
                .from('invoices')
                .select('total_amount, status, due_date')
                .eq('org_id', profile.org_id),

            // Ledger entries
            supabase
                .from('manual_ledger_entries')
                .select('type, amount, status')
                .eq('org_id', profile.org_id)
        ]);

        // Build financial context
        const config = orgConfig.data;
        const currency = config?.currency || 'INR';

        // Calculate summaries
        const expenses = expensesData.data || [];
        const totalExpenses = expenses.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);
        const pendingExpenses = expenses.filter((e: any) => e.status === 'PENDING').length;

        const invoices = invoicesData.data || [];
        const totalInvoiceAmount = invoices.reduce((sum: number, i: any) => sum + (i.total_amount || 0), 0);
        const unpaidInvoices = invoices.filter((i: any) => i.status !== 'PAID');
        const overdueInvoices = invoices.filter((i: any) =>
            i.status !== 'PAID' && i.due_date && new Date(i.due_date) < new Date()
        );

        const ledger = ledgerData.data || [];
        const payables = ledger.filter((l: any) => l.type === 'PAYABLE');
        const receivables = ledger.filter((l: any) => l.type === 'RECEIVABLE');
        const totalPayables = payables.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
        const totalReceivables = receivables.reduce((sum: number, r: any) => sum + (r.amount || 0), 0);
        const pendingPayables = payables.filter((p: any) => p.status === 'PENDING').length;
        const pendingReceivables = receivables.filter((r: any) => r.status === 'PENDING').length;

        // Build context object
        const financialContext = {
            user: {
                name: config?.owner_name || profile.full_name || 'User',
                email: profile.email,
                businessName: config?.business_name || 'Your Business',
                businessType: config?.business_type || 'service',
                currency: currency
            },
            cashPosition: cashFlow ? {
                currentCash: cashFlow.currentCash || 0,
                lastUpdated: cashFlow.lastUpdated,
                netPosition: (cashFlow.receivables?.total || 0) - (cashFlow.payables?.total || 0)
            } : null,
            payables: {
                total: totalPayables,
                count: payables.length,
                pending: pendingPayables
            },
            receivables: {
                total: totalReceivables,
                count: receivables.length,
                pending: pendingReceivables
            },
            invoices: {
                totalValue: totalInvoiceAmount,
                count: invoices.length,
                unpaid: unpaidInvoices.length,
                overdue: overdueInvoices.length
            },
            expenses: {
                total: totalExpenses,
                count: expenses.length,
                pending: pendingExpenses
            },
            tds: tdsData?.summary ? {
                totalPayableThisMonth: tdsData.summary.totalPayableMonth || 0,
                overdueCount: tdsData.summary.overdueCount || 0,
                upcomingCount: tdsData.summary.upcomingCount || 0
            } : null,
            investments: investmentsData?.summary ? {
                totalValue: investmentsData.summary.total || 0
            } : null
        };

        // Build AI messages
        const systemPrompt = `You are ONCA, a financial assistant for ${financialContext.user.businessName}. 
You help ${financialContext.user.name} understand their financial data.

CURRENT FINANCIAL DATA (as of ${new Date().toLocaleDateString()}):
- Currency: ${financialContext.user.currency}
- Business Type: ${financialContext.user.businessType}

CASH POSITION:
${financialContext.cashPosition ? `- Current Cash: ${financialContext.cashPosition.currentCash}
- Net Position (Receivables - Payables): ${financialContext.cashPosition.netPosition}` : '- Not yet tracked'}

ACCOUNTS PAYABLE (Money you owe):
- Total Outstanding: ${financialContext.payables.total}
- Count: ${financialContext.payables.count} entries
- Pending: ${financialContext.payables.pending}

ACCOUNTS RECEIVABLE (Money owed to you):
- Total Outstanding: ${financialContext.receivables.total}
- Count: ${financialContext.receivables.count} entries
- Pending: ${financialContext.receivables.pending}

INVOICES:
- Total Value: ${financialContext.invoices.totalValue}
- Count: ${financialContext.invoices.count}
- Unpaid: ${financialContext.invoices.unpaid}
- Overdue: ${financialContext.invoices.overdue}

EXPENSES:
- Total: ${financialContext.expenses.total}
- Count: ${financialContext.expenses.count}
- Pending Approval: ${financialContext.expenses.pending}

${financialContext.tds ? `TDS (Tax Deducted at Source):
- Total Payable This Month: ${financialContext.tds.totalPayableThisMonth}
- Overdue: ${financialContext.tds.overdueCount}
- Upcoming (7 days): ${financialContext.tds.upcomingCount}` : ''}

${financialContext.investments ? `INVESTMENTS:
- Total Portfolio Value: ${financialContext.investments.totalValue}` : ''}

RULES:
1. Always format currency amounts with the ${financialContext.user.currency} symbol
2. Be concise and professional
3. If asked about data you don't have, say so honestly
4. You can only READ data, never modify anything
5. Provide actionable insights when appropriate`;

        // Build conversation history
        const messages = [
            { role: 'system', content: systemPrompt },
            ...history.slice(-10).map((h: any) => ({ role: h.role, content: h.content })),
            { role: 'user', content: message }
        ];

        // Call OpenRouter API
        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.LLM_MODEL || 'openai/gpt-4o-mini';

        if (!apiKey) {
            return NextResponse.json({
                error: 'AI service not configured',
                response: "I apologize, but the AI service is not configured. Please contact your administrator to set up the OpenRouter API key."
            }, { status: 200 });
        }

        const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: model,
                messages: messages,
                temperature: 0.7,
                max_tokens: 1000
            })
        });

        const aiResult = await aiResponse.json();

        if (aiResult.error) {
            console.error('OpenRouter error:', aiResult.error);
            return NextResponse.json({
                error: 'AI service error',
                response: "I'm having trouble processing your request right now. Please try again later."
            }, { status: 200 });
        }

        const response = aiResult.choices?.[0]?.message?.content || "I couldn't generate a response.";

        return NextResponse.json({
            response,
            context: {
                businessName: financialContext.user.businessName,
                currency: financialContext.user.currency
            }
        });

    } catch (error: any) {
        console.error('AI Chat API error:', error);
        return NextResponse.json({
            error: error.message,
            response: "Something went wrong. Please try again."
        }, { status: 500 });
    }
}
