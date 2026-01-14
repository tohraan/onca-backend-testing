'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Check, X } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface Expense {
    id: string;
    expense_date: string;
    category: string;
    amount: number;
    vendor_name: string;
    status: string;
    notes?: string;
    isNew?: boolean;
}

export default function ExpensesPage() {
    const [activeFilter, setActiveFilter] = useState<'all' | 'month' | 'unreconciled'>('all');
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [stats, setStats] = useState({ totalMonth: 0, unreconciled: 0, total: 0 });
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { formatCurrency } = useSettings();

    const [formData, setFormData] = useState({
        expense_date: new Date().toISOString().split('T')[0],
        category: 'MISC',
        amount: '',
        vendor_name: '',
        notes: ''
    });

    useEffect(() => {
        fetchExpenses();
    }, [activeFilter]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expenses${activeFilter !== 'all' ? `?filter=${activeFilter}` : ''}`);
            const data = await res.json();
            if (data.expenses) {
                setExpenses(data.expenses);
            }
            fetchStats();
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const [monthRes, unreconciledRes, allRes] = await Promise.all([
                fetch('/api/expenses?filter=month'),
                fetch('/api/expenses?filter=unreconciled'),
                fetch('/api/expenses')
            ]);
            const monthData = await monthRes.json();
            const unreconciledData = await unreconciledRes.json();
            const allData = await allRes.json();

            setStats({
                totalMonth: (monthData.expenses || []).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0),
                unreconciled: (unreconciledData.expenses || []).length,
                total: (allData.expenses || []).reduce((sum: number, e: any) => sum + parseFloat(e.amount), 0)
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const tempId = `temp-${Date.now()}`;
        const optimisticExpense: Expense = {
            id: tempId,
            expense_date: formData.expense_date,
            category: formData.category,
            amount: parseFloat(formData.amount),
            vendor_name: formData.vendor_name,
            status: 'UNRECONCILED',
            notes: formData.notes,
            isNew: true
        };

        setExpenses(prev => [optimisticExpense, ...prev]);
        setFormData({
            expense_date: new Date().toISOString().split('T')[0],
            category: 'MISC',
            amount: '',
            vendor_name: '',
            notes: ''
        });
        setShowForm(false);

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    expense_date: formData.expense_date,
                    category: formData.category,
                    amount: parseFloat(formData.amount),
                    vendor_name: formData.vendor_name,
                    notes: formData.notes || null
                })
            });

            if (!res.ok) throw new Error('Failed to save expense');

            const data = await res.json();
            setExpenses(prev => prev.map(exp =>
                exp.id === tempId ? { ...data.expense, isNew: false } : exp
            ));
            fetchStats();
        } catch (err: any) {
            setExpenses(prev => prev.filter(exp => exp.id !== tempId));
            setError(err.message);
        }
    };

    const handleDelete = async (id: string) => {
        const expenseToDelete = expenses.find(exp => exp.id === id);
        setExpenses(prev => prev.filter(exp => exp.id !== id));

        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchStats();
        } catch (err) {
            if (expenseToDelete) {
                setExpenses(prev => [...prev, expenseToDelete]);
            }
            setError('Failed to delete expense');
        }
    };

    const categories = ['OFFICE', 'TRAVEL', 'SOFTWARE', 'MARKETING', 'UTILITIES', 'PAYROLL', 'MISC'];

    return (
        <div style={{ maxWidth: '100%' }}>
            <div className="page-header">
                <h1 className="page-title">Expenses</h1>
                <p className="page-subtitle">Track receipts, bills, and daily spending</p>
            </div>

            <div className="tabs">
                {[
                    { key: 'all', label: 'All' },
                    { key: 'month', label: 'This Month' },
                    { key: 'unreconciled', label: 'Unreconciled' }
                ].map(filter => (
                    <button
                        key={filter.key}
                        className={`tab ${activeFilter === filter.key ? 'active' : ''}`}
                        onClick={() => setActiveFilter(filter.key as any)}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="stat-box">
                    <div className="stat-label">Total All Time</div>
                    <div className="stat-value">{formatCurrency(stats.total)}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">This Month</div>
                    <div className="stat-value">{formatCurrency(stats.totalMonth)}</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Unreconciled</div>
                    <div className="stat-value" style={{ color: stats.unreconciled > 0 ? 'var(--warning)' : 'inherit' }}>
                        {stats.unreconciled}
                    </div>
                    <div className="stat-subtext">need review</div>
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
                <h2>Expense Records</h2>
                <button
                    className={`btn ${showForm ? 'btn-secondary' : 'btn-primary'}`}
                    onClick={() => setShowForm(!showForm)}
                >
                    {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Expense</>}
                </button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="inline-form">
                    <div className="inline-form-title">Add New Expense</div>
                    <div className="form-row">
                        <div className="form-group">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-input"
                                value={formData.expense_date}
                                onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Category</label>
                            <select
                                className="form-select"
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
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
                            <label className="form-label">Vendor</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Vendor name"
                                value={formData.vendor_name}
                                onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Notes</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Optional"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <div className="form-actions">
                        <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button type="submit" className="btn btn-primary"><Check size={16} /> Add Expense</button>
                    </div>
                </form>
            )}

            <div className="table-container">
                <div className="table-header-row" style={{ gridTemplateColumns: '90px 90px 1fr 110px 120px 70px', gap: '12px' }}>
                    <span>Date</span>
                    <span>Category</span>
                    <span>Vendor</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                    <span>Status</span>
                    <span></span>
                </div>

                {loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
                ) : expenses.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-text">No expenses found</div>
                    </div>
                ) : (
                    expenses.map(exp => (
                        <div
                            key={exp.id}
                            className={`table-row ${exp.isNew ? 'loading-row' : ''}`}
                            style={{ gridTemplateColumns: '90px 90px 1fr 110px 120px 70px', gap: '12px' }}
                        >
                            <span style={{ color: 'var(--gray-600)' }}>
                                {new Date(exp.expense_date).toLocaleDateString()}
                            </span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                color: 'var(--gray-600)'
                            }}>
                                {exp.category}
                            </span>
                            <span style={{ fontWeight: 500 }}>{exp.vendor_name}</span>
                            <span style={{ textAlign: 'right', fontWeight: 600 }}>
                                {formatCurrency(Number(exp.amount))}
                            </span>
                            <span>
                                <span className={`status-badge ${exp.status === 'RECONCILED' ? 'status-paid' : 'status-pending'
                                    }`}>
                                    {exp.status}
                                </span>
                            </span>
                            <span>
                                <button
                                    className="btn btn-sm btn-secondary"
                                    onClick={() => handleDelete(exp.id)}
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
