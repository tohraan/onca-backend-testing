'use client';

import { useState, useEffect } from 'react';
import { Trash2, AlertCircle } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface TDSEntry {
    id: string;
    vendor_name: string;
    payment_amount: number;
    tds_rate: number;
    tds_amount: number;
    due_date: string;
    status: 'PENDING' | 'PAID' | 'OVERDUE';
    invoice_reference?: string;
}

export function TDSTable({ refreshKey }: { refreshKey: number }) {
    const [entries, setEntries] = useState<TDSEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useSettings();

    useEffect(() => {
        fetchEntries();
    }, [refreshKey]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/tds');
            const data = await res.json();
            if (data.entries) setEntries(data.entries);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this TDS entry? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/tds?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchEntries();
        } catch (err) {
            console.error(err);
            alert('Failed to delete entry');
        }
    };

    const handleMarkPaid = async (id: string) => {
        if (!confirm('Mark this TDS obligation as PAID?')) return;

        try {
            const res = await fetch(`/api/tds?id=${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'PAID' })
            });
            if (!res.ok) throw new Error('Update failed');
            fetchEntries();
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
            default: return { bg: '#f3f4f6', text: '#374151' };
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Vendor</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Payment Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>TDS Rate</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>TDS Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Due Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading TDS entries...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No TDS obligations found.</td></tr>
                        ) : (
                            entries.map(entry => {
                                const statusColors = getStatusColor(entry.status);
                                const isOverdue = entry.status === 'OVERDUE';
                                return (
                                    <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-primary)', background: isOverdue ? '#fef2f2' : 'white' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {isOverdue && <AlertCircle size={16} color="#dc2626" />}
                                            {entry.vendor_name}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                                            {formatCurrency(entry.payment_amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center', fontWeight: '600' }}>
                                            {entry.tds_rate}%
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--brand-primary)' }}>
                                            {formatCurrency(entry.tds_amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{new Date(entry.due_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <span style={{
                                                fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                background: statusColors.bg, color: statusColors.text
                                            }}>
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                {entry.status !== 'PAID' && (
                                                    <button
                                                        onClick={() => handleMarkPaid(entry.id)}
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
                                                    onClick={() => handleDelete(entry.id)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc2626'
                                                    }}
                                                    title="Delete entry"
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
