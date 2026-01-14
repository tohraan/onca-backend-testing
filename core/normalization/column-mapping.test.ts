/**
 * Column Mapping Tests
 * 
 * Tests for universal column mapping system
 */

import {
    generateColumnSuggestions,
    validateUserMapping,
    UserColumnMapping,
} from './column-mapping';

describe('Column Mapping System', () => {
    describe('Bank Statement Mapping', () => {
        it('suggests correct columns for standard bank statement', () => {
            const csv = `Date,Description,Debit,Credit
15/01/2024,Salary Deposit,,5000
16/01/2024,Office Rent,1200,`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.suggestions).toHaveLength(4);
            expect(result.suggestions[0].suggestedType).toBe('DATE');
            expect(result.suggestions[1].suggestedType).toBe('DESCRIPTION');
            expect(result.suggestions[2].suggestedType).toBe('DEBIT');
            expect(result.suggestions[3].suggestedType).toBe('CREDIT');
        });

        it('provides sample values for each column', () => {
            const csv = `Date,Description,Amount
15/01/2024,Payment 1,1000
16/01/2024,Payment 2,2000`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.suggestions[0].sampleValues).toContain('15/01/2024');
            expect(result.suggestions[1].sampleValues).toContain('Payment 1');
            expect(result.suggestions[2].sampleValues).toContain('1000');
        });

        it('includes confidence scores', () => {
            const csv = `Date,Description,Amount
15/01/2024,Payment,1000`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.suggestions[0].confidence).toBeGreaterThan(0.7);
            expect(result.suggestions[1].confidence).toBeGreaterThan(0.7);
        });
    });

    describe('Invoice Mapping', () => {
        it('suggests correct columns for invoice file', () => {
            const csv = `Invoice No,Date,Amount,Due Date,Status
INV001,15/01/2024,5000,15/02/2024,UNPAID`;

            const result = generateColumnSuggestions(csv, 'INVOICE');

            expect(result.suggestions[0].suggestedType).toBe('INVOICE_NUMBER');
            expect(result.suggestions[1].suggestedType).toBe('DATE');
            expect(result.suggestions[2].suggestedType).toBe('AMOUNT');
            expect(result.suggestions[3].suggestedType).toBe('DUE_DATE');
            expect(result.suggestions[4].suggestedType).toBe('STATUS');
        });
    });

    describe('Expense Mapping', () => {
        it('suggests correct columns for expense file', () => {
            const csv = `Date,Category,Amount,Vendor
15/01/2024,OFFICE,1000,Staples`;

            const result = generateColumnSuggestions(csv, 'EXPENSE');

            expect(result.suggestions[0].suggestedType).toBe('DATE');
            expect(result.suggestions[1].suggestedType).toBe('CATEGORY');
            expect(result.suggestions[2].suggestedType).toBe('AMOUNT');
            expect(result.suggestions[3].suggestedType).toBe('VENDOR');
        });
    });

    describe('Required Columns', () => {
        it('defines required columns for bank statements', () => {
            const csv = `Date,Description
15/01/2024,Payment`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.requiredColumns).toContain('DATE');
            expect(result.requiredColumns).toContain('DESCRIPTION');
        });

        it('defines required columns for invoices', () => {
            const csv = `Date,Amount
15/01/2024,1000`;

            const result = generateColumnSuggestions(csv, 'INVOICE');

            expect(result.requiredColumns).toContain('DATE');
            expect(result.requiredColumns).toContain('AMOUNT');
            expect(result.requiredColumns).toContain('DESCRIPTION');
        });
    });

    describe('User Mapping Validation', () => {
        it('validates complete mapping', () => {
            const mapping: UserColumnMapping[] = [
                { columnIndex: 0, headerName: 'Date', userSelectedType: 'DATE' },
                { columnIndex: 1, headerName: 'Desc', userSelectedType: 'DESCRIPTION' },
            ];

            const result = validateUserMapping(mapping, ['DATE', 'DESCRIPTION']);

            expect(result.valid).toBe(true);
            expect(result.missingColumns).toHaveLength(0);
        });

        it('detects missing required columns', () => {
            const mapping: UserColumnMapping[] = [
                { columnIndex: 0, headerName: 'Date', userSelectedType: 'DATE' },
            ];

            const result = validateUserMapping(mapping, ['DATE', 'DESCRIPTION', 'AMOUNT']);

            expect(result.valid).toBe(false);
            expect(result.missingColumns).toContain('DESCRIPTION');
            expect(result.missingColumns).toContain('AMOUNT');
        });
    });

    describe('Unknown Columns', () => {
        it('suggests IGNORE for unrecognized columns', () => {
            const csv = `Date,XYZ123,Amount
15/01/2024,abc,1000`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.suggestions[1].suggestedType).toBe('IGNORE');
            expect(result.suggestions[1].confidence).toBeLessThan(0.5);
        });

        it('provides reasoning for suggestions', () => {
            const csv = `Date,Description
15/01/2024,Payment`;

            const result = generateColumnSuggestions(csv, 'BANK_STATEMENT');

            expect(result.suggestions[0].reasoning).toBeTruthy();
            expect(result.suggestions[1].reasoning).toBeTruthy();
        });
    });
});
