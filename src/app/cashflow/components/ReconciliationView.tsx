'use client';

import { useState, useEffect } from 'react';
import { Link2, Check, X, AlertCircle } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

export function ReconciliationView({ refreshKey }: { refreshKey: number }) {
    const [summary, setSummary] = useState<any>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatCurrency } = useSettings();

    useEffect(() => {
        fetchData();
    }, [refreshKey]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [summaryRes, suggestionsRes] = await Promise.all([
                fetch('/api/reconciliation'),
                fetch('/api/reconciliation/suggestions')
            ]);

            const summaryData = await summaryRes.json();
            const suggestionsData = await suggestionsRes.json();

            setSummary(summaryData.summary);
            setSuggestions(suggestionsData.suggestions || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLink = async (transactionId: string, matchType: string, matchId: string) => {
        try {
            const res = await fetch('/api/reconciliation/link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    transaction_id: transactionId,
                    match_type: matchType,
                    match_id: matchId
                })
            });

            if (!res.ok) throw new Error('Link failed');

            // Refresh data
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to link transaction');
        }
    };

    const handleRejectSuggestion = (transactionId: string, matchId: string) => {
        // Remove suggestion from UI
        setSuggestions(prev => prev.filter(s => !(s.transaction_id === transactionId && s.match_id === matchId)));
    };

    if (loading) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Loading reconciliation data...</div>;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        BANK BALANCE
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        {formatCurrency(summary?.bankBalance || 0)}
                    </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        EXPECTED CASH
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#16a34a' }}>
                        {formatCurrency(summary?.expectedCash || 0)}
                    </div>
                </div>
                <div className="card" style={{ padding: '16px', borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        UNLINKED TRANSACTIONS
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                        {summary?.unlinkedCount || 0}
                    </div>
                </div>
                <div className="card" style={{ padding: '16px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                        OUTSTANDING ITEMS
                    </div>
                    <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                        {(summary?.outstandingTasksCount || 0) + (summary?.outstandingInvoicesCount || 0)}
                    </div>
                </div>
            </div>

            {/* Suggested Links */}
            {suggestions.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Link2 size={20} /> Suggested Links ({suggestions.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {suggestions.map((suggestion, idx) => (
                            <div key={idx} className="card" style={{ padding: '16px', borderLeft: `4px solid ${suggestion.confidence === 'HIGH' ? '#16a34a' : '#f59e0b'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            BANK TRANSACTION
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>
                                            {suggestion.transaction.description}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {new Date(suggestion.transaction.transaction_date).toLocaleDateString()} • {' '}
                                            {formatCurrency(suggestion.transaction.amount)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', margin: '0 16px' }}>→</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                                            {suggestion.match_type.toUpperCase()}
                                        </div>
                                        <div style={{ fontSize: '0.95rem', fontWeight: '600', marginBottom: '4px' }}>
                                            {suggestion.match_data.counterparty_name}
                                        </div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                            {formatCurrency(suggestion.match_data.amount)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <AlertCircle size={14} />
                                        {suggestion.reason} • Confidence: <strong>{suggestion.confidence}</strong>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleRejectSuggestion(suggestion.transaction_id, suggestion.match_id)}
                                            style={{
                                                padding: '6px 12px', background: 'white', border: '1px solid var(--border-primary)',
                                                borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
                                                fontSize: '0.8rem', fontWeight: '600'
                                            }}
                                        >
                                            <X size={14} /> Reject
                                        </button>
                                        <button
                                            onClick={() => handleApproveLink(suggestion.transaction_id, suggestion.match_type, suggestion.match_id)}
                                            style={{
                                                padding: '6px 12px', background: '#16a34a', color: 'white',
                                                border: 'none', borderRadius: '4px', cursor: 'pointer',
                                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem', fontWeight: '600'
                                            }}
                                        >
                                            <Check size={14} /> Approve Link
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {suggestions.length === 0 && (
                <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        No suggested links found. All transactions are either linked or don't match any outstanding tasks/invoices.
                    </div>
                </div>
            )}
        </div>
    );
}
