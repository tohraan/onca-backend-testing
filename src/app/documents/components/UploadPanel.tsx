'use client';

import { useState, useRef } from 'react';
import { Upload, Camera, FileText, Loader2, AlertCircle, Receipt, CreditCard, Building2 } from 'lucide-react';

type UploadCategory = 'RECEIVABLE' | 'PAYABLE' | 'EXPENSE' | 'BANK_STMT';

interface UploadPanelProps {
    onUploadComplete: (doc: any) => void;
    onUploadStart?: (previewUrl: string, file: File) => void;
}

export function UploadPanel({ onUploadComplete, onUploadStart }: UploadPanelProps) {
    const [activeTab, setActiveTab] = useState<UploadCategory>('RECEIVABLE');
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const categories: { id: UploadCategory; label: string; desc: string; icon: any }[] = [
        { id: 'RECEIVABLE', label: 'Sales Invoice', desc: 'Invoices you sent', icon: FileText },
        { id: 'PAYABLE', label: 'Vendor Bill', desc: 'Bills to pay', icon: Receipt },
        { id: 'EXPENSE', label: 'Receipt', desc: 'Paid expenses', icon: CreditCard },
        { id: 'BANK_STMT', label: 'Statement', desc: 'Bank statements', icon: Building2 },
    ];

    const getDocumentTypeAndCategory = (tab: UploadCategory) => {
        switch (tab) {
            case 'RECEIVABLE':
                return { type: 'INVOICE', category: 'RECEIVABLE', fileType: 'INVOICE' as const };
            case 'PAYABLE':
                return { type: 'INVOICE', category: 'PAYABLE', fileType: 'INVOICE' as const };
            case 'EXPENSE':
                return { type: 'RECEIPT', category: 'EXPENSE', fileType: 'EXPENSE' as const };
            case 'BANK_STMT':
                return { type: 'BANK_STMT', category: 'EXPENSE', fileType: 'BANK_STATEMENT' as const };
            default:
                return { type: 'OTHER', category: 'EXPENSE', fileType: 'GENERAL' as const };
        }
    };

    const handleFileUpload = async (file: File) => {
        if (!file) return;

        setUploading(true);
        setError(null);

        // Optimistic UI - Notify parent immediately
        if (onUploadStart && !file.name.endsWith('.csv')) {
            const previewUrl = URL.createObjectURL(file);
            onUploadStart(previewUrl, file);
        }

        const { type, category, fileType } = getDocumentTypeAndCategory(activeTab);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);
        formData.append('category', category);
        formData.append('fileType', fileType);

        try {
            const res = await fetch('/api/ingest/upload', {
                method: 'POST',
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Upload failed');
            }

            if (data.isManualRequired) {
                onUploadComplete({ ...data, status: 'needs_manual_entry' });
            } else {
                onUploadComplete(data);
            }
        } catch (err: any) {
            console.error('Upload failed:', err);
            setError(err.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileUpload(e.dataTransfer.files[0]);
        }
    };

    const activeCat = categories.find(c => c.id === activeTab);

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
            {/* Category Tabs */}
            <div className="tabs" style={{ padding: '0 16px', margin: 0 }}>
                {categories.map((cat) => {
                    const Icon = cat.icon;
                    const isActive = activeTab === cat.id;
                    return (
                        <button
                            key={cat.id}
                            onClick={() => setActiveTab(cat.id)}
                            className={`tab ${isActive ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                            <Icon size={14} />
                            {cat.label}
                        </button>
                    );
                })}
            </div>

            {/* Upload Zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    padding: '40px 24px',
                    textAlign: 'center',
                    background: dragActive ? 'var(--primary-light)' : 'var(--white)',
                    border: dragActive ? '2px dashed var(--primary)' : '2px dashed var(--gray-300)',
                    transition: 'all 0.2s ease',
                    margin: '16px',
                    borderRadius: 'var(--radius-md)'
                }}
            >
                <div style={{
                    width: '48px',
                    height: '48px',
                    background: 'var(--primary-light)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 16px'
                }}>
                    <Upload size={22} color="var(--primary)" />
                </div>

                <div style={{ marginBottom: '20px' }}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                        Upload {activeCat?.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                        {activeCat?.desc} • Drag & drop or click to browse
                    </div>
                </div>

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                    accept=".pdf,.jpg,.jpeg,.png,.csv"
                />

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn btn-primary"
                        style={{ opacity: uploading ? 0.7 : 1 }}
                    >
                        {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                        {uploading ? 'Uploading...' : 'Select File'}
                    </button>

                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="btn btn-secondary"
                    >
                        <Camera size={16} />
                        Capture
                    </button>
                </div>

                <div style={{ marginTop: '16px', fontSize: '12px', color: 'var(--gray-400)' }}>
                    Supported: PDF, JPG, PNG, CSV
                </div>

                {error && (
                    <div style={{
                        marginTop: '20px',
                        padding: '12px 16px',
                        background: 'var(--error-bg)',
                        color: 'var(--error)',
                        borderRadius: 'var(--radius)',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
            </div>
        </div>
    );
}
