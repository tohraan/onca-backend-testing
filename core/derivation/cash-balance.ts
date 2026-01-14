/**
 * Cash Balance Calculator
 * 
 * Tier 1: Financial Derivation (100% Coverage Required)
 * 
 * This function creates financial truth. It must be deterministic and fully tested.
 * 
 * Philosophy: "If it calculates money, it must have a test."
 */

export interface Transaction {
    amount: number;
    type: 'INCOME' | 'EXPENSE';
}

/**
 * Calculate current cash balance from a list of transactions
 * 
 * @param transactions - Array of income and expense transactions
 * @returns Net cash balance (income - expenses)
 * @throws Error if any transaction has negative amount
 */
export function calculateCashBalance(transactions: Transaction[]): number {
    // Handle empty case
    if (transactions.length === 0) {
        return 0;
    }

    // Validate all transactions
    for (const txn of transactions) {
        if (txn.amount < 0) {
            throw new Error('Transaction amount cannot be negative');
        }
        if (txn.amount === null || txn.amount === undefined) {
            throw new Error('Transaction amount is required');
        }
    }

    // Calculate balance
    let balance = 0;

    for (const txn of transactions) {
        if (txn.type === 'INCOME') {
            balance += txn.amount;
        } else if (txn.type === 'EXPENSE') {
            balance -= txn.amount;
        }
    }

    // Round to 2 decimal places to handle floating point precision
    return Math.round(balance * 100) / 100;
}
