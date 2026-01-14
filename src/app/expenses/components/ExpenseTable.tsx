'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, FileText } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Expense {
    id: string;
    expense_date: string;
    amount: number;
    category: string;
    vendor_name: string;
    payment_method: string;
    status: 'UNRECONCILED' | 'RECONCILED';
    notes?: string;
}

export function ExpenseTable({ filter, refreshKey }: { filter: 'all' | 'month' | 'unreconciled', refreshKey: number }) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchExpenses();
    }, [filter, refreshKey]);

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const url = filter === 'all' ? '/api/expenses' : `/api/expenses?filter=${filter}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.expenses) setExpenses(data.expenses);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this expense? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchExpenses();
        } catch (err) {
            console.error(err);
            alert('Failed to delete expense');
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'OFFICE': return { bg: '#dbeafe', text: '#1e40af' };
            case 'TRAVEL': return { bg: '#fef3c7', text: '#92400e' };
            case 'SOFTWARE': return { bg: '#e0e7ff', text: '#4338ca' };
            case 'MARKETING': return { bg: '#fce7f3', text: '#9f1239' };
            case 'UTILITIES': return { bg: '#dcfce7', text: '#166534' };
            case 'MISC': return { bg: '#f3f4f6', text: '#374151' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Vendor</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Category</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Payment</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading expenses...</td></tr>
                        ) : expenses.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No expenses found.</td></tr>
                        ) : (
                            expenses.map(expense => {
                                const categoryColors = getCategoryColor(expense.category);
                                return (
                                    <tr key={expense.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <td style={{ padding: '12px 16px' }}>{new Date(expense.expense_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{expense.vendor_name}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(expense.amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                background: categoryColors.bg, color: categoryColors.text
                                            }}>
                                                {expense.category}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {expense.payment_method}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                background: expense.status === 'RECONCILED' ? '#dcfce7' : '#fef3c7',
                                                color: expense.status === 'RECONCILED' ? '#166534' : '#92400e'
                                            }}>
                                                {expense.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => router.push(`/expenses/${expense.id}`)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid var(--border-primary)',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                    }}
                                                    title="View details"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(expense.id)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc2626'
                                                    }}
                                                    title="Delete expense"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
