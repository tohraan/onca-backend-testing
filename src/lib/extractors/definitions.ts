import { NextRequest } from 'next/server';

export interface ExtractionResult {
    extractedData: any;
    columnSuggestions?: any[];
    requiredColumns?: string[];
    optionalColumns?: string[];
    isManualRequired: boolean;
    signedUrl?: string | null;
    error?: string;
}

export interface ProcessingContext {
    file: File;
    buffer: Buffer;
    filename: string;
    mimeType: string;
    userId: string;
    orgId: string;
    uploadId: string;
    fileTypeHint: string; // 'INVOICE' | 'EXPENSE' etc
    supabase: any; // Supabase Client
}

export interface Extractor {
    canHandle(mimeType: string, filename: string): boolean;
    extract(context: ProcessingContext): Promise<ExtractionResult>;
}
