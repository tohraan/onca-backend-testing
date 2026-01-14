import { Extractor, ProcessingContext, ExtractionResult } from './definitions';

export class AiExtractor implements Extractor {
    canHandle(mimeType: string, filename: string): boolean {
        const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
        return allowed.includes(mimeType) || /\.(pdf|jpg|jpeg|png|webp)$/i.test(filename);
    }

    async extract(context: ProcessingContext): Promise<ExtractionResult> {
        // 1. Upload to Storage
        const fileExt = context.filename.split('.').pop();
        // Sanitize: simplified version of the one in route.ts
        const safeName = context.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const storagePath = `${context.userId}/temp/${context.uploadId}-${safeName}`;

        const { error: uploadError } = await context.supabase
            .storage
            .from('documents')
            .upload(storagePath, context.buffer, {
                contentType: context.mimeType,
                upsert: true
            });

        if (uploadError) {
            throw new Error(`Storage error: ${uploadError.message}`);
        }

        // 2. Get Signed URL for AI
        const { data: signData } = await context.supabase
            .storage
            .from('documents')
            .createSignedUrl(storagePath, 60 * 5); // 5 minutes

        const signedUrl = signData?.signedUrl;
        let extractedData = null;

        if (signedUrl && process.env.OPENROUTER_API_KEY) {
            try {
                // Determine prompt based on hint, or use generic
                const extractionPrompt = `Extract THIS DOCUMENT COMPLETELY.
                            
                1. IDENTIFY THE DOCUMENT TYPE: "INVOICE", "RECEIPT", "BANK_STATEMENT", "PURCHASE_ORDER", "CONTRACT", "OTHER".

                2. EXTRACT CORE DATA (Best Effort):
                - date (YYYY-MM-DD)
                - amount (number): Grand Total
                - tax_amount (number)
                - vendor_name (string): Author/Sender/Seller
                - client_name (string): Recipient/Buyer
                - category (string): Infer from content
                - invoice_number (string)
                - gst_number (string)

                3. EXTRACT RICH DATA (Crucial):
                Analyze the document for specific details. Create keys for ANY meaningful data point found.
                Examples:
                - "Phase 1 Cost", "Phase 2 Cost", "Retainer Amount"
                - "Third Party Entity", "Beneficiary Name", "Signatory"
                - "Shipping Address", "Billing Address"
                - "Discount Rate", "Penalty Clause"
                - "PO Number", "Reference ID"

                Return these as 'dynamic_fields': [ { "label": "Label Found in Doc", "value": "Extracted Value" } ]

                JSON Format: 
                { 
                    "type": "INVOICE",
                    "date": "YYYY-MM-DD", 
                    "amount": 0.00, 
                    "tax_amount": 0.00,
                    "vendor_name": "Name", 
                    "client_name": "Client Name",
                    "category": "Category", 
                    "invoice_number": "number", 
                    "gst_number": "tax id",
                    "description": "summary",
                    "line_items": [],
                    "dynamic_fields": [
                        { "label": "Phase 1 Setup", "value": "5000.00" },
                        { "label": "Tri-Party Name", "value": "Example Corp" }
                    ]
                }`;
                const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        model: process.env.LLM_MODEL || 'openai/gpt-4o',
                        messages: [
                            {
                                role: 'user',
                                content: [
                                    { type: 'text', text: extractionPrompt },
                                    { type: 'image_url', image_url: { url: signedUrl } }
                                ]
                            }
                        ],
                        temperature: 0.1
                    })
                });

                const aiResult = await aiResponse.json();
                const content = aiResult.choices?.[0]?.message?.content;

                if (content) {
                    const jsonStr = content.replace(/```json\n?|```/g, '').trim();
                    extractedData = JSON.parse(jsonStr);
                }
            } catch (err) {
                console.error('AI Extraction failing silently:', err);
                // We don't fail the whole request, we just return null extraction
            }
        }

        return {
            extractedData,
            signedUrl,
            isManualRequired: true, // Always requires verification/manual entry for non-CSVs
            // columnSuggestions: undefined
        };
    }
}
