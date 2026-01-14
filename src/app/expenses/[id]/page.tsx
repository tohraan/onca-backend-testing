'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';

export default function ExpenseDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [expense, setExpense] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExpense();
    }, [params.id]);

    const fetchExpense = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/expenses?id=${params.id}`);
            const data = await res.json();
            if (data.expense) {
                setExpense(data.expense);
                setFormData(data.expense);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`/api/expenses?id=${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Update failed');

            await fetchExpense();
            setEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update expense');
        } finally {
            setSaving(false);
        }
    };

    const toggleReconciliation = async () => {
        const newStatus = expense.status === 'RECONCILED' ? 'UNRECONCILED' : 'RECONCILED';
        if (!confirm(`Mark this expense as ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/expenses?id=${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Update failed');
            await fetchExpense();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    if (loading) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Loading expense...</div>;
    }

    if (!expense) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Expense not found.</div>;
    }

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px' }}>
            <button
                onClick={() => router.back()}
                style={{
                    display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '24px'
                }}
            >
                <ArrowLeft size={18} /> Back to Expenses
            </button>

            <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>
                        Expense Details
                    </h1>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {!editing ? (
                            <button
                                onClick={() => setEditing(true)}
                                style={{
                                    padding: '8px 16px', background: 'white', border: '1px solid var(--border-primary)',
                                    borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                }}
                            >
                                <Edit2 size={16} /> Edit
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={() => { setEditing(false); setFormData(expense); }}
                                    style={{
                                        padding: '8px 16px', background: 'white', border: '1px solid var(--border-primary)',
                                        borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                                    }}
                                >
                                    <X size={16} /> Cancel
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        padding: '8px 16px', background: 'var(--brand-primary)', color: 'white',
                                        border: 'none', borderRadius: '6px', cursor: saving ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', gap: '6px', opacity: saving ? 0.7 : 1
                                    }}
                                >
                                    <Save size={16} /> {saving ? 'Saving...' : 'Save'}
                                </button>
                            </>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>VENDOR</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{expense.vendor_name}</div>
                        ) : (
                            <input
                                type="text"
                                value={formData.vendor_name}
                                onChange={e => setFormData({ ...formData, vendor_name: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>DATE</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(expense.expense_date).toLocaleDateString()}</div>
                        ) : (
                            <input
                                type="date"
                                value={formData.expense_date}
                                onChange={e => setFormData({ ...formData, expense_date: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>AMOUNT</label>
                        {!editing ? (
                            <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}
                            </div>
                        ) : (
                            <input
                                type="number" step="0.01"
                                value={formData.amount}
                                onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>STATUS</label>
                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>{expense.status}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>CATEGORY</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{expense.category}</div>
                        ) : (
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            >
                                <option value="OFFICE">OFFICE</option>
                                <option value="TRAVEL">TRAVEL</option>
                                <option value="SOFTWARE">SOFTWARE</option>
                                <option value="MARKETING">MARKETING</option>
                                <option value="UTILITIES">UTILITIES</option>
                                <option value="MISC">MISC</option>
                            </select>
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>PAYMENT METHOD</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{expense.payment_method}</div>
                        ) : (
                            <select
                                value={formData.payment_method}
                                onChange={e => setFormData({ ...formData, payment_method: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            >
                                <option value="CASH">CASH</option>
                                <option value="CARD">CARD</option>
                                <option value="BANK">BANK</option>
                                <option value="UNKNOWN">UNKNOWN</option>
                            </select>
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>NOTES</label>
                    {!editing ? (
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{expense.notes || 'No notes'}</div>
                    ) : (
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={4}
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px', resize: 'vertical' }}
                        />
                    )}
                </div>

                {!editing && (
                    <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>QUICK ACTIONS</label>
                        <button
                            onClick={toggleReconciliation}
                            style={{
                                padding: '10px 20px',
                                background: expense.status === 'RECONCILED' ? '#f59e0b' : '#16a34a',
                                color: 'white',
                                border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            {expense.status === 'RECONCILED' ? 'Mark as Unreconciled' : 'Mark as Reconciled'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
