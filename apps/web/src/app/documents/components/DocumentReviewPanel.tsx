import React, { useState, useEffect } from 'react';

interface ExtractedData {
    type?: string;
    date?: string;
    amount?: number;
    tax_amount?: number;
    project_total?: number;
    vendor_name?: string;
    client_name?: string;
    category?: string;
    invoice_number?: string;
    gst_number?: string;
    description?: string;
    line_items?: any[];
    dynamic_fields?: { label: string; value: string | number; type?: string }[];
}

interface DocumentReviewPanelProps {
    file: { name: string; type?: string };
    previewUrl: string;
    extractedData: ExtractedData | null;
    onConfirm?: (data: any) => void;
    onCancel: () => void;
    isSubmitting?: boolean;
    isLoading?: boolean;
}

export default function DocumentReviewPanel({
    file,
    previewUrl,
    extractedData,
    onConfirm,
    onCancel,
    isSubmitting = false,
    isLoading = false
}: DocumentReviewPanelProps) {
    const [formData, setFormData] = useState({
        type: 'EXPENSE',
        date: '',
        amount: '',
        taxAmount: '',
        vendor: '',
        client: '',
        category: '',
        invoiceNumber: '',
        gstNumber: '',
        notes: ''
    });

    const [dynamicFields, setDynamicFields] = useState<{ label: string; value: string; isAi: boolean }[]>([]);

    // Status tracking
    const [fieldStatus, setFieldStatus] = useState<Record<string, 'pending' | 'verified'>>({});
    const [fieldIsAi, setFieldIsAi] = useState<Record<string, boolean>>({});

    useEffect(() => {
        if (extractedData) {
            const data = {
                type: extractedData.type === 'INVOICE' ? 'INVOICE' : 'EXPENSE',
                date: extractedData.date || new Date().toISOString().split('T')[0],
                amount: extractedData.amount?.toString() || '',
                taxAmount: extractedData.tax_amount?.toString() || '',
                vendor: extractedData.vendor_name || '',
                client: extractedData.client_name || '',
                category: extractedData.category || '',
                invoiceNumber: extractedData.invoice_number || '',
                gstNumber: extractedData.gst_number || '',
                notes: extractedData.description || ''
            };
            setFormData(prev => ({ ...prev, ...data }));

            // Mark AI fields
            const aiFields: Record<string, boolean> = {};
            if (extractedData.amount) aiFields.amount = true;
            if (extractedData.vendor_name) aiFields.vendor = true;
            if (extractedData.client_name) aiFields.client = true;
            if (extractedData.tax_amount) aiFields.taxAmount = true;
            if (extractedData.invoice_number) aiFields.invoiceNumber = true;
            if (extractedData.gst_number) aiFields.gstNumber = true;
            if (extractedData.date) aiFields.date = true;
            setFieldIsAi(aiFields);

            if (extractedData.dynamic_fields) {
                setDynamicFields(extractedData.dynamic_fields.map(f => ({
                    label: f.label,
                    value: f.value.toString(),
                    isAi: true
                })));
            }
        }
    }, [extractedData, isLoading]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDynamicChange = (index: number, key: 'label' | 'value', val: string) => {
        const newFields = [...dynamicFields];
        newFields[index] = { ...newFields[index], [key]: val };
        setDynamicFields(newFields);
    };

    const removeDynamicField = (index: number) => {
        setDynamicFields(prev => prev.filter((_, i) => i !== index));
    };

    const addDynamicField = () => {
        setDynamicFields(prev => [...prev, { label: '', value: '', isAi: false }]);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (onConfirm) {
            onConfirm({
                ...formData,
                amount: parseFloat(formData.amount) || 0,
                taxAmount: parseFloat(formData.taxAmount) || 0,
                dynamicFields: dynamicFields.map(f => ({ label: f.label, value: f.value }))
            });
        }
    };

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // --- Unified Field List ---
    // We treat Core Fields just like Dynamic Fields for rendering,
    // creating a single seamless list of "Extracted Data".
    interface UnifiedField {
        key: string; // 'core.amount' or 'dynamic.0'
        label: string;
        value: any;
        type: 'text' | 'number' | 'date' | 'select';
        isAi: boolean;
        isCore?: boolean;
        onLabelChange?: (val: string) => void;
        onValueChange: (val: string) => void;
        onRemove?: () => void;
    }

    const getAllFields = (): UnifiedField[] => {
        const fields: UnifiedField[] = [];

        // 1. Core Fields (Mapped to DB columns)
        // Only show if they have values or are essential
        fields.push({ key: 'date', label: 'Date', value: formData.date, type: 'date', isAi: fieldIsAi.date, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'date', value: v } } as any) });
        fields.push({ key: 'amount', label: 'Amount', value: formData.amount, type: 'number', isAi: fieldIsAi.amount, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'amount', value: v } } as any) });

        if (formData.type === 'INVOICE') {
            fields.push({ key: 'client', label: 'Billed To', value: formData.client, type: 'text', isAi: fieldIsAi.client, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'client', value: v } } as any) });
        } else {
            fields.push({ key: 'vendor', label: 'Merchant / Vendor', value: formData.vendor, type: 'text', isAi: fieldIsAi.vendor, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'vendor', value: v } } as any) });
        }

        fields.push({ key: 'category', label: 'Category', value: formData.category, type: 'select', isAi: false, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'category', value: v } } as any) });

        // Optional Core
        if (formData.invoiceNumber)
            fields.push({ key: 'invoiceNumber', label: 'Invoice #', value: formData.invoiceNumber, type: 'text', isAi: fieldIsAi.invoiceNumber, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'invoiceNumber', value: v } } as any) });

        if (formData.taxAmount)
            fields.push({ key: 'taxAmount', label: 'Tax Amount', value: formData.taxAmount, type: 'number', isAi: fieldIsAi.taxAmount, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'taxAmount', value: v } } as any) });

        if (formData.gstNumber)
            fields.push({ key: 'gstNumber', label: 'Tax ID', value: formData.gstNumber, type: 'text', isAi: fieldIsAi.gstNumber, isCore: true, onValueChange: (v) => handleChange({ target: { name: 'gstNumber', value: v } } as any) });

        // 2. Dynamic Fields (Merged in)
        dynamicFields.forEach((f, i) => {
            fields.push({
                key: `dynamic.${i}`,
                label: f.label,
                value: f.value,
                type: 'text',
                isAi: f.isAi,
                isCore: false,
                onLabelChange: (val) => handleDynamicChange(i, 'label', val),
                onValueChange: (val) => handleDynamicChange(i, 'value', val),
                onRemove: () => removeDynamicField(i)
            });
        });

        return fields;
    };

    const renderUnifiedinput = (f: UnifiedField) => {
        const isCore = f.isCore;
        const status = f.isCore ? fieldStatus[f.key] : (f.isAi ? 'pending' : 'verified');
        const isVerified = status === 'verified';

        // Premium Styling Constants
        const borderColor = isVerified ? 'var(--success)' : (f.isAi ? '#8b5cf6' : 'var(--gray-300)');
        const bgColor = isVerified ? '#f0fdf4' : (f.isAi ? '#f5f3ff' : 'var(--white)');
        const labelColor = isVerified ? 'var(--success)' : 'var(--gray-700)';

        // Common Action Buttons
        const renderActions = () => (
            <div style={{ display: 'flex', gap: '4px' }}>
                <button
                    type="button"
                    onClick={() => {
                        if (f.isCore) {
                            setFieldStatus(prev => ({ ...prev, [f.key]: 'verified' }));
                            setFieldIsAi(prev => ({ ...prev, [f.key]: false }));
                        } else {
                            // Dynamic fields auto-verify on edit, but consistent check button is nice
                        }
                    }}
                    title="Confirm Value"
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '6px',
                        border: `1px solid ${isVerified ? 'var(--success)' : 'var(--gray-300)'}`,
                        background: isVerified ? '#dcfce7' : 'white',
                        color: isVerified ? 'var(--success)' : 'var(--gray-400)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    ✓
                </button>

                {/* Clear (Core) or Remove (Dynamic) */}
                <button
                    type="button"
                    onClick={() => {
                        if (!isCore && f.onRemove) f.onRemove();
                        if (isCore) {
                            f.onValueChange('');
                            setFieldStatus(prev => ({ ...prev, [f.key]: 'pending' }));
                        }
                    }}
                    title={isCore ? "Clear" : "Remove Field"}
                    style={{
                        width: '32px', height: '32px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRadius: '6px',
                        border: '1px solid var(--gray-300)',
                        background: 'white',
                        color: 'var(--gray-400)',
                        cursor: 'pointer', transition: 'all 0.2s'
                    }}
                >
                    ✕
                </button>
            </div>
        );

        return (
            <div key={f.key} style={{ marginBottom: '16px' }}>
                {/* Header Row: Label + Badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                        {/* Editable Label for Dynamic, Static for Core */}
                        {!isCore ? (
                            <input
                                value={f.label}
                                onChange={(e) => f.onLabelChange && f.onLabelChange(e.target.value)}
                                style={{
                                    fontSize: '13px', fontWeight: 600, color: 'var(--gray-800)',
                                    background: 'transparent', border: 'none', borderBottom: '1px dashed var(--gray-300)',
                                    padding: '0 2px', width: 'auto', minWidth: '80px'
                                }}
                                placeholder="Field Label"
                            />
                        ) : (
                            <label style={{ fontSize: '13px', fontWeight: 600, color: labelColor, cursor: 'default' }}>{f.label}</label>
                        )}

                        {f.isAi && (
                            <span style={{
                                fontSize: '10px', color: '#7c3aed', background: '#ede9fe',
                                padding: '2px 6px', borderRadius: '4px', fontWeight: 600, display: 'flex', alignItems: 'center'
                            }}>
                                ✨ AI
                            </span>
                        )}
                    </div>
                    {isVerified && <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 700 }}>VERIFIED</span>}
                </div>

                {/* Input Row */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ flex: 1, position: 'relative' }}>
                        {f.type === 'select' ? (
                            <select
                                value={f.value}
                                onChange={(e) => f.onValueChange(e.target.value)}
                                className="form-select"
                                style={{
                                    width: '100%', padding: '0 12px', height: '38px',
                                    borderRadius: '6px', border: '1px solid var(--gray-300)',
                                    fontSize: '14px', background: 'white'
                                }}
                            >
                                <option value="">Select Category</option>
                                {['Office Supplies', 'Travel', 'Software', 'Meals', 'Professional Services', 'Utilities', 'Rent', 'Other'].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        ) : (
                            <input
                                type={f.type}
                                value={f.value}
                                onChange={(e) => {
                                    f.onValueChange(e.target.value);
                                    if (f.isCore) {
                                        setFieldStatus(prev => ({ ...prev, [f.key]: 'verified' }));
                                        setFieldIsAi(prev => ({ ...prev, [f.key]: false }));
                                    }
                                }}
                                className="form-input"
                                placeholder={f.label}
                                style={{
                                    width: '100%', height: '38px', padding: '0 12px',
                                    borderRadius: '6px',
                                    border: `1px solid ${borderColor}`,
                                    backgroundColor: bgColor,
                                    fontSize: '14px',
                                    transition: 'all 0.2s'
                                }}
                            />
                        )}
                    </div>
                    {renderActions()}
                </div>
            </div>
        );
    };

    return (
        <div className="card full-height-card">
            <style jsx>{`
                .full-height-card { display: flex; flex-direction: column; height: calc(100vh - 140px); overflow: hidden; }
                .spinner { animation: spin 1s linear infinite; width: 32px; height: 32px; border: 3px solid var(--primary-100); border-top-color: var(--primary); border-radius: 50%; }
                @keyframes spin { 100% { transform: rotate(360deg); } }
                
                .field-row { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px solid var(--gray-100); }
                .field-label-container { flex: 0 0 140px; display: flex; align-items: center; gap: 6px; }
                .field-label-container label { font-size: 13px; color: var(--gray-600); font-weight: 500; }
                .label-input { font-size: 13px; color: var(--gray-800); font-weight: 600; border: none; background: transparent; width: 100%; }
                .label-input:focus { outline: none; text-decoration: underline; }
                
                .field-value-container { flex: 1; display: flex; align-items: center; position: relative; }
                .unified-input { width: 100%; padding: 8px 12px; font-size: 14px; border: 1px solid transparent; background: var(--gray-50); border-radius: 6px; transition: all 0.2s; }
                .unified-input:focus { background: white; border-color: var(--primary); outline: none; box-shadow: 0 0 0 2px var(--primary-100); }
                .unified-input.verified { background: #f0fdf4; color: var(--gray-900); border-color: transparent; }
                
                .ai-badge { font-size: 10px; color: #7c3aed; background: #ede9fe; padding: 2px 6px; border-radius: 4px; font-weight: 600; }
                .remove-btn { background: none; border: none; font-size: 18px; color: var(--gray-400); cursor: pointer; padding: 0 8px; }
                .remove-btn:hover { color: var(--error); }
            `}</style>

            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', padding: '16px 24px', borderBottom: '1px solid var(--gray-200)' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 600, margin: 0 }}>Review Data</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={onCancel} className="btn btn-secondary btn-sm">Close</button>
                    {!isLoading && <button onClick={handleSubmit} className="btn btn-primary btn-sm">{isSubmitting ? 'Saving...' : 'Confirm'}</button>}
                </div>
            </div>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                <div style={{ flex: 1, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {isPdf ? <iframe src={previewUrl} style={{ width: '100%', height: '100%', border: 'none' }} /> : <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: '100%' }} />}
                </div>

                <div style={{ width: '450px', overflowY: 'auto', background: 'white', padding: '24px' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '60px', gap: '16px' }}>
                            <div className="spinner" />
                            <p className="text-muted">Extracting rich data...</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '16px', color: 'var(--gray-900)' }}>Extracted Information</h3>

                            {getAllFields().map((f, i) => renderUnifiedinput(f))}

                            <div style={{ marginTop: '16px' }}>
                                <button type="button" onClick={addDynamicField} style={{ fontSize: '13px', color: 'var(--primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}>
                                    + Add Missing Field
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
