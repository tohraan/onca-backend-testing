'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, Building2, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface Transaction {
    transaction_date: string;
    description: string;
    amount: number;
    direction: 'DEBIT' | 'CREDIT';
}

interface PreviewData {
    bank_name: string;
    account_label: string;
    statement_period: string;
    file_hash: string;
    transaction_count: number;
    transactions: Transaction[];
}

export default function BankingPage() {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState<PreviewData | null>(null);
    const [confirming, setConfirming] = useState(false);
    const [success, setSuccess] = useState(false);
    const { formatCurrency } = useSettings();

    const [formData, setFormData] = useState({
        bank_name: '',
        account_label: '',
        statement_period: ''
    });
    const [file, setFile] = useState<File | null>(null);

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;

        setUploading(true);
        try {
            const data = new FormData();
            data.append('file', file);
            data.append('bank_name', formData.bank_name);
            data.append('account_label', formData.account_label);
            data.append('statement_period', formData.statement_period);

            const res = await fetch('/api/banking/upload', {
                method: 'POST',
                body: data
            });

            const result = await res.json();

            if (!res.ok) {
                alert(result.error || 'Upload failed');
                return;
            }

            setPreview(result.preview);
        } catch (err) {
            console.error(err);
            alert('Upload failed. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const handleConfirm = async () => {
        if (!preview) return;

        setConfirming(true);
        try {
            const res = await fetch('/api/banking/confirm', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(preview)
            });

            if (!res.ok) throw new Error('Confirm failed');

            setSuccess(true);
            setPreview(null);
            setFile(null);
            setFormData({ bank_name: '', account_label: '', statement_period: '' });
        } catch (err) {
            console.error(err);
            alert('Failed to confirm. Please try again.');
        } finally {
            setConfirming(false);
        }
    };

    // Calculate preview stats
    const previewStats = preview ? {
        credits: preview.transactions.filter(t => t.direction === 'CREDIT').reduce((sum, t) => sum + t.amount, 0),
        debits: preview.transactions.filter(t => t.direction === 'DEBIT').reduce((sum, t) => sum + t.amount, 0),
        count: preview.transaction_count
    } : null;

    return (
        <div style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Banking & Statements</h1>
                <p className="page-subtitle">Upload bank statements to reconcile transactions</p>
            </div>

            {/* Stats Row */}
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
                <div className="stat-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: 'var(--primary-light)',
                            borderRadius: 'var(--radius)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <Building2 size={18} color="var(--primary)" />
                        </div>
                        <span className="stat-label" style={{ marginBottom: 0 }}>STATEMENTS</span>
                    </div>
                    <div className="stat-value">—</div>
                    <div className="stat-subtext">upload to see data</div>
                </div>
                <div className="stat-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: 'var(--success-bg)',
                            borderRadius: 'var(--radius)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingUp size={18} color="var(--success)" />
                        </div>
                        <span className="stat-label" style={{ marginBottom: 0 }}>CREDITS</span>
                    </div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>—</div>
                    <div className="stat-subtext">after import</div>
                </div>
                <div className="stat-box">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                        <div style={{
                            width: '36px', height: '36px',
                            background: 'var(--error-bg)',
                            borderRadius: 'var(--radius)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <TrendingDown size={18} color="var(--error)" />
                        </div>
                        <span className="stat-label" style={{ marginBottom: 0 }}>DEBITS</span>
                    </div>
                    <div className="stat-value" style={{ color: 'var(--error)' }}>—</div>
                    <div className="stat-subtext">after import</div>
                </div>
            </div>

            {success && (
                <div style={{
                    padding: '14px 16px',
                    background: 'var(--success-bg)',
                    border: '1px solid #A5D6A7',
                    borderRadius: 'var(--radius)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: 'var(--success)',
                    marginBottom: '24px'
                }}>
                    <CheckCircle size={18} />
                    <span style={{ fontWeight: '600', fontSize: '13px' }}>Statement imported successfully!</span>
                </div>
            )}

            {!preview ? (
                <div className="card">
                    <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Upload size={16} />
                        Upload Bank Statement
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleUpload}>
                            <div className="form-row">
                                <div className="form-group">
                                    <label className="form-label">Bank Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. HDFC Bank"
                                        className="form-input"
                                        value={formData.bank_name}
                                        onChange={e => setFormData({ ...formData, bank_name: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Account Label</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Business Checking"
                                        className="form-input"
                                        value={formData.account_label}
                                        onChange={e => setFormData({ ...formData, account_label: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Statement Period</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Jan 2024"
                                        className="form-input"
                                        value={formData.statement_period}
                                        onChange={e => setFormData({ ...formData, statement_period: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '16px' }}>
                                <label className="form-label">CSV File</label>
                                <input
                                    type="file"
                                    accept=".csv"
                                    required
                                    className="form-input"
                                    onChange={e => setFile(e.target.files?.[0] || null)}
                                />
                                <p style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '6px' }}>
                                    Upload a CSV export from your bank. Expected columns: date, description, debit, credit.
                                </p>
                            </div>

                            <div className="form-actions" style={{ marginTop: '20px' }}>
                                <button
                                    disabled={uploading}
                                    type="submit"
                                    className="btn btn-primary"
                                    style={{ opacity: uploading ? 0.7 : 1 }}
                                >
                                    <Upload size={16} />
                                    {uploading ? 'Parsing...' : 'Upload & Preview'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="card">
                    <div className="card-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={16} />
                            <span>Preview: {preview.bank_name} - {preview.statement_period}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => setPreview(null)} className="btn btn-secondary btn-sm">
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={confirming}
                                className="btn btn-primary btn-sm"
                                style={{ opacity: confirming ? 0.7 : 1 }}
                            >
                                {confirming ? 'Confirming...' : 'Confirm Import'}
                            </button>
                        </div>
                    </div>

                    {/* Preview Stats */}
                    {previewStats && (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '16px',
                            padding: '16px',
                            background: 'var(--gray-50)',
                            borderBottom: '1px solid var(--gray-200)'
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--gray-500)', marginBottom: '4px' }}>TRANSACTIONS</div>
                                <div style={{ fontSize: '20px', fontWeight: '700' }}>{previewStats.count}</div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--success)', marginBottom: '4px' }}>CREDITS</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--success)' }}>
                                    {formatCurrency(previewStats.credits)}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '11px', fontWeight: '600', color: 'var(--error)', marginBottom: '4px' }}>DEBITS</div>
                                <div style={{ fontSize: '20px', fontWeight: '700', color: 'var(--error)' }}>
                                    {formatCurrency(previewStats.debits)}
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="card-body" style={{ padding: 0, maxHeight: '400px', overflowY: 'auto' }}>
                        <div className="table-header-row" style={{
                            gridTemplateColumns: '100px 1fr 120px 80px',
                            position: 'sticky',
                            top: 0,
                            background: 'var(--gray-50)'
                        }}>
                            <span>Date</span>
                            <span>Description</span>
                            <span style={{ textAlign: 'right' }}>Amount</span>
                            <span style={{ textAlign: 'center' }}>Type</span>
                        </div>
                        {preview.transactions.map((tx, idx) => (
                            <div
                                key={idx}
                                className="table-row"
                                style={{ gridTemplateColumns: '100px 1fr 120px 80px' }}
                            >
                                <span style={{ color: 'var(--gray-600)' }}>{tx.transaction_date}</span>
                                <span style={{ fontWeight: 500 }}>{tx.description}</span>
                                <span style={{ textAlign: 'right', fontWeight: '600' }}>
                                    {formatCurrency(tx.amount)}
                                </span>
                                <span style={{ textAlign: 'center' }}>
                                    <span className={`status-badge ${tx.direction === 'CREDIT' ? 'status-paid' : 'status-overdue'}`}>
                                        {tx.direction}
                                    </span>
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
