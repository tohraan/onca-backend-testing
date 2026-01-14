'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';

interface UpdateCashModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export function UpdateCashModal({ onClose, onSuccess }: UpdateCashModalProps) {
    const [loading, setLoading] = useState(false);
    const [balance, setBalance] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/cash/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available_balance: parseFloat(balance) })
            });

            if (!res.ok) throw new Error('Failed to update balance');

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
                background: 'white', width: '400px',
                borderRadius: '12px', padding: '24px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Update Cash Position</h3>
                    <button onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '4px' }}>Total Available Cash</label>
                        <input
                            type="number" step="0.01" required placeholder="0.00"
                            value={balance}
                            onChange={e => setBalance(e.target.value)}
                            style={{ width: '100%', padding: '12px', fontSize: '1.2rem', fontWeight: '700', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                        />
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                            Verify your current bank balance and cash on hand. This will create a new snapshot.
                        </p>
                    </div>

                    <button disabled={loading} type="submit" style={{
                        marginTop: '12px', width: '100%', padding: '12px',
                        background: 'var(--brand-primary)', color: 'white',
                        border: 'none', borderRadius: '8px', fontWeight: '600',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                    }}>
                        <Check size={18} /> {loading ? 'Saving...' : 'Update Snapshot'}
                    </button>
                </form>
            </div>
        </div>
    );
}
