/**
 * P&L (Profit & Loss) Computation
 * 
 * Tier 1: Financial Derivation (100% Coverage Required)
 * 
 * Computes profit and loss from income and expense transactions.
 */

export interface PLTransaction {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    category?: string;
}

export interface PLSummary {
    totalIncome: number;
    totalExpenses: number;
    netProfitLoss: number;
    isProfitable: boolean;
}

/**
 * Calculate total income from transactions
 */
export function calculateTotalIncome(transactions: PLTransaction[]): number {
    const total = transactions
        .filter(t => t.type === 'INCOME')
        .reduce((sum, t) => sum + t.amount, 0);

    return Math.round(total * 100) / 100;
}

/**
 * Calculate total expenses from transactions
 */
export function calculateTotalExpenses(transactions: PLTransaction[]): number {
    const total = transactions
        .filter(t => t.type === 'EXPENSE')
        .reduce((sum, t) => sum + t.amount, 0);

    return Math.round(total * 100) / 100;
}

/**
 * Compute net profit or loss
 */
export function computeNetProfitLoss(income: number, expenses: number): number {
    return Math.round((income - expenses) * 100) / 100;
}

/**
 * Generate complete P&L summary
 */
export function generatePLSummary(transactions: PLTransaction[]): PLSummary {
    const totalIncome = calculateTotalIncome(transactions);
    const totalExpenses = calculateTotalExpenses(transactions);
    const netProfitLoss = computeNetProfitLoss(totalIncome, totalExpenses);

    return {
        totalIncome,
        totalExpenses,
        netProfitLoss,
        isProfitable: netProfitLoss > 0,
    };
}
