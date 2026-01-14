/**
 * Cash Balance Calculator Tests
 * 
 * Tier 1: Financial Derivation - 100% Coverage Required
 * 
 * Test Philosophy:
 * - Test zero case first
 * - Test single type, then mixed
 * - Test edge cases explicitly
 * - Test invalid inputs
 */

import { calculateCashBalance, Transaction } from './cash-balance';

describe('calculateCashBalance', () => {
    describe('with no transactions', () => {
        it('returns zero balance', () => {
            const result = calculateCashBalance([]);
            expect(result).toBe(0);
        });
    });

    describe('with income only', () => {
        it('sums positive transactions', () => {
            const transactions: Transaction[] = [
                { amount: 1000, type: 'INCOME' },
                { amount: 500, type: 'INCOME' },
            ];
            expect(calculateCashBalance(transactions)).toBe(1500);
        });

        it('handles single income transaction', () => {
            const transactions: Transaction[] = [
                { amount: 2500, type: 'INCOME' },
            ];
            expect(calculateCashBalance(transactions)).toBe(2500);
        });
    });

    describe('with expenses only', () => {
        it('subtracts negative transactions', () => {
            const transactions: Transaction[] = [
                { amount: 1000, type: 'EXPENSE' },
                { amount: 500, type: 'EXPENSE' },
            ];
            expect(calculateCashBalance(transactions)).toBe(-1500);
        });

        it('handles single expense transaction', () => {
            const transactions: Transaction[] = [
                { amount: 800, type: 'EXPENSE' },
            ];
            expect(calculateCashBalance(transactions)).toBe(-800);
        });
    });

    describe('with mixed transactions', () => {
        it('calculates net balance correctly', () => {
            const transactions: Transaction[] = [
                { amount: 2000, type: 'INCOME' },
                { amount: 800, type: 'EXPENSE' },
                { amount: 300, type: 'EXPENSE' },
            ];
            expect(calculateCashBalance(transactions)).toBe(900);
        });

        it('handles multiple mixed transactions', () => {
            const transactions: Transaction[] = [
                { amount: 5000, type: 'INCOME' },
                { amount: 1200, type: 'EXPENSE' },
                { amount: 3000, type: 'INCOME' },
                { amount: 500, type: 'EXPENSE' },
                { amount: 2000, type: 'INCOME' },
            ];
            // 5000 + 3000 + 2000 - 1200 - 500 = 8300
            expect(calculateCashBalance(transactions)).toBe(8300);
        });

        it('handles result that equals zero', () => {
            const transactions: Transaction[] = [
                { amount: 1000, type: 'INCOME' },
                { amount: 1000, type: 'EXPENSE' },
            ];
            expect(calculateCashBalance(transactions)).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('handles zero amounts', () => {
            const transactions: Transaction[] = [
                { amount: 0, type: 'INCOME' },
                { amount: 100, type: 'INCOME' },
            ];
            expect(calculateCashBalance(transactions)).toBe(100);
        });

        it('handles floating point precision', () => {
            const transactions: Transaction[] = [
                { amount: 0.1, type: 'INCOME' },
                { amount: 0.2, type: 'INCOME' },
            ];
            expect(calculateCashBalance(transactions)).toBeCloseTo(0.3, 2);
        });

        it('handles decimal amounts correctly', () => {
            const transactions: Transaction[] = [
                { amount: 123.45, type: 'INCOME' },
                { amount: 67.89, type: 'EXPENSE' },
            ];
            expect(calculateCashBalance(transactions)).toBeCloseTo(55.56, 2);
        });

        it('rounds to 2 decimal places', () => {
            const transactions: Transaction[] = [
                { amount: 10.555, type: 'INCOME' },
            ];
            expect(calculateCashBalance(transactions)).toBe(10.56);
        });
    });

    describe('invalid inputs', () => {
        it('rejects negative amounts', () => {
            const transactions: Transaction[] = [
                { amount: -100, type: 'INCOME' },
            ];
            expect(() => calculateCashBalance(transactions)).toThrow('Transaction amount cannot be negative');
        });

        it('rejects null amounts', () => {
            const transactions: Transaction[] = [
                { amount: null as any, type: 'INCOME' },
            ];
            expect(() => calculateCashBalance(transactions)).toThrow('Transaction amount is required');
        });

        it('rejects undefined amounts', () => {
            const transactions: Transaction[] = [
                { amount: undefined as any, type: 'INCOME' },
            ];
            expect(() => calculateCashBalance(transactions)).toThrow('Transaction amount is required');
        });
    });
});
