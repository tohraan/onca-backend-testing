import { ExtractorFactory } from '@/lib/extractors';
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { generateColumnSuggestions } from '@core/normalization/column-mapping';

// Supabase storage object keys are S3-compatible and have restrictions on
// characters. We normalise the original filename into a safe slug while
// preserving the extension.
function sanitizeFileName(originalName: string): string {
    const trimmed = originalName.trim();
    const lastDot = trimmed.lastIndexOf('.');
    const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
    const ext = lastDot > 0 ? trimmed.slice(lastDot) : '';

    // Replace anything not alphanumeric, dot, dash, underscore with a dash.
    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '-');

    // Collapse consecutive dashes and trim them from the ends.
    const normalisedBase = safeBase.replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'file';

    return `${normalisedBase}${ext}`;
}

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

        // `fileType` is a coarse hint used for CSV column suggestions.
        // It comes from the client and must stay within the allowed domain.
        const rawFileType = (formData.get('fileType') as string) || 'GENERAL';
        const allowedFileTypes = new Set(['BANK_STATEMENT', 'INVOICE', 'EXPENSE', 'GENERAL']);
        const fileType = allowedFileTypes.has(rawFileType) ? rawFileType : 'GENERAL';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const uploadId = crypto.randomUUID();
        const buffer = Buffer.from(await file.arrayBuffer());

        // Use Extractor Strategy
        let result;
        try {
            const extractor = ExtractorFactory.getExtractor(file.type, file.name);
            result = await extractor.extract({
                file,
                buffer,
                filename: file.name,
                mimeType: file.type,
                userId: user.id,
                orgId: profile.org_id,
                uploadId,
                fileTypeHint: fileType,
                supabase
            });
        } catch (err: any) {
            console.error('Extraction failed:', err);
            return NextResponse.json({ error: err.message || 'Extraction failed' }, { status: 500 });
        }

        // Persist upload record
        const { error: dbError } = await supabase.from('temp_uploads').insert({
            id: uploadId,
            org_id: profile.org_id,
            user_id: user.id,
            file_name: file.name,
            file_type: fileType,
            file_content: file.type === 'text/csv' ? buffer.toString('utf-8') : null,
            storage_path: result.signedUrl ? `${user.id}/temp/${uploadId}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}` : null,
            is_manual_required: result.isManualRequired,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        });

        if (dbError) {
            console.error('DB Error:', dbError);
            return NextResponse.json({ error: 'Database error saving upload' }, { status: 500 });
        }

        return NextResponse.json({
            uploadId,
            fileName: file.name,
            fileType,
            isManualRequired: result.isManualRequired,
            columnSuggestions: result.columnSuggestions || [],
            requiredColumns: result.requiredColumns || [],
            optionalColumns: result.optionalColumns || [],
            extractedData: result.extractedData,
            signedUrl: result.signedUrl
        });
    } catch (error) {
        console.error('Upload route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
