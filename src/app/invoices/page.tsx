'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface Invoice {
    id: string;
    invoice_type: string;
    counterparty_name: string;
    amount: number;
    invoice_date: string;
    due_date: string;
    status: string;
    invoice_number?: string;
    isNew?: boolean;
}

export default function InvoicesPage() {
    const [activeTab, setActiveTab] = useState<'RECEIVABLE' | 'PAYABLE'>('RECEIVABLE');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [stats, setStats] = useState({ outstanding: 0, overdue: 0, paid: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { formatCurrency } = useSettings();

    const [formData, setFormData] = useState({
        counterparty_name: '',
        amount: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        invoice_number: '',
        notes: ''
    });

    useEffect(() => {
        fetchInvoices();
    }, [activeTab]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/invoices?type=${activeTab}`);
            const data = await res.json();
            if (data.invoices) {
                setInvoices(data.invoices);
                calculateStats(data.invoices);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (invoices: Invoice[]) => {
        const now = new Date();
        const outstanding = invoices
            .filter(inv => inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID')
            .reduce((sum, inv) => sum + Number(inv.amount), 0);
        const overdue = invoices.filter(inv => {
            const dueDate = new Date(inv.due_date);
            return (inv.status === 'UNPAID' || inv.status === 'PARTIALLY_PAID') && dueDate < now;
        }).length;
        const paid = invoices.filter(inv => inv.status === 'PAID').length;
        setStats({ outstanding, overdue, paid });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const tempId = `temp-${Date.now()}`;
        const optimisticInvoice: Invoice = {
            id: tempId,
            invoice_type: activeTab,
            counterparty_name: formData.counterparty_name,
            amount: parseFloat(formData.amount),
            invoice_date: formData.invoice_date,
            due_date: formData.due_date,
            status: 'UNPAID',
            invoice_number: formData.invoice_number,
            isNew: true
        };

        setInvoices(prev => [optimisticInvoice, ...prev]);
        setFormData({
            counterparty_name: '',
            amount: '',
            invoice_date: new Date().toISOString().split('T')[0],
            due_date: '',
            invoice_number: '',
            notes: ''
        });
        setShowForm(false);

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoice_type: activeTab,
                    counterparty_name: formData.counterparty_name,
                    amount: parseFloat(formData.amount),
                    invoice_date: formData.invoice_date,
                    due_date: formData.due_date,
                    invoice_number: formData.invoice_number || null,
                    notes: formData.notes || null
                })
            });

            if (!res.ok) throw new Error('Failed to save invoice');

            const data = await res.json();
            setInvoices(prev => prev.map(inv =>
                inv.id === tempId ? { ...data.invoice, isNew: false } : inv
            ));
            calculateStats([...invoices.filter(i => i.id !== tempId), data.invoice]);
        } catch (err: any) {
            setInvoices(prev => prev.filter(inv => inv.id !== tempId));
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        const invoiceToDelete = invoices.find(inv => inv.id === id);
        setInvoices(prev => prev.filter(inv => inv.id !== id));

        try {
            const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            calculateStats(invoices.filter(inv => inv.id !== id));
        } catch (err) {
            if (invoiceToDelete) {
                setInvoices(prev => [...prev, invoiceToDelete]);
            }
            setError('Failed to delete invoice');
        }
    };

    return (
        <div style={{ maxWidth: '100%' }}>
            <div className="page-header">
                <h1 className="page-title">Invoices</h1>
                <p className="page-subtitle">Track money you must pay and receive</p>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'RECEIVABLE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('RECEIVABLE')}
                >
                    Receivable (Money In)
                </button>
                <button
                    className={`tab ${activeTab === 'PAYABLE' ? 'active' : ''}`}
                    onClick={() => setActiveTab('PAYABLE')}
                >
                    Payable (Money Out)
                </button>
            </div>

            {/* Stats */}
            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-box">
                    <div className="stat-label">Outstanding</div>
                    <div className="stat-value">{formatCurrency(stats.outstanding)}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Overdue</div>
                    <div className="stat-value" style={{ color: stats.overdue > 0 ? 'var(--error)' : 'inherit' }}>
                        {stats.overdue}
                    </div>
                    <div className="stat-subtext">need attention</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Paid</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>{stats.paid}</div>
                    <div className="stat-subtext">completed</div>
                </div>
            </div>

            {error && (
                <div style={{
                    background: 'var(--error-bg)',
                    border: '1px solid #EF9A9A',
                    borderRadius: 'var(--radius)',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    color: 'var(--error)',
                    fontSize: '13px'
                }}>
                    {error}
                    <button onClick={() => setError(null)} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={16} color="var(--error)" />
                    </button>
                </div>
            )}

            <div className="action-bar">
                <h2>{activeTab === 'RECEIVABLE' ? 'Receivables' : 'Payables'}</h2>
                <button
                    className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Invoice</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="inline-form">
                    <div className="inline-form-title">Add New {activeTab === 'RECEIVABLE' ? 'Receivable' : 'Payable'}</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Customer/Vendor</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Name"
                                value={formData.counterparty_name}
                                onChange={e => setFormData({ ...formData, counterparty_name: e.target.value })}
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
                        <div className="form-group">
                            <label className="form-label">Invoice #</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Optional"
                                value={formData.invoice_number}
                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Invoice Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.invoice_date}
                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Due Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary"><Check size={16} /> Add Invoice</button>
                    </div>
                </form>
            )}

            <div className="table-container">
                <div className="table-header-row" style={{ gridTemplateColumns: '85px 1fr 90px 100px 100px 120px 70px', gap: '12px' }}>
                    <span>Date</span>
                    <span>Customer/Vendor</span>
                    <span>Invoice #</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span>Due Date</span>
                    <span>Status</span>
                    <span></span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
                ) : invoices.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">No invoices yet</div>
                    </div>
                ) : (
                    invoices.map(inv => (
                        <div
                            key={inv.id}
                            className={`table-row ${inv.isNew ? 'loading-row' : ''}`}
                            style={{ gridTemplateColumns: '85px 1fr 90px 100px 100px 120px 70px', gap: '12px' }}
                        >
                            <span style={{ color: 'var(--gray-600)' }}>
                                {new Date(inv.invoice_date).toLocaleDateString()}
                            </span>
                            <span style={{ fontWeight: 500 }}>{inv.counterparty_name}</span>
                            <span style={{ color: 'var(--gray-500)' }}>{inv.invoice_number || '-'}</span>
                            <span style={{ textAlign: 'right', fontWeight: 600 }}>
                                {formatCurrency(Number(inv.amount))}
                            </span>
                            <span style={{ color: 'var(--gray-600)' }}>
                                {new Date(inv.due_date).toLocaleDateString()}
                            </span>
                            <span>
                                <span className={`status-badge ${inv.status === 'PAID' ? 'status-paid' :
                                    inv.status === 'OVERDUE' ? 'status-overdue' : 'status-unpaid'
                                    }`}>
                                    {inv.status}
                                </span>
                            </span>
                            <span>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDelete(inv.id)}
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
