'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface AddTDSModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddTDSModal({ onClose, onSuccess }: AddTDSModalProps) {
    const [formData, setFormData] = useState({
        vendor_name: '',
        invoice_reference: '',
        payment_date: '',
        payment_amount: '',
        tds_rate: '10',
        due_date: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const { formatCurrency } = useSettings();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create TDS entry. Please try again.');
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
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Add TDS Obligation</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Vendor Name *</label>
                        <input
                            type="text" required
                            value={formData.vendor_name}
                            onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                            placeholder="e.g. ABC Contractors"
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Invoice Reference (Optional)</label>
                        <input
                            type="text"
                            value={formData.invoice_reference}
                            onChange={e => setFormData({ ...formData, invoice_reference: e.target.value })}
                            placeholder="e.g. INV-2024-001"
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Payment Amount *</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.payment_amount}
                                onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                placeholder="10000.00"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>TDS Rate (%) *</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.tds_rate}
                                onChange={e => setFormData({ ...formData, tds_rate: e.target.value })}
                                placeholder="10.00"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Payment Date *</label>
                            <input
                                type="date" required
                                value={formData.payment_date}
                                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>TDS Due Date *</label>
                            <input
                                type="date" required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div style={{ background: '#f3f4f6', padding: '12px', borderRadius: '6px' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            CALCULATED TDS AMOUNT
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--brand-primary)' }}>
                            {formData.payment_amount && formData.tds_rate
                                ? formatCurrency(
                                    (parseFloat(formData.payment_amount) * parseFloat(formData.tds_rate)) / 100
                                )
                                : formatCurrency(0)
                            }
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
                            {submitting ? 'Creating...' : 'Create Obligation'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
