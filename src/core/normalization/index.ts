export interface NormalizedData {
    id: string;
    rawId: string;
    type: 'invoice' | 'expense' | 'transaction';
    data: Record<string, any>;
    confidence: number;
    provenance: string;
}

// Note: Normalization logic is implemented in specific modules:
// - CSV parsing: csv-parser.ts
// - Column mapping: column-mapping.ts
// - Amount extraction: amount-extractor.ts
// - Currency conversion: currency.ts
// API routes handle normalization orchestration
