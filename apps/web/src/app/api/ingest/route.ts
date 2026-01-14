import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ingest } from '@core/ingestion'

// Normalise filenames into a storage-safe key segment (S3-style restrictions).
function sanitizeFileName(originalName: string): string {
    const trimmed = originalName.trim();
    const lastDot = trimmed.lastIndexOf('.');
    const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;
    const ext = lastDot > 0 ? trimmed.slice(lastDot) : '';

    const safeBase = base.replace(/[^a-zA-Z0-9._-]/g, '-');
    const normalisedBase = safeBase.replace(/-+/g, '-').replace(/^-+|-+$/g, '') || 'file';

    return `${normalisedBase}${ext}`;
}

export async function POST(request: Request) {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // 1. Ingestion (Trust Boundary)
        const buffer = Buffer.from(await file.arrayBuffer())
        const safeName = sanitizeFileName(file.name)
        const filename = `${user.id}/${Date.now()}-${safeName}`

        // Upload to Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase
            .storage
            .from('documents')
            .upload(filename, buffer, {
                contentType: file.type,
            })

        if (uploadError) throw uploadError

        // 2. Trigger Core Ingestion Logic
        const receipt = await ingest('upload', {
            filename,
            size: file.size,
            type: file.type,
            userId: user.id
        })

        return NextResponse.json({ success: true, receipt })
    } catch (error: any) {
        console.error('Ingestion error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
