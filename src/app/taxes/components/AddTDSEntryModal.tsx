'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface AddTDSEntryModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddTDSEntryModal({ onClose, onSuccess }: AddTDSEntryModalProps) {
    const [loading, setLoading] = useState(false);
    const { formatCurrency } = useSettings();
    const [formData, setFormData] = useState({
        vendor_name: '',
        invoice_reference: '',
        payment_date: new Date().toISOString().split('T')[0],
        payment_amount: '',
        tds_rate: '10.00' // Default 10%
    });

    const calculatedTDS = formData.payment_amount && formData.tds_rate
        ? (parseFloat(formData.payment_amount) * parseFloat(formData.tds_rate)) / 100
        : 0;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/tds', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Failed to create entry');

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to save. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 100,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
            <div style={{
                background: 'white', width: '500px',
                borderRadius: '12px', padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Record TDS Liability</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Vendor / Deductee</label>
                        <input
                            type="text" required placeholder="e.g. Agency Name"
                            value={formData.vendor_name}
                            onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Payment Date</label>
                            <input
                                type="date" required
                                value={formData.payment_date}
                                onChange={e => setFormData({ ...formData, payment_date: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Invoice Ref</label>
                            <input
                                type="text" placeholder="Optional"
                                value={formData.invoice_reference}
                                onChange={e => setFormData({ ...formData, invoice_reference: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Base Payment Amount</label>
                            <input
                                type="number" step="0.01" required placeholder="0.00"
                                value={formData.payment_amount}
                                onChange={e => setFormData({ ...formData, payment_amount: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>TDS Rate (%)</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.tds_rate}
                                onChange={e => setFormData({ ...formData, tds_rate: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div style={{
                        background: '#f3f4f6', padding: '12px', borderRadius: '8px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Calculated TDS Liability:</span>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#dc2626' }}>
                            {formatCurrency(calculatedTDS)}
                        </span>
                    </div>

                    <button disabled={loading} type="submit" style={{
                        marginTop: '12px', width: '100%', padding: '12px',
                        background: 'var(--brand-primary)', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Check size={18} /> {loading ? 'Saving...' : 'Record Liability'}
                    </button>
                </form>
            </div>
        </div>
    );
}
