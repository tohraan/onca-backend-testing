import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ColumnType, UserColumnMapping, validateUserMapping } from '@core/normalization/column-mapping';
import { parseCSV } from '@core/normalization/csv-parser';

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
        const { uploadId, columnMappings } = body;

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
        const requiredColumns = ['DATE', 'DESCRIPTION'] as ColumnType[];
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

        // Parse CSV
        const parseResult = parseCSV(upload.file_content);

        if (parseResult.errors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Parsing errors occurred',
                    details: parseResult.errors,
                },
                { status: 400 }
            );
        }

        // Import bank transactions
        const errors: string[] = [];
        let importedCount = 0;

        for (const transaction of parseResult.transactions) {
            try {
                const { error: insertError } = await supabase
                    .from('master_transactions')
                    .insert({
                        org_id: profile.org_id,
                        date: transaction.date,
                        description: transaction.description,
                        amount: transaction.amount,
                        type: transaction.direction === 'DEBIT' ? 'EXPENSE' : 'INCOME',
                        source: 'BANK_UPLOAD',
                        metadata: {
                            bankAccountId: upload.metadata?.bankAccountId,
                            uploadId: uploadId,
                        },
                    });

                if (insertError) {
                    errors.push(`Failed to import transaction: ${insertError.message}`);
                } else {
                    importedCount++;
                }
            } catch (err) {
                errors.push(`Error importing transaction: ${err}`);
            }
        }

        // Clean up temporary upload
        await supabase.from('temp_uploads').delete().eq('id', uploadId);

        return NextResponse.json({
            success: true,
            importedRecords: importedCount,
            totalRecords: parseResult.transactions.length,
            errors,
        });
    } catch (error) {
        console.error('Banking confirm mapping error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
