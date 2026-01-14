'use client';

import { useState, useEffect } from 'react';
import { FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

interface Document {
    id: string;
    original_filename: string;
    category: string;
    type: string;
    status: 'PENDING' | 'PROCESSING' | 'NORMALIZED' | 'FAILED';
    ingested_at: string;
}

export function DocumentList({ refreshTrigger, onSelect }: { refreshTrigger: number, onSelect?: (doc: any) => void }) {
    const [documents, setDocuments] = useState<Document[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchDocuments = async () => {
            try {
                setLoading(true);
                const res = await fetch('/api/documents');
                if (!res.ok) throw new Error('Failed to load documents');
                const data = await res.json();
                setDocuments(data.documents || []);
            } catch (err) {
                console.error(err);
                setError('Could not load documents');
            } finally {
                setLoading(false);
            }
        };

        fetchDocuments();
    }, [refreshTrigger]);

    if (loading) {
        return <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '0.85rem' }}>Loading documents...</div>;
    }

    if (error) {
        return <div style={{ color: '#dc2626', padding: '20px', fontSize: '0.85rem' }}>{error}</div>;
    }

    if (documents.length === 0) {
        return (
            <div style={{ color: 'var(--text-secondary)', padding: '20px', fontSize: '0.85rem', fontStyle: 'italic', textAlign: 'center' }}>
                No documents found. Upload one to get started.
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {documents.map((doc) => (
                <div key={doc.id} onClick={() => onSelect && onSelect(doc)} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px', background: 'var(--bg-primary)',
                    borderRadius: '8px', border: '1px solid var(--border-primary)',
                    transition: 'all 0.2s ease',
                    cursor: onSelect ? 'pointer' : 'default'
                }}>
                    <div style={{ color: 'var(--brand-primary)', flexShrink: 0 }}>
                        <FileText size={18} />
                    </div>

                    <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{
                            fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-primary)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                        }}>
                            {doc.original_filename}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'center', marginTop: '2px' }}>
                            <span style={{
                                textTransform: 'uppercase',
                                fontSize: '0.65rem',
                                fontWeight: '700',
                                padding: '2px 6px',
                                background: 'var(--bg-secondary)',
                                borderRadius: '4px',
                                letterSpacing: '0.05em'
                            }}>
                                {doc.category}
                            </span>
                            <span>•</span>
                            <span>{new Date(doc.ingested_at).toLocaleDateString()}</span>
                        </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {doc.status === 'PENDING' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                                <Clock size={14} /> Processing
                            </div>
                        )}
                        {doc.status === 'NORMALIZED' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--brand-primary)', fontSize: '0.75rem' }}>
                                <CheckCircle2 size={14} /> Ready
                            </div>
                        )}
                        {doc.status === 'FAILED' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626', fontSize: '0.75rem' }}>
                                <AlertCircle size={14} /> Failed
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
