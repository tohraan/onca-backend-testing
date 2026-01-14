'use client';

import { useState, useEffect } from 'react';
import { Plus, AlertCircle, Calendar, DollarSign, X } from 'lucide-react';
import { TDSTable } from './components/TDSTable';
import { useSettings } from '@/lib/context/SettingsContext';

export default function TaxesPage() {
    const [showForm, setShowForm] = useState(false);
    const [summary, setSummary] = useState({ totalPayableMonth: 0, overdueCount: 0, upcomingCount: 0 });
    const [refreshKey, setRefreshKey] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const { formatCurrency } = useSettings();

    const [formData, setFormData] = useState({
        vendor_name: '',
        invoice_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: '',
        tds_rate: '10',
        due_date: ''
    });

    useEffect(() => {
        fetchSummary();
    }, [refreshKey]);

    const fetchSummary = async () => {
        try {
            const res = await fetch('/api/tds/summary');
            const data = await res.json();
            if (data.summary) setSummary(data.summary);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.vendor_name || !formData.payment_amount) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/tds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    payment_amount: parseFloat(formData.payment_amount),
                    tds_rate: parseFloat(formData.tds_rate)
                })
            });

            if (!res.ok) throw new Error('Failed to create TDS entry');

            // Reset and refresh
            setFormData({
                vendor_name: '',
                invoice_reference: '',
                payment_date: new Date().toISOString().split('T')[0],
                payment_amount: '',
                tds_rate: '10',
                due_date: ''
            });
            setShowForm(false);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
            alert('Failed to create TDS entry. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const calculatedTDS = formData.payment_amount && formData.tds_rate
        ? (parseFloat(formData.payment_amount) * parseFloat(formData.tds_rate)) / 100
        : 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%' }}>
            {/* Disclaimer */}
            <div style={{
                background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '8px',
                padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
            }}>
                <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#92400e' }}>
                    <strong>Important:</strong> This is NOT a government portal. ONCA helps you track TDS obligations but does not file or submit taxes.
                    Always consult a tax professional for compliance.
                </div>
            </div>

            <header>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    TAX COMPLIANCE
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    TDS Tracking
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Track TDS obligations, due dates, and payment status.
                </p>
            </header>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--brand-primary)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <DollarSign size={14} /> TOTAL PAYABLE (THIS MONTH)
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--text-primary)' }}>
                        {formatCurrency(summary.totalPayableMonth)}
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <AlertCircle size={14} /> OVERDUE
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626' }}>
                        {summary.overdueCount}
                    </div>
                </div>

                <div className="card" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} /> UPCOMING (7 DAYS)
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#f59e0b' }}>
                        {summary.upcomingCount}
                    </div>
                </div>
            </div>

            {/* Section Header + Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>TDS Obligations</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    {showForm ? <X size={18} /> : <Plus size={18} />}
                    {showForm ? 'Cancel' : 'Add TDS Obligation'}
                </button>
            </div>

            {/* Inline Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Vendor *</label>
                            <input
                                type="text" required
                                value={formData.vendor_name}
                                onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                                placeholder="ABC Contractors"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Invoice Ref</label>
                            <input
                                type="text"
                                value={formData.invoice_reference}
                                onChange={e => setFormData({ ...formData, invoice_reference: e.target.value })}
                                placeholder="INV-001"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.payment_amount}
                                onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                placeholder="10000"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>TDS %</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.tds_rate}
                                onChange={e => setFormData({ ...formData, tds_rate: e.target.value })}
                                placeholder="10"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Due Date *</label>
                            <input
                                type="date" required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                            />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>TDS Amt</label>
                            <div style={{ padding: '10px', fontSize: '0.9rem', fontWeight: '700', color: 'var(--brand-primary)' }}>
                                {formatCurrency(calculatedTDS)}
                            </div>
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

            {/* TDS Table */}
            <TDSTable refreshKey={refreshKey} />
        </div>
    );
}
