/**
 * Amount Extractor Tests
 * 
 * Tier 2: Normalization - 85-95% Coverage Required
 */

import { extractAmount } from './amount-extractor';

describe('Amount Extractor', () => {
    describe('valid amounts', () => {
        it('extracts simple amount', () => {
            const result = extractAmount('1000');

            expect(result.amount).toBe(1000);
            expect(result.confidence).toBeGreaterThan(0.7);
        });

        it('extracts amount with INR symbol', () => {
            const result = extractAmount('₹1,000');

            expect(result.amount).toBe(1000);
            expect(result.currency).toBe('INR');
            expect(result.confidence).toBeGreaterThan(0.8);
        });

        it('extracts amount with USD symbol', () => {
            const result = extractAmount('$1,234.56');

            expect(result.amount).toBe(1234.56);
            expect(result.currency).toBe('USD');
            expect(result.confidence).toBeGreaterThan(0.9);
        });

        it('extracts amount with EUR symbol', () => {
            const result = extractAmount('€500.00');

            expect(result.amount).toBe(500);
            expect(result.currency).toBe('EUR');
        });

        it('extracts amount with GBP symbol', () => {
            const result = extractAmount('£750.50');

            expect(result.amount).toBe(750.50);
            expect(result.currency).toBe('GBP');
        });

        it('extracts amount with commas', () => {
            const result = extractAmount('1,234,567.89');

            expect(result.amount).toBe(1234567.89);
        });

        it('extracts amount without decimals', () => {
            const result = extractAmount('5000');

            expect(result.amount).toBe(5000);
        });

        it('extracts amount from text with context', () => {
            const result = extractAmount('Total: ₹1,500.00');

            expect(result.amount).toBe(1500);
            expect(result.currency).toBe('INR');
        });

        it('extracts amount from invoice text', () => {
            const result = extractAmount('Invoice Amount: $2,345.67');

            expect(result.amount).toBe(2345.67);
            expect(result.currency).toBe('USD');
        });
    });

    describe('ambiguous amounts', () => {
        it('flags low confidence for approximate amounts', () => {
            const result = extractAmount('approx ₹1000');

            expect(result.amount).toBe(1000);
            expect(result.confidence).toBeLessThan(0.8);
        });

        it('flags low confidence for "about" amounts', () => {
            const result = extractAmount('about $500');

            expect(result.amount).toBe(500);
            expect(result.confidence).toBeLessThan(0.8);
        });

        it('flags low confidence for "around" amounts', () => {
            const result = extractAmount('around 1000');

            expect(result.amount).toBe(1000);
            expect(result.confidence).toBeLessThan(0.8);
        });

        it('flags low confidence for "roughly" amounts', () => {
            const result = extractAmount('roughly ₹2000');

            expect(result.amount).toBe(2000);
            expect(result.confidence).toBeLessThan(0.8);
        });

        it('flags low confidence for tilde amounts', () => {
            const result = extractAmount('~$1500');

            expect(result.amount).toBe(1500);
            expect(result.confidence).toBeLessThan(0.8);
        });
    });

    describe('no amount found', () => {
        it('returns null for empty string', () => {
            const result = extractAmount('');

            expect(result.amount).toBeNull();
            expect(result.confidence).toBe(0);
        });

        it('returns null for whitespace only', () => {
            const result = extractAmount('   ');

            expect(result.amount).toBeNull();
            expect(result.confidence).toBe(0);
        });

        it('returns null for text without numbers', () => {
            const result = extractAmount('No amount here');

            expect(result.amount).toBeNull();
            expect(result.confidence).toBe(0);
        });

        it('returns null for invalid format', () => {
            const result = extractAmount('abc.xyz');

            expect(result.amount).toBeNull();
            expect(result.confidence).toBe(0);
        });
    });

    describe('edge cases', () => {
        it('handles zero amount', () => {
            const result = extractAmount('₹0.00');

            expect(result.amount).toBe(0);
            expect(result.currency).toBe('INR');
        });

        it('handles very large amounts', () => {
            const result = extractAmount('₹1,00,00,000.00');

            expect(result.amount).toBe(10000000);
        });

        it('handles small decimal amounts', () => {
            const result = extractAmount('$0.99');

            expect(result.amount).toBe(0.99);
        });

        it('extracts first amount when multiple present', () => {
            const result = extractAmount('₹1000 or ₹2000');

            expect(result.amount).toBe(1000);
        });

        it('rounds to 2 decimal places', () => {
            const result = extractAmount('$123.456');

            expect(result.amount).toBe(123.46);
        });
    });

    describe('confidence scoring', () => {
        it('gives high confidence for amount with currency and decimals', () => {
            const result = extractAmount('₹1,234.56');

            expect(result.confidence).toBeGreaterThanOrEqual(0.9);
        });

        it('gives medium confidence for amount with currency only', () => {
            const result = extractAmount('₹1000');

            expect(result.confidence).toBeGreaterThanOrEqual(0.8);
            expect(result.confidence).toBeLessThan(1.0);
        });

        it('gives lower confidence for plain number', () => {
            const result = extractAmount('1000');

            expect(result.confidence).toBeGreaterThan(0.7);
            expect(result.confidence).toBeLessThan(0.9);
        });

        it('reduces confidence for ambiguous text', () => {
            const result = extractAmount('about ₹1,000.00');

            expect(result.confidence).toBeLessThan(0.8);
        });
    });
});
