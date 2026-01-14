'use client';

import { X, Check } from 'lucide-react';

interface DocumentPreviewProps {
    document: any;
    onClose: () => void;
}

export function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
    if (!document) return null;

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', width: '900px', height: '80vh',
                borderRadius: '12px', overflow: 'hidden', display: 'flex'
            }}>
                {/* Left: Preview */}
                <div style={{ flex: 1, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-tertiary)' }}>Preview Unavailable</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)' }}>{document.original_filename}</div>
                </div>

                {/* Right: Metadata & Form */}
                <div style={{ width: '350px', padding: '24px', borderLeft: '1px solid var(--border-primary)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Review Document</h3>
                        <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                            <X size={20} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Type</label>
                            <input type="text" readOnly value={document.type} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: '#f9fafb' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Category</label>
                            <input type="text" readOnly value={document.category} style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px', background: '#f9fafb' }} />
                        </div>

                        <div style={{ height: '1px', background: 'var(--border-primary)', margin: '12px 0' }}></div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Date</label>
                            <input type="date" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Amount</label>
                            <input type="number" placeholder="0.00" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Vendor / Entity</label>
                            <input type="text" placeholder="e.g. AWS" style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }} />
                        </div>

                        <button style={{
                            marginTop: '24px',
                            width: '100%',
                            padding: '12px',
                            background: 'var(--brand-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <Check size={18} /> Verify and Save
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
