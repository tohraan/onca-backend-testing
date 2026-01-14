/**
 * AI-Specific Supabase Client
 * Read-only client for AI operations
 * Prevents AI from writing to financial tables
 */

import { createClient } from '@supabase/supabase-js';

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
}

if (!process.env.SUPABASE_AI_SERVICE_KEY) {
    throw new Error('Missing SUPABASE_AI_SERVICE_KEY - AI operations require read-only service key');
}

/**
 * Create AI-specific Supabase client with read-only access
 * This client uses the ai_reader role and can only SELECT from approved views
 */
export const createAIClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_AI_SERVICE_KEY!,
        {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            },
            db: {
                schema: 'public',
            },
        }
    );
};

/**
 * Type-safe wrapper for AI queries
 * Only allows SELECT operations on approved views
 */
export class AIDataAccess {
    private client: ReturnType<typeof createClient>;

    constructor() {
        this.client = createAIClient();
    }

    /**
     * Get financial summary for AI insights
     * @param orgId - Organization ID
     * @param startDate - Start date for analysis
     * @param endDate - End date for analysis
     */
    async getFinancialSummary(orgId: string, startDate?: Date, endDate?: Date) {
        let query = this.client
            .from('ai_financial_summary')
            .select('*')
            .eq('org_id', orgId);

        if (startDate) {
            query = query.gte('month', startDate.toISOString());
        }

        if (endDate) {
            query = query.lte('month', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`AI data access error: ${error.message}`);
        }

        return data;
    }

    /**
     * Get expense summary for AI insights
     * @param orgId - Organization ID
     * @param startDate - Start date for analysis
     * @param endDate - End date for analysis
     */
    async getExpenseSummary(orgId: string, startDate?: Date, endDate?: Date) {
        let query = this.client
            .from('ai_expense_summary')
            .select('*')
            .eq('org_id', orgId);

        if (startDate) {
            query = query.gte('month', startDate.toISOString());
        }

        if (endDate) {
            query = query.lte('month', endDate.toISOString());
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(`AI data access error: ${error.message}`);
        }

        return data;
    }

    /**
     * Get organization context for AI
     * @param orgId - Organization ID
     */
    async getOrganizationContext(orgId: string) {
        const { data, error } = await this.client
            .from('organizations')
            .select('id, name, created_at')
            .eq('id', orgId)
            .single();

        if (error) {
            throw new Error(`AI data access error: ${error.message}`);
        }

        return data;
    }

    /**
     * INTENTIONALLY NO WRITE METHODS
     * AI should never write to the database
     * Any attempt to add insert/update/delete methods here
     * should be flagged in code review
     */
}

/**
 * Singleton instance for AI data access
 */
export const aiDataAccess = new AIDataAccess();
