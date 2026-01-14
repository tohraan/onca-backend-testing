import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateColumnSuggestions } from '@core/normalization/column-mapping';

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

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const bankAccountId = formData.get('bankAccountId') as string;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!file.name.endsWith('.csv')) {
            return NextResponse.json(
                { error: 'Only CSV files are supported' },
                { status: 400 }
            );
        }

        // Read file content
        const csvContent = await file.text();

        // Generate column suggestions for bank statement
        const suggestions = generateColumnSuggestions(csvContent, 'BANK_STATEMENT');

        // Store file temporarily
        const uploadId = crypto.randomUUID();
        const { error: uploadError } = await supabase.from('temp_uploads').insert({
            id: uploadId,
            org_id: profile.org_id,
            user_id: user.id,
            file_name: file.name,
            file_type: 'BANK_STATEMENT',
            file_content: csvContent,
            metadata: { bankAccountId }, // Store bank account ID for later
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        if (uploadError) {
            console.error('Error storing upload:', uploadError);
            return NextResponse.json(
                { error: 'Failed to store upload' },
                { status: 500 }
            );
        }

        // Return column suggestions
        return NextResponse.json({
            uploadId,
            fileName: file.name,
            fileType: 'BANK_STATEMENT',
            columnSuggestions: suggestions.suggestions,
            requiredColumns: suggestions.requiredColumns,
            optionalColumns: suggestions.optionalColumns,
        });
    } catch (error) {
        console.error('Banking upload error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
