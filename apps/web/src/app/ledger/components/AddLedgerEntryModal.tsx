'use client';

import { useState } from 'react';
import { X, Check, ArrowRight, ArrowLeft } from 'lucide-react';

interface AddLedgerEntryModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function AddLedgerEntryModal({ onClose, onSuccess }: AddLedgerEntryModalProps) {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Direction & Timing
    const [direction, setDirection] = useState<'IN' | 'OUT'>('OUT');
    const [timing, setTiming] = useState<'NOW' | 'LATER'>('NOW');

    // Step 2: Details
    const [formData, setFormData] = useState({
        amount: '',
        counterparty: '',
        transaction_date: new Date().toISOString().split('T')[0],
        due_date: '',
        invoice_number: '',
        payment_mode: 'CASH',
        notes: ''
    });

    const isExpensive = direction === 'OUT' && timing === 'NOW';
    const isPayable = direction === 'OUT' && timing === 'LATER';
    const isIncome = direction === 'IN' && timing === 'NOW';
    const isReceivable = direction === 'IN' && timing === 'LATER';

    // Map to API Types
    const getApiType = () => {
        if (isExpensive) return 'EXPENSE';
        if (isPayable) return 'PAYABLE';
        if (isIncome) return 'INCOME';
        if (isReceivable) return 'RECEIVABLE';
        return 'PAYABLE';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                ...formData,
                type: getApiType()
            };

            const res = await fetch('/api/ledger', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
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
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>
                        {step === 1 ? 'New Transaction' :
                            isExpensive ? 'Log Expense' :
                                isPayable ? 'Log Payable' :
                                    isIncome ? 'Log Income' : 'Log Receivable'}
                    </h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                        {/* Direction */}
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Money Flow</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setDirection('OUT')}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '8px', border: '2px solid',
                                        borderColor: direction === 'OUT' ? '#dc2626' : '#e5e7eb',
                                        background: direction === 'OUT' ? '#fef2f2' : 'white',
                                        color: direction === 'OUT' ? '#dc2626' : 'var(--text-secondary)',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Money Out (Paid/Owe)
                                </button>
                                <button
                                    onClick={() => setDirection('IN')}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '8px', border: '2px solid',
                                        borderColor: direction === 'IN' ? '#16a34a' : '#e5e7eb',
                                        background: direction === 'IN' ? '#f0fdf4' : 'white',
                                        color: direction === 'IN' ? '#16a34a' : 'var(--text-secondary)',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Money In (Received/Due)
                                </button>
                            </div>
                        </div>

                        {/* Timing */}
                        <div>
                            <label style={{ display: 'block', fontWeight: '600', marginBottom: '8px', fontSize: '0.9rem' }}>Timing</label>
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    onClick={() => setTiming('NOW')}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '8px', border: '2px solid',
                                        borderColor: timing === 'NOW' ? 'var(--brand-primary)' : '#e5e7eb',
                                        background: timing === 'NOW' ? '#eff6ff' : 'white',
                                        color: timing === 'NOW' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Already Happened (Cash/Bank)
                                </button>
                                <button
                                    onClick={() => setTiming('LATER')}
                                    style={{
                                        flex: 1, padding: '16px', borderRadius: '8px', border: '2px solid',
                                        borderColor: timing === 'LATER' ? 'var(--brand-primary)' : '#e5e7eb',
                                        background: timing === 'LATER' ? '#eff6ff' : 'white',
                                        color: timing === 'LATER' ? 'var(--brand-primary)' : 'var(--text-secondary)',
                                        fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Will Happen (Invoice/Due)
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={() => setStep(2)}
                            style={{
                                padding: '12px', background: 'var(--brand-primary)', color: 'white',
                                border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            Next <ArrowRight size={16} />
                        </button>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', background: '#f9fafb', padding: '12px', borderRadius: '8px', fontSize: '0.85rem' }}>
                            <button type="button" onClick={() => setStep(1)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <ArrowLeft size={16} />
                            </button>
                            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                                {direction === 'OUT' ? 'Money Out' : 'Money In'} • {timing === 'NOW' ? 'Already Paid' : 'Due Later'}
                            </span>
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Counterparty (Who?)</label>
                            <input
                                type="text" required placeholder="e.g. Vendor Name, Client, Restaurant"
                                value={formData.counterparty}
                                onChange={e => setFormData({ ...formData, counterparty: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Amount</label>
                                <input
                                    type="number" step="0.01" required placeholder="0.00"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                                    autoFocus
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>
                                    {timing === 'NOW' ? 'Date Paid' : 'Due Date'}
                                </label>
                                <input
                                    type="date" required
                                    value={timing === 'NOW' ? formData.transaction_date : formData.due_date}
                                    onChange={e => timing === 'NOW' ? setFormData({ ...formData, transaction_date: e.target.value }) : setFormData({ ...formData, due_date: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                                />
                            </div>
                        </div>

                        {timing === 'NOW' && (
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Payment Mode</label>
                                <select
                                    value={formData.payment_mode}
                                    onChange={e => setFormData({ ...formData, payment_mode: e.target.value })}
                                    style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                                >
                                    <option value="CASH">Cash</option>
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="UPI">UPI</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Notes (Optional)</label>
                            <input
                                type="text" placeholder="e.g. For project X"
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>

                        <button disabled={loading} type="submit" style={{
                            marginTop: '12px', width: '100%', padding: '12px',
                            background: 'var(--brand-primary)', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                            <Check size={18} /> {loading ? 'Saving...' : 'Save Entry'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
