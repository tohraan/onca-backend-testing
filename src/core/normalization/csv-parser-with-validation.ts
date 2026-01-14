/**
 * Updated CSV Parser with Validation Support
 * 
 * Now works in two modes:
 * 1. Auto mode: Processes well-formed CSVs automatically
 * 2. Assisted mode: Asks user for confirmation on ambiguous cases
 */

import { validateCSV } from './csv-validation';

export interface BankTransaction {
    date: Date;
    description: string;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
}

export interface ParseResult {
    transactions: BankTransaction[];
    confidence: number;
    errors: string[];
    validationRequired?: boolean;
    validationIssues?: string[];
}

// ... (keep all existing helper functions: parseDate, parseAmount, parseCSVLine)

/**
 * Parse CSV with validation
 * Returns validation issues if user confirmation is needed
 */
export function parseCSVWithValidation(csvContent: string): ParseResult {
    // First, validate the CSV
    const validation = validateCSV(csvContent);

    if (validation.requiresUserConfirmation) {
        return {
            transactions: [],
            confidence: 0,
            errors: [],
            validationRequired: true,
            validationIssues: validation.issues
                .filter(i => i.requiresUserInput)
                .map(i => i.message),
        };
    }

    // If validation passes, proceed with normal parsing
    // (use existing parseCSV logic)
    return {
        transactions: [],
        confidence: 0,
        errors: [],
        validationRequired: false,
    };
}
