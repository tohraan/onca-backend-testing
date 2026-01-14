import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ColumnType, UserColumnMapping, validateUserMapping } from '@core/normalization/column-mapping';

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();

        // Check authentication
        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get user's organization
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json(
                { error: 'Organization not found' },
                { status: 400 }
            );
        }

        const body = await request.json();
        const { uploadId, columnMappings, fileType } = body;

        if (!uploadId || !columnMappings) {
            return NextResponse.json(
                { error: 'Missing uploadId or columnMappings' },
                { status: 400 }
            );
        }

        // Retrieve temporary upload
        const { data: upload, error: fetchError } = await supabase
            .from('temp_uploads')
            .select('*')
            .eq('id', uploadId)
            .eq('org_id', profile.org_id)
            .single();

        if (fetchError || !upload) {
            return NextResponse.json(
                { error: 'Upload not found or expired' },
                { status: 404 }
            );
        }

        // Validate column mappings
        const requiredColumns = getRequiredColumns(fileType || upload.file_type) as ColumnType[];
        const validation = validateUserMapping(columnMappings, requiredColumns);

        if (!validation.valid) {
            return NextResponse.json(
                {
                    error: 'Invalid column mapping',
                    missingColumns: validation.missingColumns,
                },
                { status: 400 }
            );
        }

        // Parse CSV with mappings
        const result = parseCSVWithMappings(
            upload.file_content,
            columnMappings
        );

        if (result.errors.length > 0 && result.transactions.length === 0) {
            return NextResponse.json(
                {
                    error: 'Parsing errors occurred',
                    details: result.errors,
                },
                { status: 400 }
            );
        }

        // Import transactions based on file type
        let importedRecords = 0;
        const errors: string[] = [];

        // If fileType override is not provided, use upload.file_type
        const effectiveFileType = fileType || upload.file_type;

        if (effectiveFileType === 'BANK_STATEMENT') {
            const importResult = await importBankTransactions(
                supabase,
                profile.org_id,
                result.transactions,
                user.id
            );
            importedRecords = importResult.count;
            errors.push(...importResult.errors);
        } else if (effectiveFileType === 'EXPENSE') {
            const importResult = await importExpenses(
                supabase,
                profile.org_id,
                result.transactions,
                user.id
            );
            importedRecords = importResult.count;
            errors.push(...importResult.errors);
        } else if (effectiveFileType === 'INVOICE') {
            const importResult = await importInvoices(
                supabase,
                profile.org_id,
                result.transactions,
                user.id
            );
            importedRecords = importResult.count;
            errors.push(...importResult.errors);
        }

        // Clean up temporary upload
        await supabase.from('temp_uploads').delete().eq('id', uploadId);

        return NextResponse.json({
            success: true,
            importedRecords,
            errors,
        });
    } catch (error) {
        console.error('Confirm mapping error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// --- Helper Functions ---

function getRequiredColumns(fileType: string) {
    switch (fileType) {
        case 'BANK_STATEMENT':
            return ['DATE', 'DESCRIPTION'];
        case 'INVOICE':
            return ['DATE', 'AMOUNT', 'DESCRIPTION']; // Can be derived from vendor if description missing
        case 'EXPENSE':
            return ['DATE', 'AMOUNT', 'CATEGORY'];
        default:
            return ['DATE', 'AMOUNT'];
    }
}

function parseCSVLine(line: string): string[] {
    // Simple robust parser handling quotes
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    result.push(current.trim());
    return result;
}

function parseDate(value: string): Date | null {
    if (!value) return null;
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
}

function parseAmount(value: string): number {
    if (!value) return 0;
    // Remove currency symbols and commas
    const clean = value.replace(/[^0-9.-]/g, '');
    const num = parseFloat(clean);
    return isNaN(num) ? 0 : num;
}

function parseCSVWithMappings(csvContent: string, mappings: UserColumnMapping[]) {
    if (!csvContent) return { transactions: [], errors: ['Empty CSV content'] };

    const lines = csvContent.trim().split('\n');
    // Skip header
    const dataLines = lines.slice(1);

    const transactions: any[] = [];
    const errors: string[] = [];

    // Create a map for quick lookup: ColumnType -> ColumnIndex
    const typeToIndex: Record<string, number> = {};
    mappings.forEach(m => {
        if (m.userSelectedType !== 'IGNORE') {
            typeToIndex[m.userSelectedType] = m.columnIndex;
        }
    });

    dataLines.forEach((line, index) => {
        if (!line.trim()) return;

        const cols = parseCSVLine(line);
        const txn: any = {};
        let isValid = true;

        // Extract Date
        if (typeToIndex['DATE'] !== undefined) {
            const dateStr = cols[typeToIndex['DATE']];
            const date = parseDate(dateStr);
            if (date) {
                txn.date = date.toISOString().split('T')[0]; // Format YYYY-MM-DD
            } else {
                errors.push(`Row ${index + 2}: Invalid date format '${dateStr}'`);
                isValid = false;
            }
        }

        // Extract Description / Vendor
        if (typeToIndex['DESCRIPTION'] !== undefined) txn.description = cols[typeToIndex['DESCRIPTION']];
        if (typeToIndex['VENDOR'] !== undefined) txn.vendor = cols[typeToIndex['VENDOR']];
        if (typeToIndex['CATEGORY'] !== undefined) txn.category = cols[typeToIndex['CATEGORY']];
        if (typeToIndex['INVOICE_NUMBER'] !== undefined) txn.invoice_number = cols[typeToIndex['INVOICE_NUMBER']];
        if (typeToIndex['DUE_DATE'] !== undefined) {
            const date = parseDate(cols[typeToIndex['DUE_DATE']]);
            if (date) txn.due_date = date.toISOString().split('T')[0];
        }
        if (typeToIndex['STATUS'] !== undefined) txn.status = cols[typeToIndex['STATUS']];

        // Extract Amount logic
        if (typeToIndex['AMOUNT'] !== undefined) {
            txn.amount = parseAmount(cols[typeToIndex['AMOUNT']]);
        } else if (typeToIndex['DEBIT'] !== undefined || typeToIndex['CREDIT'] !== undefined) {
            const debit = typeToIndex['DEBIT'] !== undefined ? parseAmount(cols[typeToIndex['DEBIT']]) : 0;
            const credit = typeToIndex['CREDIT'] !== undefined ? parseAmount(cols[typeToIndex['CREDIT']]) : 0;

            if (debit > 0) {
                txn.amount = debit;
                txn.direction = 'DEBIT'; // Outflow
            } else if (credit > 0) {
                txn.amount = credit;
                txn.direction = 'CREDIT'; // Inflow
            } else {
                txn.amount = 0;
            }
        }

        if (isValid) {
            transactions.push(txn);
        }
    });

    return { transactions, errors };
}

async function importBankTransactions(supabase: any, orgId: string, transactions: any[], userId: string) {
    const errors: string[] = [];
    let count = 0;

    for (const txn of transactions) {
        // Determine type if not set
        const type = txn.direction === 'DEBIT' ? 'EXPENSE' : (txn.direction === 'CREDIT' ? 'INCOME' : 'EXPENSE');

        const { error } = await supabase.from('master_transactions').insert({
            org_id: orgId,
            date: txn.date,
            description: txn.description || txn.vendor || 'Unknown Transaction',
            amount: txn.amount,
            type: type,
            source: 'BANK_UPLOAD',
            status: 'COMPLETED',
            raw_data: txn // Store full parsed object for reference
        });

        if (error) errors.push(error.message);
        else count++;
    }
    return { count, errors };
}

async function importExpenses(supabase: any, orgId: string, transactions: any[], userId: string) {
    const errors: string[] = [];
    let count = 0;

    for (const txn of transactions) {
        const { error } = await supabase.from('expenses').insert({
            org_id: orgId,
            user_id: userId,
            date: txn.date,
            amount: txn.amount,
            description: txn.description || `Expense at ${txn.vendor || 'Unknown'}`,
            merchant: txn.vendor,
            category: txn.category || 'Uncategorized',
            status: 'PENDING',
            receipt_url: null
        });

        if (error) errors.push(error.message);
        else count++;
    }
    return { count, errors };
}

async function importInvoices(supabase: any, orgId: string, transactions: any[], userId: string) {
    const errors: string[] = [];
    let count = 0;

    for (const txn of transactions) {
        const { error } = await supabase.from('invoices').insert({
            org_id: orgId,
            issue_date: txn.date,
            due_date: txn.due_date || txn.date,
            total_amount: txn.amount,
            status: txn.status || 'DRAFT',
            bill_to_name: txn.vendor || 'Unknown Client', // Invoices are usually to clients
            invoice_number: txn.invoice_number,
            items: txn.description ? [{ description: txn.description, amount: txn.amount }] : []
        });

        if (error) errors.push(error.message);
        else count++;
    }
    return { count, errors };
}
