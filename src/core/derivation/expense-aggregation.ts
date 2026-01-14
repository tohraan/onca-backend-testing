/**
 * Expense Aggregation
 * 
 * Tier 1: Financial Derivation (100% Coverage Required)
 * 
 * Aggregates expenses by category, date range, and vendor.
 */

export interface Expense {
    amount: number;
    category: string;
    vendor_name: string;
    expense_date: Date;
}

export interface CategoryTotal {
    category: string;
    total: number;
}

export interface VendorTotal {
    vendor: string;
    total: number;
}

/**
 * Calculate total expenses
 */
export function calculateTotalExpenses(expenses: Expense[]): number {
    if (expenses.length === 0) {
        return 0;
    }

    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    return Math.round(total * 100) / 100;
}

/**
 * Aggregate expenses by category
 */
export function aggregateByCategory(expenses: Expense[]): CategoryTotal[] {
    if (expenses.length === 0) {
        return [];
    }

    const categoryMap = new Map<string, number>();

    for (const expense of expenses) {
        const current = categoryMap.get(expense.category) || 0;
        categoryMap.set(expense.category, current + expense.amount);
    }

    return Array.from(categoryMap.entries())
        .map(([category, total]) => ({
            category,
            total: Math.round(total * 100) / 100,
        }))
        .sort((a, b) => b.total - a.total); // Sort by total descending
}

/**
 * Aggregate expenses by vendor
 */
export function aggregateByVendor(expenses: Expense[]): VendorTotal[] {
    if (expenses.length === 0) {
        return [];
    }

    const vendorMap = new Map<string, number>();

    for (const expense of expenses) {
        const current = vendorMap.get(expense.vendor_name) || 0;
        vendorMap.set(expense.vendor_name, current + expense.amount);
    }

    return Array.from(vendorMap.entries())
        .map(([vendor, total]) => ({
            vendor,
            total: Math.round(total * 100) / 100,
        }))
        .sort((a, b) => b.total - a.total);
}

/**
 * Filter expenses by date range
 */
export function filterByDateRange(
    expenses: Expense[],
    startDate: Date,
    endDate: Date
): Expense[] {
    return expenses.filter(
        exp => exp.expense_date >= startDate && exp.expense_date <= endDate
    );
}

/**
 * Calculate expenses for a specific date range
 */
export function calculateExpensesInRange(
    expenses: Expense[],
    startDate: Date,
    endDate: Date
): number {
    const filtered = filterByDateRange(expenses, startDate, endDate);
    return calculateTotalExpenses(filtered);
}
