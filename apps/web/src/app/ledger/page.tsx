'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Check, X } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface LedgerEntry {
    id: string;
    type: string;
    counterparty: string;
    amount: number;
    transaction_date: string;
    due_date?: string;
    status: string;
    notes?: string;
    isNew?: boolean;
}

export default function LedgerPage() {
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [stats, setStats] = useState({ receivables: 0, payables: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { formatCurrency } = useSettings();

    // Form state
    const [formData, setFormData] = useState({
        type: 'RECEIVABLE',
        counterparty: '',
        amount: '',
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });

    useEffect(() => {
        fetchEntries();
    }, []);

    const fetchEntries = async () => {
        try {
            const res = await fetch('/api/ledger');
            const data = await res.json();
            if (data.entries) {
                setEntries(data.entries);
                calculateStats(data.entries);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (entries: LedgerEntry[]) => {
        const receivables = entries
            .filter(e => e.type === 'RECEIVABLE' && e.status !== 'PAID')
            .reduce((sum, e) => sum + Number(e.amount), 0);
        const payables = entries
            .filter(e => e.type === 'PAYABLE' && e.status !== 'PAID')
            .reduce((sum, e) => sum + Number(e.amount), 0);
        setStats({ receivables, payables });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Create optimistic entry
        const tempId = `temp-${Date.now()}`;
        const optimisticEntry: LedgerEntry = {
            id: tempId,
            type: formData.type,
            counterparty: formData.counterparty,
            amount: parseFloat(formData.amount),
            transaction_date: formData.transaction_date,
            due_date: formData.due_date || undefined,
            status: 'OPEN',
            notes: formData.notes,
            isNew: true
        };

        // Add to UI immediately (optimistic update)
        setEntries(prev => [optimisticEntry, ...prev]);
        calculateStats([optimisticEntry, ...entries]);

        // Reset form
        setFormData({
            type: 'RECEIVABLE',
            counterparty: '',
            amount: '',
            transaction_date: new Date().toISOString().split('T')[0],
            due_date: '',
            notes: ''
        });
        setShowForm(false);

        // Submit to backend
        try {
            const res = await fetch('/api/ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: formData.type,
                    counterparty: formData.counterparty,
                    amount: parseFloat(formData.amount),
                    transaction_date: formData.transaction_date,
                    due_date: formData.due_date || null,
                    notes: formData.notes
                })
            });

            if (!res.ok) {
                throw new Error('Failed to save entry');
            }

            const data = await res.json();

            // Replace temp entry with real one
            setEntries(prev => prev.map(e =>
                e.id === tempId ? { ...data.entry, isNew: false } : e
            ));
        } catch (err: any) {
            // Remove optimistic entry on error
            setEntries(prev => prev.filter(e => e.id !== tempId));
            calculateStats(entries.filter(e => e.id !== tempId));
            setError(err.message || 'Failed to add entry');
        }
    };

    const handleDelete = async (id: string) => {
        const entryToDelete = entries.find(e => e.id === id);

        // Optimistic delete
        setEntries(prev => prev.filter(e => e.id !== id));
        calculateStats(entries.filter(e => e.id !== id));

        try {
            const res = await fetch(`/api/ledger?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
        } catch (err) {
            // Restore on error
            if (entryToDelete) {
                setEntries(prev => [...prev, entryToDelete]);
                calculateStats([...entries, entryToDelete]);
            }
            setError('Failed to delete entry');
        }
    };

    const getStatusBadge = (status: string) => {
        const statusClass = {
            'PAID': 'status-paid',
            'OPEN': 'status-open',
            'OVERDUE': 'status-overdue',
            'PENDING': 'status-pending'
        }[status] || 'status-pending';

        return <span className={`status-badge ${statusClass}`}>{status}</span>;
    };

    return (
        <div style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Ledger & Tracking</h1>
                <p className="page-subtitle">Track manual transactions, payables, and receivables</p>
            </div>

            {/* Stats */}
            <div className="stat-grid">
                <div className="stat-box">
                    <div className="stat-label">Receivables</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                        {formatCurrency(stats.receivables)}
                    </div>
                    <div className="stat-subtext">Outstanding from customers</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Payables</div>
                    <div className="stat-value" style={{ color: 'var(--error)' }}>
                        {formatCurrency(stats.payables)}
                    </div>
                    <div className="stat-subtext">Due to vendors</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Net Position</div>
                    <div className="stat-value">
                        {formatCurrency(stats.receivables - stats.payables)}
                    </div>
                    <div className="stat-subtext">
                        {stats.receivables >= stats.payables ? 'Net positive' : 'Net negative'}
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div style={{
                    background: 'var(--error-bg)',
                    border: '1px solid #EF9A9A',
                    borderRadius: 'var(--radius)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: 'var(--error)',
                    fontSize: '13px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    {error}
                    <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={16} color="var(--error)" />
                    </button>
                </div>
            )}

            {/* Action Bar */}
            <div className="action-bar">
                <div className="action-bar-left">
                    <h2>All Entries</h2>
                    <span style={{ color: 'var(--gray-500)', fontSize: '13px' }}>
                        {entries.length} records
                    </span>
                </div>
                <div className="action-bar-right">
                    <button
                        className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
                        onClick={() => setShowForm(!showForm)}
                    >
                        {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> New Entry</>}
                    </button>
                </div>
            </div>

            {/* Inline Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="inline-form">
                    <div className="inline-form-title">Add New Entry</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Type</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value })}
                            >
                                <option value="RECEIVABLE">Receivable (Money In)</option>
                                <option value="PAYABLE">Payable (Money Out)</option>
                                <option value="INCOME">Income</option>
                                <option value="EXPENSE">Expense</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Counterparty</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Customer or vendor name"
                                value={formData.counterparty}
                                onChange={e => setFormData({ ...formData, counterparty: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Amount</label>
                            <input
                                type="number"
                                className="form-input"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                required
                                step="0.01"
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Transaction Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.transaction_date}
                                onChange={e => setFormData({ ...formData, transaction_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date (Optional)</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes (Optional)</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Additional notes"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            <Check size={16} /> Add Entry
                        </button>
                    </div>
                </form>
            )}

            {/* Table */}
            <div className="table-container">
                <div className="table-header-row" style={{
                    gridTemplateColumns: '90px 1fr 110px 110px 100px 70px',
                    gap: '12px'
                }}>
                    <span>Date</span>
                    <span>Counterparty</span>
                    <span>Type</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span>Status</span>
                    <span></span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>
                        Loading entries...
                    </div>
                ) : entries.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">No entries yet. Add your first entry above.</div>
                    </div>
                ) : (
                    entries.map(entry => (
                        <div
                            key={entry.id}
                            className={`table-row ${entry.isNew ? 'loading-row' : ''}`}
                            style={{ gridTemplateColumns: '90px 1fr 110px 110px 100px 70px', gap: '12px' }}
                        >
                            <span style={{ color: 'var(--gray-600)' }}>
                                {new Date(entry.transaction_date).toLocaleDateString()}
                            </span>
                            <span style={{ fontWeight: 500 }}>{entry.counterparty}</span>
                            <span style={{
                                color: entry.type === 'RECEIVABLE' || entry.type === 'INCOME'
                                    ? 'var(--success)' : 'var(--error)'
                            }}>
                                {entry.type}
                            </span>
                            <span style={{ textAlign: 'right', fontWeight: 600 }}>
                                {formatCurrency(Number(entry.amount))}
                            </span>
                            <span>{getStatusBadge(entry.status)}</span>
                            <span style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDelete(entry.id)}
                                    style={{ padding: '4px 8px' }}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
