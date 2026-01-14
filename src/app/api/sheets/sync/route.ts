import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getValidAccessToken } from '@core/ingestion/google-sheets-oauth';
import { getSheetRows, extractSpreadsheetId, MASTER_TRACKER_COLUMNS } from '@core/source/sheets';
import { convertCurrency } from '@core/normalization/currency';

/**
 * Google Sheets Sync Route (Directive Architecture)
 * Pulls data from Google Sheet and routes to appropriate directive tables
 * Routes: income → invoices, expense → expenses, other → manual_ledger_entries
 */
export async function POST(request: Request) {
    try {
        const { url, sheetName, mapping } = await request.json();
        const spreadsheetId = extractSpreadsheetId(url);

        if (!spreadsheetId) {
            return NextResponse.json({ error: 'Invalid Spreadsheet URL' }, { status: 400 });
        }

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 1. Get user's org_id and config
        const { data: profile } = await supabase
            .from('profiles')
            .select('org_id')
            .eq('id', user.id)
            .single();

        if (!profile?.org_id) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 });
        }

        const { data: config } = await supabase
            .from('organization_configs')
            .select('*')
            .eq('org_id', profile.org_id)
            .single();

        const businessDNA = config || { business_type: 'service', currency: 'INR' };

        // 2. Get Google Access Token
        const accessToken = await getValidAccessToken(user.id, profile.org_id);
        if (!accessToken) {
            return NextResponse.json({ error: 'Google Sheets not connected' }, { status: 403 });
        }

        // 3. Fetch Rows from Google Sheets
        const targetSheet = sheetName || 'Sheet1';
        const rows = await getSheetRows(accessToken, spreadsheetId, targetSheet);

        if (rows.length < 2) {
            return NextResponse.json({ success: true, message: 'Sheet is empty', count: 0 });
        }

        const headers = rows[0].map(h => h.trim().toLowerCase());
        const dataRows = rows.slice(1);

        // Map column indices
        const colMap: Record<string, number> = {};

        if (mapping) {
            Object.keys(mapping).forEach(internalField => {
                const sheetCol = mapping[internalField];
                colMap[internalField.toLowerCase()] = sheetCol ? headers.indexOf(sheetCol.toLowerCase().trim()) : -1;
            });
        } else {
            MASTER_TRACKER_COLUMNS.forEach(col => {
                colMap[col.toLowerCase()] = headers.indexOf(col.toLowerCase());
            });
        }

        // 4. Transform rows and route to appropriate tables
        const targetCurrency = businessDNA.currency || 'INR';

        const invoices: any[] = [];
        const expenses: any[] = [];
        const ledgerEntries: any[] = [];

        for (let index = 0; index < dataRows.length; index++) {
            const row = dataRows[index];

            const getValue = (key: string) => {
                const idx = colMap[key.toLowerCase()];
                return idx !== -1 ? row[idx] : null;
            };

            // Clean and parse values
            let dateStr = getValue('Date');
            if (dateStr && dateStr.startsWith('[') && dateStr.endsWith(']')) {
                dateStr = dateStr.slice(1, -1);
            }

            const cleanNum = (val: string | null) => {
                if (!val) return 0;
                let clean = val.replace(/[\[\]]/g, '').replace(/[^0-9.]/g, '');
                return parseFloat(clean) || 0;
            };

            const sourceAmount = cleanNum(getValue('Amount'));
            if (!sourceAmount || !dateStr) continue; // Skip invalid rows

            const sourceCurrency = (getValue('Currency')?.replace(/[\[\]]/g, '') || targetCurrency).toUpperCase();
            const { convertedAmount } = await convertCurrency(sourceAmount, sourceCurrency, targetCurrency);

            const cleanType = (val: string | null): 'income' | 'expense' | 'salary' | 'transfer' | 'other' => {
                const type = val?.replace(/[\[\]]/g, '').toLowerCase().trim() || 'expense';
                if (['income', 'revenue', 'sale', 'credit'].includes(type)) return 'income';
                if (['expense', 'bill', 'cost', 'debit'].includes(type)) return 'expense';
                if (['salary', 'wages', 'payroll'].includes(type)) return 'salary';
                if (['transfer', 'internal'].includes(type)) return 'transfer';
                return 'other';
            };

            const transactionType = cleanType(getValue('Type'));
            const entity = getValue('Entity')?.replace(/[\[\]]/g, '') || 'Unknown';
            const refId = getValue('Ref ID')?.replace(/[\[\]]/g, '');
            const description = getValue('Description')?.replace(/[\[\]]/g, '');
            const category = getValue('Category')?.replace(/[\[\]]/g, '');
            const gstPercent = cleanNum(getValue('GST %'));
            const gstAmount = convertedAmount * (gstPercent / 100);
            const status = getValue('Status')?.replace(/[\[\]]/g, '') || 'completed';
            const context = getValue('Context')?.replace(/[\[\]]/g, '');
            const paymentMode = getValue('Payment Mode')?.replace(/[\[\]]/g, '');

            // Route to appropriate table based on type
            if (transactionType === 'income') {
                // Income → Invoices (RECEIVABLE)
                invoices.push({
                    org_id: profile.org_id,
                    invoice_type: 'RECEIVABLE',
                    counterparty_name: entity,
                    invoice_number: refId,
                    amount: convertedAmount,
                    tax_amount: gstAmount,
                    invoice_date: dateStr,
                    due_date: dateStr, // Can be enhanced with actual due date from sheet
                    status: status === 'completed' ? 'PAID' : 'UNPAID',
                    source: 'MANUAL',
                    notes: description,
                    source_type: 'google_sheet',
                    source_id: spreadsheetId,
                    row_index: index + 2,
                    gst_percent: gstPercent,
                    payment_mode: paymentMode,
                    context: context
                });
            } else if (transactionType === 'expense' || transactionType === 'salary') {
                // Expense/Salary → Expenses
                const expenseCategory = category ?
                    (category.toLowerCase().includes('office') ? 'OFFICE' :
                        category.toLowerCase().includes('travel') ? 'TRAVEL' :
                            category.toLowerCase().includes('software') || category.toLowerCase().includes('tech') ? 'SOFTWARE' :
                                category.toLowerCase().includes('marketing') ? 'MARKETING' :
                                    category.toLowerCase().includes('utilities') || category.toLowerCase().includes('rent') ? 'UTILITIES' :
                                        'MISC') : 'MISC';

                expenses.push({
                    org_id: profile.org_id,
                    expense_date: dateStr,
                    amount: convertedAmount,
                    category: expenseCategory,
                    vendor_name: entity,
                    payment_method: paymentMode?.toLowerCase().includes('cash') ? 'CASH' :
                        paymentMode?.toLowerCase().includes('card') ? 'CARD' :
                            paymentMode?.toLowerCase().includes('bank') ? 'BANK' : 'UNKNOWN',
                    status: status === 'completed' ? 'RECONCILED' : 'UNRECONCILED',
                    notes: transactionType === 'salary' ? `SALARY: ${description || ''}` : description,
                    source_type: 'google_sheet',
                    source_id: spreadsheetId,
                    row_index: index + 2,
                    gst_percent: gstPercent,
                    gst_amount: gstAmount,
                    context: context,
                    ref_id: refId
                });
            } else {
                // Transfer/Other → Manual Ledger Entries
                ledgerEntries.push({
                    org_id: profile.org_id,
                    type: 'EXPENSE', // Default to expense for transfers/other
                    amount: convertedAmount,
                    counterparty: entity,
                    transaction_date: dateStr,
                    invoice_number: refId,
                    category: category || 'MISC',
                    notes: description,
                    payment_mode: paymentMode,
                    status: status === 'completed' ? 'PAID' : 'OPEN',
                    source_type: 'google_sheet',
                    source_id: spreadsheetId,
                    row_index: index + 2,
                    gst_percent: gstPercent,
                    gst_amount: gstAmount,
                    context: context
                });
            }
        }

        // 5. Batch insert into appropriate tables
        let totalInserted = 0;
        const errors: string[] = [];

        if (invoices.length > 0) {
            const { error } = await supabase.from('invoices').upsert(invoices, {
                onConflict: 'org_id,source_type,source_id,row_index',
                ignoreDuplicates: false
            });
            if (error) {
                console.error('[SYNC ERROR] Invoices insert failed:', error);
                errors.push(`Invoices: ${error.message}`);
            } else {
                totalInserted += invoices.length;
            }
        }

        if (expenses.length > 0) {
            const { error } = await supabase.from('expenses').upsert(expenses, {
                onConflict: 'org_id,source_type,source_id,row_index',
                ignoreDuplicates: false
            });
            if (error) {
                console.error('[SYNC ERROR] Expenses insert failed:', error);
                errors.push(`Expenses: ${error.message}`);
            } else {
                totalInserted += expenses.length;
            }
        }

        if (ledgerEntries.length > 0) {
            const { error } = await supabase.from('manual_ledger_entries').upsert(ledgerEntries, {
                onConflict: 'org_id,source_type,source_id,row_index',
                ignoreDuplicates: false
            });
            if (error) {
                console.error('[SYNC ERROR] Ledger entries insert failed:', error);
                errors.push(`Ledger: ${error.message}`);
            } else {
                totalInserted += ledgerEntries.length;
            }
        }

        // 6. Update Sync Metadata
        await supabase
            .from('organization_configs')
            .update({
                last_sync_at: new Date().toISOString(),
                last_row_count: totalInserted
            })
            .eq('org_id', profile.org_id);

        if (errors.length > 0) {
            return NextResponse.json({
                success: false,
                count: totalInserted,
                errors: errors,
                message: `Partial sync: ${totalInserted} records synced, ${errors.length} errors`
            }, { status: 207 }); // Multi-Status
        }

        return NextResponse.json({
            success: true,
            count: totalInserted,
            breakdown: {
                invoices: invoices.length,
                expenses: expenses.length,
                ledger: ledgerEntries.length
            },
            message: `Successfully synced ${totalInserted} transactions to directive tables.`
        });

    } catch (error: any) {
        console.error('[SYNC ERROR] Fatal:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
