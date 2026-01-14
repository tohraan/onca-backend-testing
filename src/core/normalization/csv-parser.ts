/**
 * CSV Parser for Bank Statements
 * 
 * Tier 2: Normalization (85-95% Coverage Required)
 * 
 * Parses CSV bank statements and extracts transactions.
 * Handles multiple date formats and returns confidence scores.
 * Intelligently handles commas within dates and amounts.
 */

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
}

/**
 * Smart CSV line parser that handles dates with commas and amounts with commas
 * This handles real-world bank CSV exports that may not be properly quoted
 */
function parseCSVLine(line: string, expectedColumns: number): string[] {
    // First try simple split
    const simpleSplit = line.split(',').map(s => s.trim());

    // If we have the expected number of columns or fewer, use simple split
    if (simpleSplit.length <= expectedColumns) {
        // Pad with empty strings if needed
        while (simpleSplit.length < expectedColumns) {
            simpleSplit.push('');
        }
        return simpleSplit;
    }

    // If we have more columns, try to merge date/amount fields
    const result: string[] = [];
    let i = 0;

    while (i < simpleSplit.length) {
        const current = simpleSplit[i];

        // Check if this looks like a month name (start of a date like "Jan 15, 2024")
        const monthPattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+$/i;
        if (monthPattern.test(current) && i + 1 < simpleSplit.length && result.length < expectedColumns - 1) {
            // This is "Jan 15" and next should be "2024"
            // Merge them into "Jan 15, 2024"
            result.push(`${current}, ${simpleSplit[i + 1]}`);
            i += 2;
            continue;
        }

        // Check if this looks like part of a number with comma separator (e.g., "1" followed by "234.56")
        const isNumberPart = /^\d+$/.test(current);
        const nextIsDecimal = i + 1 < simpleSplit.length && /^\d+(\.\d+)?$/.test(simpleSplit[i + 1]);

        if (isNumberPart && nextIsDecimal && result.length < expectedColumns - 1) {
            // Merge "1" and "234.56" into "1,234.56"
            result.push(`${current},${simpleSplit[i + 1]}`);
            i += 2;
            continue;
        }

        result.push(current);
        i++;
    }

    return result;
}

/**
 * Parse date from various formats
 */
function parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    // Try DD/MM/YYYY
    const ddmmyyyy = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    let match = dateStr.match(ddmmyyyy);
    if (match) {
        const [, day, month, year] = match;
        return new Date(`${year}-${month}-${day}`);
    }

    // Try YYYY-MM-DD
    const yyyymmdd = /^(\d{4})-(\d{2})-(\d{2})$/;
    match = dateStr.match(yyyymmdd);
    if (match) {
        return new Date(dateStr);
    }

    // Try Mon DD, YYYY (e.g., Jan 15, 2024)
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
        return parsed;
    }

    return null;
}

/**
 * Parse amount from string
 */
function parseAmount(amountStr: string): number | null {
    if (!amountStr) return null;

    // Remove currency symbols and commas
    const cleaned = amountStr.replace(/[₹$€,]/g, '').trim();
    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
        return null;
    }

    return amount;
}

/**
 * Parse CSV bank statement
 */
export function parseCSV(csvContent: string): ParseResult {
    const errors: string[] = [];
    const transactions: BankTransaction[] = [];

    if (!csvContent || csvContent.trim() === '') {
        return {
            transactions: [],
            confidence: 0,
            errors: ['Empty CSV content'],
        };
    }

    const lines = csvContent.trim().split('\n');

    if (lines.length < 2) {
        return {
            transactions: [],
            confidence: 0,
            errors: ['CSV must have at least header and one data row'],
        };
    }

    // Parse header - simple split is fine for headers
    const header = lines[0].split(',').map(h => h.toLowerCase().trim());
    const expectedColumns = header.length;

    const dateIndex = header.findIndex(h => h.includes('date'));
    const descIndex = header.findIndex(h => h.includes('description') || h.includes('desc'));
    const debitIndex = header.findIndex(h => h.includes('debit'));
    const creditIndex = header.findIndex(h => h.includes('credit'));

    if (dateIndex === -1) {
        return {
            transactions: [],
            confidence: 0,
            errors: ['Missing date column'],
        };
    }

    if (descIndex === -1) {
        errors.push('Missing description column');
    }

    if (debitIndex === -1 && creditIndex === -1) {
        return {
            transactions: [],
            confidence: 0,
            errors: ['Missing debit/credit columns'],
        };
    }

    // Parse data rows
    let successfulRows = 0;

    for (let i = 1; i < lines.length; i++) {
        const rawSplit = lines[i].split(',').map(s => s.trim());

        // Check for incomplete data - only if we have fewer columns than expected
        if (rawSplit.length < expectedColumns) {
            errors.push(`Row ${i + 1}: Incomplete data`);
            continue;
        }

        const row = parseCSVLine(lines[i], expectedColumns);

        const dateStr = row[dateIndex];
        const date = parseDate(dateStr);

        if (!date) {
            errors.push(`Row ${i + 1}: Invalid date format: ${dateStr}`);
            continue;
        }

        const description = descIndex !== -1 && descIndex < row.length ? row[descIndex] : '';

        // Check debit
        if (debitIndex !== -1 && debitIndex < row.length && row[debitIndex]) {
            const amount = parseAmount(row[debitIndex]);
            if (amount !== null && amount > 0) {
                transactions.push({
                    date,
                    description,
                    amount,
                    direction: 'DEBIT',
                });
                successfulRows++;
            }
        }

        // Check credit
        if (creditIndex !== -1 && creditIndex < row.length && row[creditIndex]) {
            const amount = parseAmount(row[creditIndex]);
            if (amount !== null && amount > 0) {
                transactions.push({
                    date,
                    description,
                    amount,
                    direction: 'CREDIT',
                });
                successfulRows++;
            }
        }
    }

    // Calculate confidence score
    const totalDataRows = lines.length - 1;
    const confidence = totalDataRows > 0 ? successfulRows / totalDataRows : 0;

    return {
        transactions,
        confidence: Math.round(confidence * 100) / 100,
        errors,
    };
}
