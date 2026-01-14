'use client';

import { useState, useEffect } from 'react';
import { Search, Edit2, Trash2 } from 'lucide-react';

interface LedgerEntry {
    id: string;
    type: 'PAYABLE' | 'RECEIVABLE' | 'EXPENSE' | 'INCOME';
    amount: number;
    counterparty: string;
    transaction_date: string;
    due_date?: string;
    payment_mode?: string;
    status: 'OPEN' | 'PAID' | 'PARTIAL' | 'OVERDUE';
}

export function LedgerTable() {
    const [activeTab, setActiveTab] = useState<'ALL' | 'PAYABLE' | 'RECEIVABLE'>('ALL');
    const [entries, setEntries] = useState<LedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchEntries();
    }, [activeTab]);

    const fetchEntries = async () => {
        setLoading(true);
        try {
            const url = activeTab === 'ALL' ? '/api/ledger' : `/api/ledger?type=${activeTab}`;
            const res = await fetch(url);
            const data = await res.json();
            if (data.entries) setEntries(data.entries);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/ledger?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchEntries(); // Refresh
        } catch (err) {
            console.error(err);
            alert('Failed to delete entry');
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'EXPENSE': return '#dc2626';
            case 'PAYABLE': return '#ea580c';
            case 'INCOME': return '#16a34a';
            case 'RECEIVABLE': return '#0891b2';
            default: return 'var(--text-primary)';
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'EXPENSE': return 'Expense';
            case 'PAYABLE': return 'Bill (Payable)';
            case 'INCOME': return 'Income';
            case 'RECEIVABLE': return 'Invoice (Receivable)';
            default: return type;
        }
    };

    return (
        <div style={{ background: 'white', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--border-primary)' }}>
                {['ALL', 'PAYABLE', 'RECEIVABLE'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        style={{
                            flex: 1, padding: '16px', border: 'none', background: activeTab === tab ? 'white' : '#f9fafb',
                            fontWeight: '600', color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '2px solid var(--brand-primary)' : 'none',
                            cursor: 'pointer', textTransform: 'capitalize'
                        }}
                    >
                        {tab === 'ALL' ? 'All Transactions' : tab === 'PAYABLE' ? 'Payables (Due)' : 'Receivables (Due)'}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Type</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Counterparty</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600' }}>Mode / Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading entries...</td></tr>
                        ) : entries.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No entries found.</td></tr>
                        ) : (
                            entries.map(entry => (
                                <tr key={entry.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                    <td style={{ padding: '12px 16px' }}>{new Date(entry.transaction_date).toLocaleDateString()}</td>
                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: getTypeColor(entry.type), fontSize: '0.8rem' }}>
                                        {getTypeLabel(entry.type)}
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>{entry.counterparty}</td>
                                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(entry.amount)}
                                    </td>
                                    <td style={{ padding: '12px 16px' }}>
                                        {entry.status === 'PAID' ? (
                                            <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                                                {entry.payment_mode || 'Settled'}
                                            </span>
                                        ) : (
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                                                background: '#fef3c7', color: '#92400e'
                                            }}>
                                                OPEN
                                            </span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                onClick={() => alert('Edit functionality coming soon')}
                                                style={{
                                                    padding: '6px', background: 'transparent', border: '1px solid var(--border-primary)',
                                                    borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                }}
                                                title="Edit entry"
                                            >
                                                <Edit2 size={14} />
                                            </button>
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
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
