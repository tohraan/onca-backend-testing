/**
 * Amount Extractor
 * 
 * Tier 2: Normalization (85-95% Coverage Required)
 * 
 * Extracts numeric amounts from text with currency symbols.
 * Returns confidence score based on extraction clarity.
 */

export interface AmountExtractionResult {
    amount: number | null;
    confidence: number;
    currency?: string;
}

/**
 * Extract amount from text string
 */
export function extractAmount(text: string): AmountExtractionResult {
    if (!text || text.trim() === '') {
        return {
            amount: null,
            confidence: 0,
        };
    }

    // Detect currency symbol
    let currency: string | undefined;
    if (text.includes('₹')) currency = 'INR';
    else if (text.includes('$')) currency = 'USD';
    else if (text.includes('€')) currency = 'EUR';
    else if (text.includes('£')) currency = 'GBP';

    // Remove currency symbols and extract numbers
    const cleaned = text.replace(/[₹$€£]/g, '');

    // Pattern for amounts - matches any sequence of digits with optional commas and decimals
    const amountPattern = /(\d+(?:,\d+)*(?:\.\d+)?)/;
    const match = cleaned.match(amountPattern);

    if (!match) {
        return {
            amount: null,
            confidence: 0,
        };
    }

    // Remove commas and parse
    const amountStr = match[1].replace(/,/g, '');
    const amount = parseFloat(amountStr);

    if (isNaN(amount)) {
        return {
            amount: null,
            confidence: 0,
        };
    }

    // Calculate confidence based on clarity
    let confidence = 0.8; // Base confidence

    // Higher confidence if currency symbol present
    if (currency) {
        confidence += 0.1;
    }

    // Higher confidence if decimal places present
    if (amountStr.includes('.')) {
        confidence += 0.1;
    }

    // Lower confidence if text contains ambiguous words
    const ambiguousWords = ['approx', 'about', 'around', 'roughly', '~'];
    if (ambiguousWords.some(word => text.toLowerCase().includes(word))) {
        confidence -= 0.3;
    }

    // Ensure confidence is between 0 and 1
    confidence = Math.max(0, Math.min(1, confidence));
    confidence = Math.round(confidence * 100) / 100;

    return {
        amount: Math.round(amount * 100) / 100,
        confidence,
        currency,
    };
}
