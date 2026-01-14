/**
 * Universal Column Mapping System
 * 
 * User-assisted column mapping for ALL file uploads in ONCA.
 * No more guessing - users confirm what each column represents.
 */

export type ColumnType =
    | 'DATE'
    | 'DESCRIPTION'
    | 'AMOUNT'
    | 'DEBIT'
    | 'CREDIT'
    | 'CATEGORY'
    | 'VENDOR'
    | 'INVOICE_NUMBER'
    | 'DUE_DATE'
    | 'STATUS'
    | 'CURRENCY'
    | 'TAX_RATE'
    | 'IGNORE';

export interface ColumnSuggestion {
    columnIndex: number;
    headerName: string;
    suggestedType: ColumnType;
    confidence: number;
    sampleValues: string[];
    reasoning: string;
}

export interface UserColumnMapping {
    columnIndex: number;
    headerName: string;
    userSelectedType: ColumnType;
    transformations?: {
        dateFormat?: string;
        currencySymbol?: string;
        numberFormat?: 'US' | 'INDIAN' | 'EUROPEAN';
    };
}

export interface ColumnMappingRequest {
    fileName: string;
    fileType: 'BANK_STATEMENT' | 'INVOICE' | 'EXPENSE' | 'GENERAL';
    suggestions: ColumnSuggestion[];
    requiredColumns: ColumnType[];
    optionalColumns: ColumnType[];
}

/**
 * Analyze CSV and generate column mapping suggestions
 */
export function generateColumnSuggestions(
    csvContent: string,
    fileType: 'BANK_STATEMENT' | 'INVOICE' | 'EXPENSE' | 'GENERAL'
): ColumnMappingRequest {
    const lines = csvContent.trim().split('\n');
    const header = lines[0].split(',').map(h => h.trim());
    const sampleRows = lines.slice(1, Math.min(6, lines.length));

    const suggestions: ColumnSuggestion[] = header.map((headerName, index) => {
        const sampleValues = sampleRows
            .map(row => row.split(',')[index]?.trim() || '')
            .filter(v => v !== '')
            .slice(0, 3);

        return suggestColumnType(headerName, sampleValues, fileType, index);
    });

    // Define required columns based on file type
    const requiredColumns = getRequiredColumns(fileType);
    const optionalColumns = getOptionalColumns(fileType);

    return {
        fileName: 'uploaded_file.csv',
        fileType,
        suggestions,
        requiredColumns,
        optionalColumns,
    };
}

/**
 * Suggest column type based on header name and sample values
 */
function suggestColumnType(
    headerName: string,
    sampleValues: string[],
    fileType: string,
    columnIndex: number
): ColumnSuggestion {
    const lowerHeader = headerName.toLowerCase();

    // Date detection
    if (lowerHeader.includes('date')) {
        const hasDateValues = sampleValues.some(v =>
            /\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2}/.test(v)
        );
        return {
            columnIndex,
            headerName,
            suggestedType: lowerHeader.includes('due') ? 'DUE_DATE' : 'DATE',
            confidence: hasDateValues ? 0.95 : 0.7,
            sampleValues,
            reasoning: hasDateValues
                ? 'Header contains "date" and values match date format'
                : 'Header contains "date"',
        };
    }

    // Amount/Debit/Credit detection
    if (lowerHeader.includes('amount') || lowerHeader.includes('total')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'AMOUNT',
            confidence: 0.9,
            sampleValues,
            reasoning: 'Header indicates monetary value',
        };
    }

    if (lowerHeader.includes('debit') || lowerHeader.includes('withdrawal')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'DEBIT',
            confidence: 0.95,
            sampleValues,
            reasoning: 'Header indicates debit/withdrawal',
        };
    }

    if (lowerHeader.includes('credit') || lowerHeader.includes('deposit')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'CREDIT',
            confidence: 0.95,
            sampleValues,
            reasoning: 'Header indicates credit/deposit',
        };
    }

    // Description detection
    if (
        lowerHeader.includes('desc') ||
        lowerHeader.includes('narration') ||
        lowerHeader.includes('particulars') ||
        lowerHeader.includes('details')
    ) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'DESCRIPTION',
            confidence: 0.9,
            sampleValues,
            reasoning: 'Header indicates transaction description',
        };
    }

    // Category detection
    if (lowerHeader.includes('category') || lowerHeader.includes('type')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'CATEGORY',
            confidence: 0.85,
            sampleValues,
            reasoning: 'Header indicates category/type',
        };
    }

    // Vendor detection
    if (lowerHeader.includes('vendor') || lowerHeader.includes('payee') || lowerHeader.includes('merchant')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'VENDOR',
            confidence: 0.85,
            sampleValues,
            reasoning: 'Header indicates vendor/payee',
        };
    }

    // Invoice number detection
    if (lowerHeader.includes('invoice') && lowerHeader.includes('no')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'INVOICE_NUMBER',
            confidence: 0.9,
            sampleValues,
            reasoning: 'Header indicates invoice number',
        };
    }

    // Status detection
    if (lowerHeader.includes('status')) {
        return {
            columnIndex,
            headerName,
            suggestedType: 'STATUS',
            confidence: 0.85,
            sampleValues,
            reasoning: 'Header indicates status',
        };
    }

    // Default: suggest IGNORE for unknown columns
    return {
        columnIndex,
        headerName,
        suggestedType: 'IGNORE',
        confidence: 0.3,
        sampleValues,
        reasoning: 'Unable to determine column type - please select manually',
    };
}

/**
 * Get required columns for each file type
 */
function getRequiredColumns(fileType: string): ColumnType[] {
    switch (fileType) {
        case 'BANK_STATEMENT':
            return ['DATE', 'DESCRIPTION'];
        case 'INVOICE':
            return ['DATE', 'AMOUNT', 'DESCRIPTION'];
        case 'EXPENSE':
            return ['DATE', 'AMOUNT', 'CATEGORY'];
        default:
            return ['DATE'];
    }
}

/**
 * Get optional columns for each file type
 */
function getOptionalColumns(fileType: string): ColumnType[] {
    switch (fileType) {
        case 'BANK_STATEMENT':
            return ['DEBIT', 'CREDIT', 'CATEGORY', 'VENDOR'];
        case 'INVOICE':
            return ['DUE_DATE', 'INVOICE_NUMBER', 'STATUS', 'VENDOR'];
        case 'EXPENSE':
            return ['VENDOR', 'DESCRIPTION', 'INVOICE_NUMBER'];
        default:
            return ['DESCRIPTION', 'AMOUNT', 'CATEGORY'];
    }
}

/**
 * Validate user column mapping
 */
export function validateUserMapping(
    mapping: UserColumnMapping[],
    requiredColumns: ColumnType[]
): { valid: boolean; missingColumns: ColumnType[] } {
    const mappedTypes = new Set(mapping.map(m => m.userSelectedType));

    const missingColumns = requiredColumns.filter(
        required => !mappedTypes.has(required)
    );

    return {
        valid: missingColumns.length === 0,
        missingColumns,
    };
}
