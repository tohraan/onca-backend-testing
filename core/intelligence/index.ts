import { aiDataAccess } from '@/lib/supabase/ai-client';

/**
 * Intelligence Layer - AI Explanations and Insights
 * CRITICAL: This layer uses READ-ONLY access to prevent AI from modifying financial data
 * AI can only read from aggregated views, never raw transactions
 */

/**
 * Explain financial data using AI
 * @param data - Structured financial data (from derivation layer)
 * @param orgId - Organization ID for context
 * @returns AI-generated explanation
 */
export const explain = async (data: any, orgId?: string): Promise<string> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.LLM_MODEL || 'openai/gpt-3.5-turbo';

    if (!apiKey) {
        return "Intelligence Layer Error: OpenRouter API key missing.";
    }

    // Optionally fetch additional context from AI-safe views
    let context = '';
    if (orgId) {
        try {
            const orgContext = await aiDataAccess.getOrganizationContext(orgId);
            context = `Organization: ${orgContext.name}. `;
        } catch (error) {
            // Continue without context if fetch fails
            console.warn('Failed to fetch org context for AI:', error);
        }
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are ONCA, a financial OS for SMEs. Explain financial data deterministically and provide insights. Be concise and professional. IMPORTANT: You can only read data, never modify it."
                    },
                    {
                        "role": "user",
                        "content": `${context}Please explain this financial data: ${JSON.stringify(data)}`
                    }
                ],
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('Core Intelligence error:', error);
        return "I'm having trouble analyzing your financial data right now.";
    }
};

/**
 * Generate financial insights using AI
 * @param orgId - Organization ID
 * @param startDate - Start date for analysis
 * @param endDate - End date for analysis
 * @returns AI-generated insights
 */
export const generateInsights = async (
    orgId: string,
    startDate?: Date,
    endDate?: Date
): Promise<string> => {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.LLM_MODEL || 'openai/gpt-3.5-turbo';

    if (!apiKey) {
        return "Intelligence Layer Error: OpenRouter API key missing.";
    }

    try {
        // Fetch aggregated data from AI-safe views
        const [financialSummary, expenseSummary] = await Promise.all([
            aiDataAccess.getFinancialSummary(orgId, startDate, endDate),
            aiDataAccess.getExpenseSummary(orgId, startDate, endDate)
        ]);

        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "model": model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are ONCA, a financial OS for SMEs. Analyze aggregated financial data and provide actionable insights. Focus on trends, anomalies, and recommendations. Be concise and professional."
                    },
                    {
                        "role": "user",
                        "content": `Analyze this financial data and provide insights:\n\nIncome/Revenue Summary:\n${JSON.stringify(financialSummary, null, 2)}\n\nExpense Summary:\n${JSON.stringify(expenseSummary, null, 2)}`
                    }
                ],
            })
        });

        const result = await response.json();
        return result.choices[0].message.content;
    } catch (error) {
        console.error('Core Intelligence error:', error);
        return "I'm having trouble generating insights right now.";
    }
};
