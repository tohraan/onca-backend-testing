/**
 * P&L Computation Tests
 * 
 * Tier 1: Financial Derivation - 100% Coverage Required
 */

import {
    calculateTotalIncome,
    calculateTotalExpenses,
    computeNetProfitLoss,
    generatePLSummary,
    PLTransaction,
} from './pl-computation';

describe('P&L Computation', () => {
    describe('calculateTotalIncome', () => {
        it('returns zero for no transactions', () => {
            expect(calculateTotalIncome([])).toBe(0);
        });

        it('sums income transactions', () => {
            const transactions: PLTransaction[] = [
                { amount: 5000, type: 'INCOME' },
                { amount: 3000, type: 'INCOME' },
            ];
            expect(calculateTotalIncome(transactions)).toBe(8000);
        });

        it('excludes expense transactions', () => {
            const transactions: PLTransaction[] = [
                { amount: 5000, type: 'INCOME' },
                { amount: 2000, type: 'EXPENSE' },
            ];
            expect(calculateTotalIncome(transactions)).toBe(5000);
        });

        it('handles decimal amounts', () => {
            const transactions: PLTransaction[] = [
                { amount: 1234.56, type: 'INCOME' },
                { amount: 789.12, type: 'INCOME' },
            ];
            expect(calculateTotalIncome(transactions)).toBeCloseTo(2023.68, 2);
        });
    });

    describe('calculateTotalExpenses', () => {
        it('returns zero for no transactions', () => {
            expect(calculateTotalExpenses([])).toBe(0);
        });

        it('sums expense transactions', () => {
            const transactions: PLTransaction[] = [
                { amount: 1000, type: 'EXPENSE' },
                { amount: 500, type: 'EXPENSE' },
            ];
            expect(calculateTotalExpenses(transactions)).toBe(1500);
        });

        it('excludes income transactions', () => {
            const transactions: PLTransaction[] = [
                { amount: 1000, type: 'EXPENSE' },
                { amount: 5000, type: 'INCOME' },
            ];
            expect(calculateTotalExpenses(transactions)).toBe(1000);
        });

        it('handles decimal amounts', () => {
            const transactions: PLTransaction[] = [
                { amount: 123.45, type: 'EXPENSE' },
                { amount: 67.89, type: 'EXPENSE' },
            ];
            expect(calculateTotalExpenses(transactions)).toBeCloseTo(191.34, 2);
        });
    });

    describe('computeNetProfitLoss', () => {
        it('returns profit when income exceeds expenses', () => {
            expect(computeNetProfitLoss(10000, 6000)).toBe(4000);
        });

        it('returns loss when expenses exceed income', () => {
            expect(computeNetProfitLoss(5000, 8000)).toBe(-3000);
        });

        it('returns zero when equal', () => {
            expect(computeNetProfitLoss(5000, 5000)).toBe(0);
        });

        it('handles decimal amounts', () => {
            expect(computeNetProfitLoss(1234.56, 789.12)).toBeCloseTo(445.44, 2);
        });

        it('rounds to 2 decimal places', () => {
            expect(computeNetProfitLoss(100.555, 50.222)).toBe(50.33);
        });
    });

    describe('generatePLSummary', () => {
        it('returns zero summary for no transactions', () => {
            const summary = generatePLSummary([]);

            expect(summary).toEqual({
                totalIncome: 0,
                totalExpenses: 0,
                netProfitLoss: 0,
                isProfitable: false,
            });
        });

        it('generates summary for profitable business', () => {
            const transactions: PLTransaction[] = [
                { amount: 10000, type: 'INCOME' },
                { amount: 5000, type: 'INCOME' },
                { amount: 3000, type: 'EXPENSE' },
                { amount: 2000, type: 'EXPENSE' },
            ];

            const summary = generatePLSummary(transactions);

            expect(summary.totalIncome).toBe(15000);
            expect(summary.totalExpenses).toBe(5000);
            expect(summary.netProfitLoss).toBe(10000);
            expect(summary.isProfitable).toBe(true);
        });

        it('generates summary for loss-making business', () => {
            const transactions: PLTransaction[] = [
                { amount: 5000, type: 'INCOME' },
                { amount: 8000, type: 'EXPENSE' },
            ];

            const summary = generatePLSummary(transactions);

            expect(summary.totalIncome).toBe(5000);
            expect(summary.totalExpenses).toBe(8000);
            expect(summary.netProfitLoss).toBe(-3000);
            expect(summary.isProfitable).toBe(false);
        });

        it('generates summary for break-even business', () => {
            const transactions: PLTransaction[] = [
                { amount: 5000, type: 'INCOME' },
                { amount: 5000, type: 'EXPENSE' },
            ];

            const summary = generatePLSummary(transactions);

            expect(summary.totalIncome).toBe(5000);
            expect(summary.totalExpenses).toBe(5000);
            expect(summary.netProfitLoss).toBe(0);
            expect(summary.isProfitable).toBe(false);
        });

        it('handles income only', () => {
            const transactions: PLTransaction[] = [
                { amount: 10000, type: 'INCOME' },
            ];

            const summary = generatePLSummary(transactions);

            expect(summary.totalIncome).toBe(10000);
            expect(summary.totalExpenses).toBe(0);
            expect(summary.netProfitLoss).toBe(10000);
            expect(summary.isProfitable).toBe(true);
        });

        it('handles expenses only', () => {
            const transactions: PLTransaction[] = [
                { amount: 5000, type: 'EXPENSE' },
            ];

            const summary = generatePLSummary(transactions);

            expect(summary.totalIncome).toBe(0);
            expect(summary.totalExpenses).toBe(5000);
            expect(summary.netProfitLoss).toBe(-5000);
            expect(summary.isProfitable).toBe(false);
        });
    });
});
