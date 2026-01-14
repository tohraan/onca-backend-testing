'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface AddTaskModalProps {
    defaultType: 'PAYABLE' | 'RECEIVABLE';
    onClose: () => void;
    onSuccess: () => void;
}

export function AddTaskModal({ defaultType, onClose, onSuccess }: AddTaskModalProps) {
    const [formData, setFormData] = useState({
        type: defaultType,
        counterparty_name: '',
        amount: '',
        expected_date: '',
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const res = await fetch('/api/financial-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount)
                })
            });

            if (!res.ok) throw new Error('Failed to create task');

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to create task. Please try again.');
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
                    <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                        Add {formData.type === 'PAYABLE' ? 'Payable' : 'Receivable'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Type</label>
                        <select
                            value={formData.type}
                            onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        >
                            <option value="PAYABLE">Payable (Money Out)</option>
                            <option value="RECEIVABLE">Receivable (Money In)</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Counterparty *</label>
                        <input
                            type="text" required
                            value={formData.counterparty_name}
                            onChange={e => setFormData({ ...formData, counterparty_name: e.target.value })}
                            placeholder="e.g. Client ABC or Vendor XYZ"
                            style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
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
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Expected Date *</label>
                            <input
                                type="date" required
                                value={formData.expected_date}
                                onChange={e => setFormData({ ...formData, expected_date: e.target.value })}
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
                            placeholder="e.g. Verbal agreement, invoice pending..."
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
                            {submitting ? 'Creating...' : 'Create Task'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
