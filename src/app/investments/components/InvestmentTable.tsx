'use client';

import { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface Investment {
    id: string;
    investment_type: string;
    amount: number;
    investment_date: string;
    notes?: string;
}

export function InvestmentTable({ refreshKey }: { refreshKey: number }) {
    const [investments, setInvestments] = useState<Investment[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useSettings();

    useEffect(() => {
        fetchInvestments();
    }, [refreshKey]);

    const fetchInvestments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/investments');
            const data = await res.json();
            if (data.investments) setInvestments(data.investments);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this investment? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/investments?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchInvestments();
        } catch (err) {
            console.error(err);
            alert('Failed to delete investment');
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            'EQUITY': 'Equity',
            'FIXED_DEPOSIT': 'Fixed Deposit',
            'MUTUAL_FUND': 'Mutual Fund',
            'OTHER': 'Other'
        };
        return labels[type] || type;
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, { bg: string, text: string }> = {
            'EQUITY': { bg: '#dbeafe', text: '#1e40af' },
            'FIXED_DEPOSIT': { bg: '#dcfce7', text: '#166534' },
            'MUTUAL_FUND': { bg: '#fef3c7', text: '#92400e' },
            'OTHER': { bg: '#f3f4f6', text: '#374151' }
        };
        return colors[type] || colors['OTHER'];
    };

    return (
        <div style={{ background: 'white', border: '1px solid var(--border-primary)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                    <thead style={{ background: '#f9fafb', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                        <tr>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Type</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Notes</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading investments...</td></tr>
                        ) : investments.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No investments found. Click "Add Investment" to get started.</td></tr>
                        ) : (
                            investments.map(investment => {
                                const typeColors = getTypeColor(investment.investment_type);
                                return (
                                    <tr key={investment.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <td style={{ padding: '12px 16px' }}>
                                            <span style={{
                                                fontSize: '0.75rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                background: typeColors.bg, color: typeColors.text
                                            }}>
                                                {getTypeLabel(investment.investment_type)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '700', color: 'var(--brand-primary)' }}>
                                            {formatCurrency(investment.amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{new Date(investment.investment_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {investment.notes || '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <button
                                                onClick={() => handleDelete(investment.id)}
                                                style={{
                                                    padding: '6px', background: 'transparent', border: '1px solid #fecaca',
                                                    borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                                                    color: '#dc2626', margin: '0 auto'
                                                }}
                                                title="Delete investment"
                                            >
                                                <Trash2 size={14} />
                                            </button>
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
