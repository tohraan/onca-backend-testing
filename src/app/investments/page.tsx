'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, AlertCircle } from 'lucide-react';
import { InvestmentTable } from './components/InvestmentTable';
import { useSettings } from '@/lib/context/SettingsContext';

export default function InvestmentsPage() {
    const [total, setTotal] = useState(0);
    const [refreshKey, setRefreshKey] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { formatCurrency } = useSettings();

    const [formData, setFormData] = useState({
        investment_type: 'EQUITY',
        amount: '',
        investment_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    useEffect(() => {
        fetchSummary();
    }, [refreshKey]);

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/investments');
            const data = await res.json();
            if (data.summary) setTotal(data.summary.total);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.amount || !formData.investment_date) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });

            if (!res.ok) throw new Error('Failed to create investment');

            // Reset form and refresh
            setFormData({
                investment_type: 'EQUITY',
                amount: '',
                investment_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setShowForm(false);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
            alert('Failed to create investment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%' }}>
            {/* MVP Notice */}
            <div style={{
                background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '8px',
                padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
            }}>
                <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                    <strong>MVP Placeholder:</strong> This is a manual tracking section for investments.
                    No calculations, returns, or bank linking are performed. Data is for reference only.
                </div>
            </div>

            <header>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    PORTFOLIO TRACKING
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    Investments
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Manual tracking for equity, fixed deposits, mutual funds, and other investments.
                </p>
            </header>

            {/* Summary Card */}
            <div className="card" style={{ padding: '24px', borderLeft: '4px solid var(--brand-primary)' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <TrendingUp size={14} /> TOTAL INVESTMENTS
                </div>
                <div style={{ fontSize: '2rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                    {formatCurrency(total)}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Manual entries only • No returns calculated
                </div>
            </div>

            {/* Inline Form Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>All Investments</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> {showForm ? 'Cancel' : 'Add Investment'}
                </button>
            </div>

            {/* Inline Add Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Type</label>
                            <select
                                value={formData.investment_type}
                                onChange={e => setFormData({ ...formData, investment_type: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            >
                                <option value="EQUITY">Equity</option>
                                <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                                <option value="MUTUAL_FUND">Mutual Fund</option>
                                <option value="OTHER">Other</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="50000"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: '0.75rem', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Date</label>
                            <input
                                type="date" required
                                value={formData.investment_date}
                                onChange={e => setFormData({ ...formData, investment_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes (optional)</label>
                            <input
                                type="text"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                placeholder="e.g. Company name, fund details..."
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="btn btn-primary"
                            style={{ height: '42px' }}
                        >
                            {submitting ? 'Saving...' : 'Add'}
                        </button>
                    </div>
                </form>
            )}

            {/* Investment Table */}
            <InvestmentTable refreshKey={refreshKey} />
        </div>
    );
}
