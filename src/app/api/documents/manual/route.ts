import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { type, category, date, amount, vendor, notes, uploadId, dynamicFields, lineItems, taxAmount, invoiceNumber, gstNumber, client } = body;

        // Validation
        if (!amount || !vendor || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get user's org_id
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', session.user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        // If uploadId is provided, fetch temp upload details
        let originalFilename = `Manual Entry - ${vendor}`;
        let storagePath = null;

        if (uploadId) {
            const { data: tempUpload } = await supabase
                .from('temp_uploads')
                .select('*')
                .eq('id', uploadId)
                .single();

            if (tempUpload) {
                originalFilename = tempUpload.file_name;
                storagePath = tempUpload.storage_path;
            }
        }

        // Prepare Metadata
        const metadata = {
            dynamic_fields: dynamicFields || [],
            line_items: lineItems || [],
            tax_amount: taxAmount,
            invoice_number: invoiceNumber,
            gst_number: gstNumber,
            client_name: client,
            source: 'ai_extraction'
        };

        // Insert into input_documents
        const { data, error } = await supabase
            .from('input_documents')
            .insert({
                org_id: profile.org_id,
                type: type,
                category: category,
                status: 'NORMALIZED',
                original_filename: originalFilename,
                storage_path: storagePath,
                metadata: metadata // Store here as well if needed, but mainly in expense/invoice
            })
            .select()
            .single();

        if (error) {
            console.error('Manual Entry DB Error:', error);
            // We continue though, or fail? 
            // If input_document fails, we probably shouldn't proceed. 
            throw error;
        }

        // Store actual financial record based on type
        // Expenses
        if (type === 'HDFC Bank Statement' || type === 'Kotak Bank Statement') {
            // ... handling
        } else if (type === 'INVOICE') {
            const { error: invoiceError } = await supabase
                .from('invoices')
                .insert({
                    org_id: profile.org_id,
                    invoice_number: invoiceNumber || ('MANUAL-' + Date.now()),
                    customer_name: client || 'Unknown Client', // For Sales Invoice this is the buyer
                    issue_date: date,
                    total_amount: amount,
                    status: 'DRAFT',
                    metadata: metadata,
                    items: lineItems?.length ? lineItems : (notes ? [{ description: notes, amount: amount }] : [])
                });
            if (invoiceError) console.error('Error creating invoice:', invoiceError);

        } else {
            // Default to Expense for 'EXPENSE', 'RECEIPT'
            // For Expense: Vendor is the Merchant
            const { error: expenseError } = await supabase
                .from('expenses')
                .insert({
                    org_id: profile.org_id,
                    user_id: session.user.id,
                    date: date,
                    amount: amount,
                    description: notes || `${vendor} - ${category}`,
                    merchant: vendor,
                    category: category,
                    status: 'PENDING',
                    attachment_url: storagePath,
                    metadata: metadata, // Save all dynamic fields here
                    gst_amount: taxAmount || 0,
                    ref_id: invoiceNumber
                });
            if (expenseError) console.error('Error creating expense:', expenseError);
        }

        if (error) {
            console.error('Manual Entry DB Error:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        return NextResponse.json({ success: true, document: data });

    } catch (error: any) {
        console.error('Manual Entry API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
