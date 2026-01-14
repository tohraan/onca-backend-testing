'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, Check, X, ArrowRight, Table } from 'lucide-react';

/* 
  Re-defining types locally to ensure client-side compatibility 
  and matching the core/normalization/column-mapping.ts definition 
*/
type ColumnType =
    | 'DATE'
    | 'DESCRIPTION'
    | 'AMOUNT'
    | 'DEBIT'
    | 'CREDIT'
    | 'CATEGORY'
    | 'VENDOR'
    | 'INVOICE_NUMBER'
    | 'DUE_DATE'
    | 'STATUS'
    | 'CURRENCY'
    | 'TAX_RATE'
    | 'IGNORE';

interface ColumnSuggestion {
    columnIndex: number;
    headerName: string;
    suggestedType: ColumnType;
    confidence: number;
    sampleValues: string[];
    reasoning: string;
}

interface ColumnMappingPanelProps {
    fileData: {
        uploadId: string;
        fileName: string;
        fileType: string;
        columnSuggestions: ColumnSuggestion[];
        requiredColumns: ColumnType[];
        optionalColumns: ColumnType[];
        // We might need raw data for preview if not in suggestions, 
        // but suggestions usually carry sample values.
    };
    onConfirm: (mapping: any) => void;
    onCancel: () => void;
}

export function ColumnMappingPanel({ fileData, onConfirm, onCancel }: ColumnMappingPanelProps) {
    const [columnMapping, setColumnMapping] = useState<{ [index: number]: ColumnType }>({});
    const [error, setError] = useState<string | null>(null);

    // Initialize mapping with suggestions
    useEffect(() => {
        const initialMapping: { [index: number]: ColumnType } = {};
        fileData.columnSuggestions.forEach(s => {
            initialMapping[s.columnIndex] = s.suggestedType;
        });
        setColumnMapping(initialMapping);
    }, [fileData]);

    const handleTypeChange = (columnIndex: number, type: ColumnType) => {
        setColumnMapping(prev => ({
            ...prev,
            [columnIndex]: type
        }));
        setError(null);
    };

    const handleConfirm = () => {
        // Validate requirements
        const mappedTypes = Object.values(columnMapping);
        const missingRequired = fileData.requiredColumns.filter(req => !mappedTypes.includes(req));

        if (missingRequired.length > 0) {
            setError(`Missing required columns: ${missingRequired.join(', ')}`);
            return;
        }

        // Format for API
        const mappingArray = Object.entries(columnMapping).map(([index, type]) => ({
            columnIndex: parseInt(index),
            headerName: fileData.columnSuggestions.find(c => c.columnIndex === parseInt(index))?.headerName || '',
            userSelectedType: type
        }));

        onConfirm({
            uploadId: fileData.uploadId,
            mappings: mappingArray
        });
    };

    // Helper to get max sample rows count
    const sampleRowCount = Math.max(...fileData.columnSuggestions.map(col => col.sampleValues?.length || 0));
    const sampleRows = Array.from({ length: sampleRowCount }, (_, rowIndex) =>
        fileData.columnSuggestions.map(col => col.sampleValues?.[rowIndex] || '')
    );

    const columnOptions: { value: ColumnType; label: string }[] = [
        { value: 'DATE', label: 'Date' },
        { value: 'DESCRIPTION', label: 'Description' },
        { value: 'AMOUNT', label: 'Amount' },
        { value: 'DEBIT', label: 'Debit (Money Out)' },
        { value: 'CREDIT', label: 'Credit (Money In)' },
        { value: 'CATEGORY', label: 'Category' },
        { value: 'VENDOR', label: 'Vendor/Payee' },
        { value: 'INVOICE_NUMBER', label: 'Invoice No.' },
        { value: 'DUE_DATE', label: 'Due Date' },
        { value: 'STATUS', label: 'Status' },
        { value: 'CURRENCY', label: 'Currency' },
        { value: 'TAX_RATE', label: 'Tax Rate' },
        { value: 'IGNORE', label: 'Ignore Column' },
    ];

    return (
        <div className="card" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--brand-primary)' }}>
            <div style={{ padding: '16px 24px', background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '800', marginBottom: '4px', color: 'var(--brand-primary)' }}>
                        Map CSV Columns
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        Please confirm what each column represents in <strong>{fileData.fileName}</strong>
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ fontSize: '0.85rem', padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563EB', borderRadius: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} />
                        Required: {fileData.requiredColumns.join(', ')}
                    </div>
                </div>
            </div>

            <div style={{ overflowX: 'auto', padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead>
                        {/* Header Row with Dropdowns */}
                        <tr style={{ background: '#F8FAFC' }}>
                            {fileData.columnSuggestions.map((col) => {
                                const isMapped = columnMapping[col.columnIndex] && columnMapping[col.columnIndex] !== 'IGNORE';
                                const isValid = fileData.requiredColumns.includes(columnMapping[col.columnIndex]);

                                return (
                                    <th key={col.columnIndex} style={{ padding: '16px', textAlign: 'left', minWidth: '180px', borderBottom: '2px solid var(--border-primary)' }}>
                                        <div style={{ marginBottom: '8px', fontWeight: '700', color: 'var(--text-primary)' }}>
                                            {col.headerName}
                                        </div>
                                        <select
                                            value={columnMapping[col.columnIndex] || 'IGNORE'}
                                            onChange={(e) => handleTypeChange(col.columnIndex, e.target.value as ColumnType)}
                                            style={{
                                                width: '100%',
                                                padding: '8px',
                                                borderRadius: '6px',
                                                border: `1px solid ${isValid ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                                background: isMapped ? 'white' : 'var(--bg-secondary)',
                                                fontWeight: isMapped ? 600 : 400,
                                                color: isMapped ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                                outline: 'none',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            {columnOptions.map(opt => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                        </select>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {/* Sample Data Rows */}
                        {sampleRows.map((row, rIndex) => (
                            <tr key={rIndex} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                {row.map((cellValue, cIndex) => (
                                    <td key={cIndex} style={{ padding: '12px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                                        {cellValue}
                                    </td>
                                ))}
                            </tr>
                        ))}
                        {/* Reasoning Row */}
                        <tr style={{ background: '#F8FAFC' }}>
                            {fileData.columnSuggestions.map((col) => (
                                <td key={col.columnIndex} style={{ padding: '8px 16px', fontSize: '0.75rem', color: 'var(--text-tertiary)', borderTop: '1px solid var(--border-primary)' }}>
                                    AI detected: {col.suggestedType} ({Math.round(col.confidence * 100)}%)
                                    <br />
                                    {col.reasoning}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>

            {error && (
                <div style={{ padding: '12px 24px', background: '#FEF2F2', color: '#DC2626', fontSize: '0.9rem', borderTop: '1px solid #FECACA', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertCircle size={16} />
                    {error}
                </div>
            )}

            <div style={{ padding: '16px 24px', background: '#F8FAFC', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <button
                    onClick={onCancel}
                    className="btn"
                    style={{ background: 'white', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}
                >
                    Cancel
                </button>
                <button
                    onClick={handleConfirm}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    Confirm Mapping <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
}
