'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddInvoiceModalProps {
    defaultType: 'PAYABLE' | 'RECEIVABLE';
    onClose: () => void;
    onSuccess: () => void;
}

export function AddInvoiceModal({ defaultType, onClose, onSuccess }: AddInvoiceModalProps) {
    const [formData, setFormData] = useState({
        invoice_type: defaultType,
        counterparty_name: '',
        invoice_number: '',
        amount: '',
        tax_amount: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    tax_amount: formData.tax_amount ? parseFloat(formData.tax_amount) : 0,
                    source: 'MANUAL'
                })
            });

            if (!res.ok) throw new Error('Failed to create invoice');

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create invoice. Please try again.');
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
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Add Invoice</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Type</label>
                        <select
                            value={formData.invoice_type}
                            onChange={e => setFormData({ ...formData, invoice_type: e.target.value as any })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        >
                            <option value="RECEIVABLE">Receivable (Money In)</option>
                            <option value="PAYABLE">Payable (Money Out)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Counterparty Name *</label>
                        <input
                            type="text" required
                            value={formData.counterparty_name}
                            onChange={e => setFormData({ ...formData, counterparty_name: e.target.value })}
                            placeholder="e.g. Acme Corp"
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Invoice Number</label>
                            <input
                                type="text"
                                value={formData.invoice_number}
                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
                                placeholder="INV-001"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Amount *</label>
                            <input
                                type="number" step="0.01" required
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                placeholder="1000.00"
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Invoice Date *</label>
                            <input
                                type="date" required
                                value={formData.invoice_date}
                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Due Date *</label>
                            <input
                                type="date" required
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
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
                            placeholder="Optional notes..."
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', resize: 'vertical' }}
                        />
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
                            {submitting ? 'Creating...' : 'Create Invoice'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
