/**
 * CSV Validation Issues
 * 
 * Tier 2: Normalization
 * 
 * Detects potential issues in CSV files that require user confirmation.
 * Instead of guessing, we ask the user to confirm ambiguous column mappings.
 */

export type IssueType =
    | 'AMBIGUOUS_DATE_FORMAT'
    | 'EXTRA_COLUMNS'
    | 'AMOUNT_WITH_COMMAS'
    | 'MISSING_CURRENCY'
    | 'UNUSUAL_COLUMN_ORDER'
    | 'MULTIPLE_DATE_FORMATS'
    | 'EMPTY_COLUMNS';

export interface ValidationIssue {
    type: IssueType;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    message: string;
    affectedColumns: number[];
    suggestedAction: string;
    requiresUserInput: boolean;
}

export interface ColumnMapping {
    columnIndex: number;
    detectedType: 'DATE' | 'DESCRIPTION' | 'DEBIT' | 'CREDIT' | 'UNKNOWN';
    confidence: number;
    sampleValues: string[];
}

export interface CSVValidationResult {
    issues: ValidationIssue[];
    columnMappings: ColumnMapping[];
    requiresUserConfirmation: boolean;
    autoProcessable: boolean;
}

/**
 * Detect date format in a value
 */
function detectDateFormat(value: string): string | null {
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return 'DD/MM/YYYY';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return 'YYYY-MM-DD';
    if (/^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},\s+\d{4}$/i.test(value)) {
        return 'Mon DD, YYYY';
    }
    return null;
}

/**
 * Detect if a value looks like an amount
 */
function looksLikeAmount(value: string): boolean {
    // Check for numbers with optional currency symbols and commas
    return /^[₹$€£]?\s*\d{1,3}(,\d{3})*(\.\d{2})?$/.test(value.trim());
}

/**
 * Validate CSV and detect issues that need user confirmation
 */
export function validateCSV(csvContent: string): CSVValidationResult {
    const issues: ValidationIssue[] = [];
    const columnMappings: ColumnMapping[] = [];

    if (!csvContent || csvContent.trim() === '') {
        return {
            issues: [],
            columnMappings: [],
            requiresUserConfirmation: false,
            autoProcessable: false,
        };
    }

    const lines = csvContent.trim().split('\n');
    if (lines.length < 2) {
        return {
            issues: [],
            columnMappings: [],
            requiresUserConfirmation: false,
            autoProcessable: false,
        };
    }

    // Parse header
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());
    const sampleRows = lines.slice(1, Math.min(6, lines.length)); // Take up to 5 sample rows

    // Analyze each column
    for (let colIndex = 0; colIndex < header.length; colIndex++) {
        const headerName = header[colIndex];
        const sampleValues = sampleRows.map(row => {
            const cols = row.split(',').map(c => c.trim());
            return cols[colIndex] || '';
        }).filter(v => v !== '');

        const mapping: ColumnMapping = {
            columnIndex: colIndex,
            detectedType: 'UNKNOWN',
            confidence: 0,
            sampleValues: sampleValues.slice(0, 3),
        };

        // Detect column type
        if (headerName.includes('date')) {
            mapping.detectedType = 'DATE';
            mapping.confidence = 0.9;

            // Check for multiple date formats
            const formats = new Set(sampleValues.map(detectDateFormat).filter(f => f !== null));
            if (formats.size > 1) {
                issues.push({
                    type: 'MULTIPLE_DATE_FORMATS',
                    severity: 'HIGH',
                    message: `Column "${headerName}" has multiple date formats: ${Array.from(formats).join(', ')}`,
                    affectedColumns: [colIndex],
                    suggestedAction: 'Please confirm which date format to use',
                    requiresUserInput: true,
                });
            }

            // Check for ambiguous date format (Mon DD, YYYY with commas)
            if (sampleValues.some(v => detectDateFormat(v) === 'Mon DD, YYYY')) {
                issues.push({
                    type: 'AMBIGUOUS_DATE_FORMAT',
                    severity: 'MEDIUM',
                    message: `Column "${headerName}" contains dates with commas (e.g., "Jan 15, 2024")`,
                    affectedColumns: [colIndex],
                    suggestedAction: 'System will handle this automatically',
                    requiresUserInput: false,
                });
            }
        } else if (headerName.includes('desc')) {
            mapping.detectedType = 'DESCRIPTION';
            mapping.confidence = 0.9;
        } else if (headerName.includes('debit')) {
            mapping.detectedType = 'DEBIT';
            mapping.confidence = 0.9;

            // Check for amounts with commas
            if (sampleValues.some(v => v.includes(',') && looksLikeAmount(v))) {
                issues.push({
                    type: 'AMOUNT_WITH_COMMAS',
                    severity: 'MEDIUM',
                    message: `Column "${headerName}" contains amounts with commas (e.g., "1,234.56")`,
                    affectedColumns: [colIndex],
                    suggestedAction: 'System will handle this automatically',
                    requiresUserInput: false,
                });
            }
        } else if (headerName.includes('credit')) {
            mapping.detectedType = 'CREDIT';
            mapping.confidence = 0.9;

            // Check for amounts with commas
            if (sampleValues.some(v => v.includes(',') && looksLikeAmount(v))) {
                issues.push({
                    type: 'AMOUNT_WITH_COMMAS',
                    severity: 'MEDIUM',
                    message: `Column "${headerName}" contains amounts with commas (e.g., "1,234.56")`,
                    affectedColumns: [colIndex],
                    suggestedAction: 'System will handle this automatically',
                    requiresUserInput: false,
                });
            }
        } else if (sampleValues.length === 0 || sampleValues.every(v => v === '')) {
            mapping.detectedType = 'UNKNOWN';
            mapping.confidence = 0;

            issues.push({
                type: 'EMPTY_COLUMNS',
                severity: 'LOW',
                message: `Column ${colIndex + 1} appears to be empty`,
                affectedColumns: [colIndex],
                suggestedAction: 'This column will be ignored',
                requiresUserInput: false,
            });
        }

        columnMappings.push(mapping);
    }

    // Check for extra columns (more columns in data than header suggests)
    const maxDataColumns = Math.max(...sampleRows.map(row => row.split(',').length));
    if (maxDataColumns > header.length) {
        issues.push({
            type: 'EXTRA_COLUMNS',
            severity: 'HIGH',
            message: `Some rows have ${maxDataColumns} columns but header has ${header.length}`,
            affectedColumns: Array.from({ length: maxDataColumns - header.length }, (_, i) => header.length + i),
            suggestedAction: 'Please confirm if extra columns should be included or ignored',
            requiresUserInput: true,
        });
    }

    // Determine if user confirmation is required
    const requiresUserConfirmation = issues.some(issue => issue.requiresUserInput);
    const autoProcessable = !requiresUserConfirmation;

    return {
        issues,
        columnMappings,
        requiresUserConfirmation,
        autoProcessable,
    };
}

/**
 * Generate user-friendly validation report
 */
export function generateValidationReport(validation: CSVValidationResult): string {
    if (validation.autoProcessable) {
        return '✅ CSV file can be processed automatically';
    }

    let report = '⚠️ CSV file requires your confirmation:\n\n';

    const highPriorityIssues = validation.issues.filter(i => i.severity === 'HIGH' && i.requiresUserInput);

    if (highPriorityIssues.length > 0) {
        report += '**High Priority Issues:**\n';
        highPriorityIssues.forEach((issue, index) => {
            report += `${index + 1}. ${issue.message}\n`;
            report += `   → ${issue.suggestedAction}\n\n`;
        });
    }

    return report;
}
