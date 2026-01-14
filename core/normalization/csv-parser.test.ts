/**
 * CSV Parser Tests
 * 
 * Tier 2: Normalization - 85-95% Coverage Required
 */

import { parseCSV } from './csv-parser';

describe('CSV Parser', () => {
    describe('valid CSV files', () => {
        it('parses basic CSV with DD/MM/YYYY dates', () => {
            const csv = `date,description,debit,credit
15/01/2024,Salary Deposit,,5000
16/01/2024,Office Rent,1200,
17/01/2024,Utility Bill,150,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(3);
            expect(result.confidence).toBe(1.0);
            expect(result.errors).toHaveLength(0);

            expect(result.transactions[0]).toMatchObject({
                description: 'Salary Deposit',
                amount: 5000,
                direction: 'CREDIT',
            });

            expect(result.transactions[1]).toMatchObject({
                description: 'Office Rent',
                amount: 1200,
                direction: 'DEBIT',
            });
        });

        it('parses CSV with YYYY-MM-DD dates', () => {
            const csv = `date,description,debit,credit
2024-01-15,Payment Received,,3000
2024-01-16,Supplies,500,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
            expect(result.confidence).toBe(1.0);
        });

        it('parses CSV with Mon DD, YYYY dates', () => {
            const csv = `date,description,debit,credit
Jan 15, 2024,Consulting Fee,,2500
Jan 20, 2024,Software License,300,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
            expect(result.confidence).toBe(1.0);
        });

        it('handles amounts with currency symbols', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,₹5000
16/01/2024,Expense,$1200,`;

            const result = parseCSV(csv);

            expect(result.transactions[0].amount).toBe(5000);
            expect(result.transactions[1].amount).toBe(1200);
        });

        it('handles amounts with commas', () => {
            const csv = `date,description,debit,credit
15/01/2024,Large Payment,,1,234.56
16/01/2024,Big Expense,5,678.90,`;

            const result = parseCSV(csv);

            expect(result.transactions[0].amount).toBe(1234.56);
            expect(result.transactions[1].amount).toBe(5678.90);
        });

        it('handles missing description column gracefully', () => {
            const csv = `date,debit,credit
15/01/2024,,5000
16/01/2024,1200,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
            expect(result.transactions[0].description).toBe('');
            expect(result.errors).toContain('Missing description column');
        });
    });

    describe('incomplete data', () => {
        it('returns null for empty CSV', () => {
            const result = parseCSV('');

            expect(result.transactions).toHaveLength(0);
            expect(result.confidence).toBe(0);
            expect(result.errors).toContain('Empty CSV content');
        });

        it('returns null for CSV with only header', () => {
            const csv = 'date,description,debit,credit';

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(0);
            expect(result.confidence).toBe(0);
            expect(result.errors).toContain('CSV must have at least header and one data row');
        });

        it('returns null for missing date column', () => {
            const csv = `description,debit,credit
Payment,100,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(0);
            expect(result.confidence).toBe(0);
            expect(result.errors).toContain('Missing date column');
        });

        it('returns null for missing debit/credit columns', () => {
            const csv = `date,description
15/01/2024,Payment`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(0);
            expect(result.confidence).toBe(0);
            expect(result.errors).toContain('Missing debit/credit columns');
        });

        it('flags low confidence for invalid dates', () => {
            const csv = `date,description,debit,credit
15/01/2024,Valid,,1000
invalid-date,Invalid,500,
16/01/2024,Valid,,2000`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
            expect(result.confidence).toBeLessThan(1.0);
            expect(result.errors.some(e => e.includes('Invalid date format'))).toBe(true);
        });

        it('skips rows with incomplete data', () => {
            const csv = `date,description,debit,credit
15/01/2024,Complete,,1000
16/01/2024`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(1);
            expect(result.errors.some(e => e.includes('Incomplete data'))).toBe(true);
        });
    });

    describe('malformed input', () => {
        it('handles whitespace-only CSV', () => {
            const result = parseCSV('   \n   \n   ');

            expect(result.transactions).toHaveLength(0);
            expect(result.confidence).toBe(0);
        });

        it('handles CSV with extra commas', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,,1000
16/01/2024,Expense,500,,`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
        });

        it('handles mixed valid and invalid amounts', () => {
            const csv = `date,description,debit,credit
15/01/2024,Valid,,1000
16/01/2024,Invalid,abc,
17/01/2024,Valid,,2000`;

            const result = parseCSV(csv);

            expect(result.transactions).toHaveLength(2);
            expect(result.confidence).toBeCloseTo(0.67, 1);
        });
    });

    describe('confidence scoring', () => {
        it('returns 1.0 for perfect parsing', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,1000
16/01/2024,Expense,500,`;

            const result = parseCSV(csv);

            expect(result.confidence).toBe(1.0);
        });

        it('returns 0.5 for 50% success rate', () => {
            const csv = `date,description,debit,credit
15/01/2024,Valid,,1000
invalid,Invalid,500,`;

            const result = parseCSV(csv);

            expect(result.confidence).toBe(0.5);
        });

        it('returns 0 for complete failure', () => {
            const csv = `date,description,debit,credit
invalid1,Invalid,abc,
invalid2,Invalid,xyz,`;

            const result = parseCSV(csv);

            expect(result.confidence).toBe(0);
        });
    });
});
