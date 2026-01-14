'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddInvestmentModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddInvestmentModal({ onClose, onSuccess }: AddInvestmentModalProps) {
    const [formData, setFormData] = useState({
        investment_type: 'EQUITY',
        amount: '',
        investment_date: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create investment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000
        }}>
            <div style={{
                background: 'white', borderRadius: '12px', width: '90%', maxWidth: '600px',
                maxHeight: '90vh', overflowY: 'auto', padding: '32px'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Add Investment</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Investment Type *</label>
                        <select
                            value={formData.investment_type}
                            onChange={e => setFormData({ ...formData, investment_type: e.target.value })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        >
                            <option value="EQUITY">Equity</option>
                            <option value="FIXED_DEPOSIT">Fixed Deposit</option>
                            <option value="MUTUAL_FUND">Mutual Fund</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Amount *</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="50000.00"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Investment Date *</label>
                            <input
                                type="date" required
                                value={formData.investment_date}
                                onChange={e => setFormData({ ...formData, investment_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Notes</label>
                        <textarea
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={3}
                            placeholder="e.g. Company name, fund details, maturity date..."
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', resize: 'vertical' }}
                        />
                    </div>

                    <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.75rem', color: '#1e40af' }}>
                            <strong>Note:</strong> This is a manual tracking entry. No calculations, returns, or bank linking will be performed.
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button
                            type="button" onClick={onClose}
                            style={{ padding: '10px 20px', background: 'white', border: '1px solid var(--border-primary)', borderRadius: '6px', cursor: 'pointer' }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit" disabled={submitting}
                            style={{
                                padding: '10px 20px', background: 'var(--brand-primary)', color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.7 : 1
                            }}
                        >
                            {submitting ? 'Creating...' : 'Add Investment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
