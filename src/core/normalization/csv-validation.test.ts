/**
 * CSV Validation Tests
 * 
 * Tier 2: Normalization
 */

import { validateCSV, generateValidationReport } from './csv-validation';

describe('CSV Validation', () => {
    describe('auto-processable CSVs', () => {
        it('validates simple well-formed CSV', () => {
            const csv = `date,description,debit,credit
15/01/2024,Salary Deposit,,5000
16/01/2024,Office Rent,1200,`;

            const result = validateCSV(csv);

            expect(result.autoProcessable).toBe(true);
            expect(result.requiresUserConfirmation).toBe(false);
            expect(result.issues).toHaveLength(0);
        });

        it('detects amounts with commas but marks as auto-processable', () => {
            const csv = `date,description,debit,credit
15/01/2024,Large Payment,,1234.56`;

            const result = validateCSV(csv);

            expect(result.autoProcessable).toBe(true);
            // May have informational issues but not requiring user input
        });
    });

    describe('requires user confirmation', () => {
        it('detects extra columns requiring confirmation', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,,1000`;

            const result = validateCSV(csv);

            expect(result.requiresUserConfirmation).toBe(true);
            expect(result.autoProcessable).toBe(false);

            const extraColumnIssue = result.issues.find(i => i.type === 'EXTRA_COLUMNS');
            expect(extraColumnIssue).toBeDefined();
            expect(extraColumnIssue?.severity).toBe('HIGH');
            expect(extraColumnIssue?.requiresUserInput).toBe(true);
        });

        it('detects multiple date formats', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment 1,,1000
2024-01-16,Payment 2,,2000`;

            const result = validateCSV(csv);

            expect(result.requiresUserConfirmation).toBe(true);

            const dateFormatIssue = result.issues.find(i => i.type === 'MULTIPLE_DATE_FORMATS');
            expect(dateFormatIssue).toBeDefined();
            expect(dateFormatIssue?.requiresUserInput).toBe(true);
        });
    });

    describe('column mapping detection', () => {
        it('correctly identifies column types', () => {
            const csv = `date,description,debit,credit
15/01/2024,Test Payment,100,200`;

            const result = validateCSV(csv);

            expect(result.columnMappings).toHaveLength(4);
            expect(result.columnMappings[0].detectedType).toBe('DATE');
            expect(result.columnMappings[1].detectedType).toBe('DESCRIPTION');
            expect(result.columnMappings[2].detectedType).toBe('DEBIT');
            expect(result.columnMappings[3].detectedType).toBe('CREDIT');
        });

        it('provides sample values for each column', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment 1,100,
16/01/2024,Payment 2,,200`;

            const result = validateCSV(csv);

            expect(result.columnMappings[0].sampleValues).toContain('15/01/2024');
            expect(result.columnMappings[1].sampleValues).toContain('Payment 1');
        });
    });

    describe('validation report generation', () => {
        it('generates success message for auto-processable CSV', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,1000`;

            const validation = validateCSV(csv);
            const report = generateValidationReport(validation);

            expect(report).toContain('✅');
            expect(report).toContain('automatically');
        });

        it('generates warning message for CSVs needing confirmation', () => {
            const csv = `date,description,debit,credit
15/01/2024,Payment,,,1000`;

            const validation = validateCSV(csv);
            const report = generateValidationReport(validation);

            expect(report).toContain('⚠️');
            expect(report).toContain('confirmation');
        });
    });
});
