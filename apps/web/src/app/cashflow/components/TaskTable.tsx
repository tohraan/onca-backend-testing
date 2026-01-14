'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface FinancialTask {
    id: string;
    type: 'PAYABLE' | 'RECEIVABLE';
    counterparty_name: string;
    amount: number;
    expected_date: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'CANCELLED';
    notes?: string;
}

export function TaskTable({ type, refreshKey }: { type: 'PAYABLE' | 'RECEIVABLE', refreshKey: number }) {
    const [tasks, setTasks] = useState<FinancialTask[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useSettings();

    useEffect(() => {
        fetchTasks();
    }, [type, refreshKey]);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/financial-tasks?type=${type}`);
            const data = await res.json();
            if (data.tasks) setTasks(data.tasks);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this task? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/financial-tasks?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to delete task');
        }
    };

    const handleMarkPaid = async (id: string) => {
        if (!confirm('Mark this task as PAID?')) return;

        try {
            const res = await fetch(`/api/financial-tasks?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
            });
            if (!res.ok) throw new Error('Update failed');
            fetchTasks();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return { bg: '#dcfce7', text: '#166534' };
            case 'PENDING': return { bg: '#fef3c7', text: '#92400e' };
            case 'OVERDUE': return { bg: '#fee2e2', text: '#991b1b' };
            case 'CANCELLED': return { bg: '#f3f4f6', text: '#6b7280' };
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Counterparty</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Expected Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Notes</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading tasks...</td></tr>
                        ) : tasks.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No tasks found.</td></tr>
                        ) : (
                            tasks.map(task => {
                                const statusColors = getStatusColor(task.status);
                                const isOverdue = task.status === 'OVERDUE';
                                return (
                                    <tr key={task.id} style={{ borderBottom: '1px solid var(--border-primary)', background: isOverdue ? '#fef2f2' : 'white' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {isOverdue && <AlertCircle size={16} color="#dc2626" />}
                                            {task.counterparty_name}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                                            {formatCurrency(task.amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{new Date(task.expected_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                background: statusColors.bg, color: statusColors.text
                                            }}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {task.notes || '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {task.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => handleMarkPaid(task.id)}
                                                        style={{
                                                            padding: '6px 12px', background: '#16a34a', color: 'white',
                                                            border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: '600'
                                                        }}
                                                        title="Mark as paid"
                                                    >
                                                        PAID
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleDelete(task.id)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc2626'
                                                    }}
                                                    title="Delete task"
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
