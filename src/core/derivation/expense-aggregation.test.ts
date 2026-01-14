/**
 * Expense Aggregation Tests
 * 
 * Tier 1: Financial Derivation - 100% Coverage Required
 */

import {
    calculateTotalExpenses,
    aggregateByCategory,
    aggregateByVendor,
    filterByDateRange,
    calculateExpensesInRange,
    Expense,
} from './expense-aggregation';

describe('Expense Aggregation', () => {
    const sampleExpenses: Expense[] = [
        { amount: 1000, category: 'OFFICE', vendor_name: 'Staples', expense_date: new Date('2024-01-10') },
        { amount: 500, category: 'OFFICE', vendor_name: 'Amazon', expense_date: new Date('2024-01-15') },
        { amount: 2000, category: 'MARKETING', vendor_name: 'Google Ads', expense_date: new Date('2024-01-20') },
        { amount: 1500, category: 'TRAVEL', vendor_name: 'Uber', expense_date: new Date('2024-01-25') },
        { amount: 800, category: 'OFFICE', vendor_name: 'Staples', expense_date: new Date('2024-02-05') },
    ];

    describe('calculateTotalExpenses', () => {
        it('returns zero for empty expenses', () => {
            expect(calculateTotalExpenses([])).toBe(0);
        });

        it('sums all expenses correctly', () => {
            expect(calculateTotalExpenses(sampleExpenses)).toBe(5800);
        });

        it('handles single expense', () => {
            const expenses: Expense[] = [
                { amount: 1234.56, category: 'OFFICE', vendor_name: 'Test', expense_date: new Date() },
            ];
            expect(calculateTotalExpenses(expenses)).toBe(1234.56);
        });

        it('rounds to 2 decimal places', () => {
            const expenses: Expense[] = [
                { amount: 10.555, category: 'OFFICE', vendor_name: 'Test', expense_date: new Date() },
                { amount: 20.444, category: 'OFFICE', vendor_name: 'Test', expense_date: new Date() },
            ];
            expect(calculateTotalExpenses(expenses)).toBe(31);
        });
    });

    describe('aggregateByCategory', () => {
        it('returns empty array for no expenses', () => {
            expect(aggregateByCategory([])).toEqual([]);
        });

        it('aggregates single category', () => {
            const expenses: Expense[] = [
                { amount: 100, category: 'OFFICE', vendor_name: 'Test', expense_date: new Date() },
                { amount: 200, category: 'OFFICE', vendor_name: 'Test', expense_date: new Date() },
            ];

            const result = aggregateByCategory(expenses);

            expect(result).toEqual([
                { category: 'OFFICE', total: 300 },
            ]);
        });

        it('aggregates multiple categories', () => {
            const result = aggregateByCategory(sampleExpenses);

            expect(result).toEqual([
                { category: 'OFFICE', total: 2300 }, // 1000 + 500 + 800
                { category: 'MARKETING', total: 2000 },
                { category: 'TRAVEL', total: 1500 },
            ]);
        });

        it('sorts by total descending', () => {
            const expenses: Expense[] = [
                { amount: 100, category: 'A', vendor_name: 'Test', expense_date: new Date() },
                { amount: 500, category: 'B', vendor_name: 'Test', expense_date: new Date() },
                { amount: 300, category: 'C', vendor_name: 'Test', expense_date: new Date() },
            ];

            const result = aggregateByCategory(expenses);

            expect(result[0].category).toBe('B');
            expect(result[1].category).toBe('C');
            expect(result[2].category).toBe('A');
        });
    });

    describe('aggregateByVendor', () => {
        it('returns empty array for no expenses', () => {
            expect(aggregateByVendor([])).toEqual([]);
        });

        it('aggregates single vendor', () => {
            const expenses: Expense[] = [
                { amount: 100, category: 'OFFICE', vendor_name: 'Staples', expense_date: new Date() },
                { amount: 200, category: 'OFFICE', vendor_name: 'Staples', expense_date: new Date() },
            ];

            const result = aggregateByVendor(expenses);

            expect(result).toEqual([
                { vendor: 'Staples', total: 300 },
            ]);
        });

        it('aggregates multiple vendors', () => {
            const result = aggregateByVendor(sampleExpenses);

            expect(result).toContainEqual({ vendor: 'Staples', total: 1800 }); // 1000 + 800
            expect(result).toContainEqual({ vendor: 'Amazon', total: 500 });
            expect(result).toContainEqual({ vendor: 'Google Ads', total: 2000 });
            expect(result).toContainEqual({ vendor: 'Uber', total: 1500 });
        });

        it('sorts by total descending', () => {
            const result = aggregateByVendor(sampleExpenses);

            expect(result[0].vendor).toBe('Google Ads');
            expect(result[0].total).toBe(2000);
        });
    });

    describe('filterByDateRange', () => {
        it('returns empty for no expenses', () => {
            const result = filterByDateRange([], new Date('2024-01-01'), new Date('2024-01-31'));
            expect(result).toEqual([]);
        });

        it('filters expenses within range', () => {
            const result = filterByDateRange(
                sampleExpenses,
                new Date('2024-01-01'),
                new Date('2024-01-31')
            );

            expect(result.length).toBe(4); // Excludes Feb expense
        });

        it('includes boundary dates', () => {
            const result = filterByDateRange(
                sampleExpenses,
                new Date('2024-01-10'),
                new Date('2024-01-20')
            );

            expect(result.length).toBe(3); // Includes both boundary dates
        });

        it('returns empty for range with no expenses', () => {
            const result = filterByDateRange(
                sampleExpenses,
                new Date('2024-03-01'),
                new Date('2024-03-31')
            );

            expect(result).toEqual([]);
        });
    });

    describe('calculateExpensesInRange', () => {
        it('returns zero for empty range', () => {
            const result = calculateExpensesInRange(
                sampleExpenses,
                new Date('2024-03-01'),
                new Date('2024-03-31')
            );

            expect(result).toBe(0);
        });

        it('calculates total for date range', () => {
            const result = calculateExpensesInRange(
                sampleExpenses,
                new Date('2024-01-01'),
                new Date('2024-01-31')
            );

            // 1000 + 500 + 2000 + 1500 = 5000
            expect(result).toBe(5000);
        });

        it('calculates total for single month', () => {
            const result = calculateExpensesInRange(
                sampleExpenses,
                new Date('2024-02-01'),
                new Date('2024-02-29')
            );

            expect(result).toBe(800);
        });
    });
});
