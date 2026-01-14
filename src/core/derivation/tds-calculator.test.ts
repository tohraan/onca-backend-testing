/**
 * TDS Calculator Tests
 * 
 * Tier 1: Financial Derivation - 100% Coverage Required
 */

import { calculateTDS } from './tds-calculator';

describe('calculateTDS', () => {
    describe('standard calculations', () => {
        it('calculates 10% of 10000 correctly', () => {
            expect(calculateTDS(10000, 10)).toBe(1000);
        });

        it('calculates 5% of 20000 correctly', () => {
            expect(calculateTDS(20000, 5)).toBe(1000);
        });

        it('calculates 2% of 50000 correctly', () => {
            expect(calculateTDS(50000, 2)).toBe(1000);
        });
    });

    describe('edge rates', () => {
        it('handles 0% rate', () => {
            expect(calculateTDS(10000, 0)).toBe(0);
        });

        it('handles 100% rate', () => {
            expect(calculateTDS(10000, 100)).toBe(10000);
        });

        it('handles decimal rates', () => {
            expect(calculateTDS(10000, 10.5)).toBe(1050);
        });

        it('handles very small rates', () => {
            expect(calculateTDS(10000, 0.1)).toBe(10);
        });
    });

    describe('decimal amounts', () => {
        it('handles decimal payment amounts', () => {
            expect(calculateTDS(1234.56, 10)).toBeCloseTo(123.46, 2);
        });

        it('rounds to 2 decimal places', () => {
            expect(calculateTDS(100, 3.333)).toBe(3.33);
        });

        it('handles complex decimal calculation', () => {
            expect(calculateTDS(9876.54, 7.5)).toBeCloseTo(740.74, 2);
        });
    });

    describe('zero cases', () => {
        it('handles zero payment amount', () => {
            expect(calculateTDS(0, 10)).toBe(0);
        });

        it('handles zero rate', () => {
            expect(calculateTDS(5000, 0)).toBe(0);
        });

        it('handles both zero', () => {
            expect(calculateTDS(0, 0)).toBe(0);
        });
    });

    describe('invalid inputs', () => {
        it('rejects negative payment amount', () => {
            expect(() => calculateTDS(-1000, 10)).toThrow('Payment amount cannot be negative');
        });

        it('rejects negative rate', () => {
            expect(() => calculateTDS(1000, -5)).toThrow('TDS rate must be between 0 and 100');
        });

        it('rejects rate above 100', () => {
            expect(() => calculateTDS(1000, 101)).toThrow('TDS rate must be between 0 and 100');
        });

        it('rejects null payment amount', () => {
            expect(() => calculateTDS(null as any, 10)).toThrow('Payment amount is required');
        });

        it('rejects undefined payment amount', () => {
            expect(() => calculateTDS(undefined as any, 10)).toThrow('Payment amount is required');
        });

        it('rejects null rate', () => {
            expect(() => calculateTDS(1000, null as any)).toThrow('TDS rate is required');
        });

        it('rejects undefined rate', () => {
            expect(() => calculateTDS(1000, undefined as any)).toThrow('TDS rate is required');
        });
    });

    describe('real-world scenarios', () => {
        it('calculates TDS for contractor payment (10% rate)', () => {
            const payment = 50000;
            const rate = 10;
            expect(calculateTDS(payment, rate)).toBe(5000);
        });

        it('calculates TDS for professional fees (10% rate)', () => {
            const payment = 75000;
            const rate = 10;
            expect(calculateTDS(payment, rate)).toBe(7500);
        });

        it('calculates TDS for rent (10% rate)', () => {
            const payment = 25000;
            const rate = 10;
            expect(calculateTDS(payment, rate)).toBe(2500);
        });
    });
});
