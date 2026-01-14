import { Extractor, ProcessingContext, ExtractionResult } from './definitions';
import { generateColumnSuggestions } from '@core/normalization/column-mapping';

export class CsvExtractor implements Extractor {
    canHandle(mimeType: string, filename: string): boolean {
        return mimeType === 'text/csv' || filename.toLowerCase().endsWith('.csv');
    }

    async extract(context: ProcessingContext): Promise<ExtractionResult> {
        const textContent = context.buffer.toString('utf-8');

        const suggestions = generateColumnSuggestions(
            textContent,
            context.fileTypeHint as 'BANK_STATEMENT' | 'INVOICE' | 'EXPENSE' | 'GENERAL'
        );

        return {
            extractedData: null,
            columnSuggestions: suggestions.suggestions,
            requiredColumns: suggestions.requiredColumns,
            optionalColumns: suggestions.optionalColumns,
            isManualRequired: false, // CSVs go to mapping UI, not manual form
        };
    }
}
