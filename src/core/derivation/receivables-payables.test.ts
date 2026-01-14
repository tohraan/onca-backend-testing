/**
 * Receivables & Payables Tests
 * 
 * Tier 1: Financial Derivation - 100% Coverage Required
 */

import {
    calculateOutstandingReceivables,
    calculateOutstandingPayables,
    isOverdue,
    calculateNetPosition,
    generateObligationSummary,
    Obligation,
} from './receivables-payables';

describe('Receivables & Payables', () => {
    const today = new Date('2024-01-15');
    const pastDate = new Date('2024-01-01');
    const futureDate = new Date('2024-02-01');

    describe('calculateOutstandingReceivables', () => {
        it('returns zero for no obligations', () => {
            expect(calculateOutstandingReceivables([])).toBe(0);
        });

        it('sums pending receivables', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
                { amount: 3000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
            ];
            expect(calculateOutstandingReceivables(obligations)).toBe(8000);
        });

        it('excludes paid receivables', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
                { amount: 3000, type: 'RECEIVABLE', status: 'PAID', due_date: futureDate },
            ];
            expect(calculateOutstandingReceivables(obligations)).toBe(5000);
        });

        it('excludes payables', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
                { amount: 2000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
            ];
            expect(calculateOutstandingReceivables(obligations)).toBe(5000);
        });

        it('includes overdue receivables', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'OVERDUE', due_date: pastDate },
                { amount: 3000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
            ];
            expect(calculateOutstandingReceivables(obligations)).toBe(8000);
        });
    });

    describe('calculateOutstandingPayables', () => {
        it('returns zero for no obligations', () => {
            expect(calculateOutstandingPayables([])).toBe(0);
        });

        it('sums pending payables', () => {
            const obligations: Obligation[] = [
                { amount: 2000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
                { amount: 1500, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
            ];
            expect(calculateOutstandingPayables(obligations)).toBe(3500);
        });

        it('excludes paid payables', () => {
            const obligations: Obligation[] = [
                { amount: 2000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
                { amount: 1500, type: 'PAYABLE', status: 'PAID', due_date: futureDate },
            ];
            expect(calculateOutstandingPayables(obligations)).toBe(2000);
        });

        it('excludes receivables', () => {
            const obligations: Obligation[] = [
                { amount: 2000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
                { amount: 5000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
            ];
            expect(calculateOutstandingPayables(obligations)).toBe(2000);
        });
    });

    describe('isOverdue', () => {
        it('returns false for paid obligations', () => {
            const obligation: Obligation = {
                amount: 1000,
                type: 'PAYABLE',
                status: 'PAID',
                due_date: pastDate,
            };
            expect(isOverdue(obligation, today)).toBe(false);
        });

        it('returns true for pending obligation past due date', () => {
            const obligation: Obligation = {
                amount: 1000,
                type: 'PAYABLE',
                status: 'PENDING',
                due_date: pastDate,
            };
            expect(isOverdue(obligation, today)).toBe(true);
        });

        it('returns false for pending obligation before due date', () => {
            const obligation: Obligation = {
                amount: 1000,
                type: 'PAYABLE',
                status: 'PENDING',
                due_date: futureDate,
            };
            expect(isOverdue(obligation, today)).toBe(false);
        });

        it('returns false for overdue status but paid', () => {
            const obligation: Obligation = {
                amount: 1000,
                type: 'PAYABLE',
                status: 'PAID',
                due_date: pastDate,
            };
            expect(isOverdue(obligation, today)).toBe(false);
        });
    });

    describe('calculateNetPosition', () => {
        it('returns positive when receivables exceed payables', () => {
            expect(calculateNetPosition(10000, 6000)).toBe(4000);
        });

        it('returns negative when payables exceed receivables', () => {
            expect(calculateNetPosition(5000, 8000)).toBe(-3000);
        });

        it('returns zero when equal', () => {
            expect(calculateNetPosition(5000, 5000)).toBe(0);
        });

        it('handles decimal amounts', () => {
            expect(calculateNetPosition(1234.56, 789.12)).toBeCloseTo(445.44, 2);
        });

        it('rounds to 2 decimal places', () => {
            expect(calculateNetPosition(100.555, 50.222)).toBe(50.33);
        });
    });

    describe('generateObligationSummary', () => {
        it('returns zero summary for no obligations', () => {
            const summary = generateObligationSummary([], today);
            expect(summary).toEqual({
                totalReceivables: 0,
                totalPayables: 0,
                overdueReceivables: 0,
                overduePayables: 0,
                netPosition: 0,
            });
        });

        it('calculates complete summary correctly', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
                { amount: 3000, type: 'RECEIVABLE', status: 'OVERDUE', due_date: pastDate },
                { amount: 2000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
                { amount: 1500, type: 'PAYABLE', status: 'OVERDUE', due_date: pastDate },
                { amount: 1000, type: 'RECEIVABLE', status: 'PAID', due_date: pastDate },
            ];

            const summary = generateObligationSummary(obligations, today);

            expect(summary.totalReceivables).toBe(8000); // 5000 + 3000 (excludes paid)
            expect(summary.totalPayables).toBe(3500); // 2000 + 1500
            expect(summary.overdueReceivables).toBe(3000);
            expect(summary.overduePayables).toBe(1500);
            expect(summary.netPosition).toBe(4500); // 8000 - 3500
        });

        it('handles all paid obligations', () => {
            const obligations: Obligation[] = [
                { amount: 5000, type: 'RECEIVABLE', status: 'PAID', due_date: pastDate },
                { amount: 2000, type: 'PAYABLE', status: 'PAID', due_date: pastDate },
            ];

            const summary = generateObligationSummary(obligations, today);

            expect(summary.totalReceivables).toBe(0);
            expect(summary.totalPayables).toBe(0);
            expect(summary.overdueReceivables).toBe(0);
            expect(summary.overduePayables).toBe(0);
            expect(summary.netPosition).toBe(0);
        });

        it('handles negative net position', () => {
            const obligations: Obligation[] = [
                { amount: 2000, type: 'RECEIVABLE', status: 'PENDING', due_date: futureDate },
                { amount: 5000, type: 'PAYABLE', status: 'PENDING', due_date: futureDate },
            ];

            const summary = generateObligationSummary(obligations, today);

            expect(summary.netPosition).toBe(-3000);
        });
    });
});
