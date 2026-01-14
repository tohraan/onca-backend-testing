'use client';

import { useState, useEffect } from 'react';
import { Plus, TrendingUp, TrendingDown, DollarSign, RefreshCw, X } from 'lucide-react';
import { TaskTable } from './components/TaskTable';
import { ReconciliationView } from './components/ReconciliationView';
import { useSettings } from '@/lib/context/SettingsContext';

type TabType = 'POSITION' | 'PAYABLE' | 'RECEIVABLE' | 'RECONCILIATION';

interface CashFlowData {
    currentCash: number;
    lastUpdated: string;
    receivables: { total: number };
    payables: { total: number };
    projections: {
        optimistic: number;
        conservative: number;
    };
}

export default function CashflowPage() {
    const [activeTab, setActiveTab] = useState<TabType>('POSITION');
    const [showTaskForm, setShowTaskForm] = useState(false);
    const [showCashForm, setShowCashForm] = useState(false);
    const [cashFlowData, setCashFlowData] = useState<CashFlowData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const { formatCurrency } = useSettings();

    // Task form state
    const [taskFormData, setTaskFormData] = useState({
        type: 'PAYABLE' as 'PAYABLE' | 'RECEIVABLE',
        counterparty_name: '',
        amount: '',
        expected_date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Cash update form state
    const [cashBalance, setCashBalance] = useState('');

    useEffect(() => {
        fetchCashFlowData();
    }, [refreshKey]);

    useEffect(() => {
        // Update task type when tab changes
        if (activeTab === 'PAYABLE' || activeTab === 'RECEIVABLE') {
            setTaskFormData(prev => ({ ...prev, type: activeTab }));
        }
    }, [activeTab]);

    const fetchCashFlowData = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/cash/flow');
            const json = await res.json();
            if (!json.error) setCashFlowData(json);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleTaskSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskFormData.counterparty_name || !taskFormData.amount) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/financial-tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...taskFormData,
                    amount: parseFloat(taskFormData.amount)
                })
            });

            if (!res.ok) throw new Error('Failed to create task');

            // Reset and refresh
            setTaskFormData({
                type: activeTab as 'PAYABLE' | 'RECEIVABLE',
                counterparty_name: '',
                amount: '',
                expected_date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            setShowTaskForm(false);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
            alert('Failed to create task. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCashSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!cashBalance) return;

        setSubmitting(true);
        try {
            const res = await fetch('/api/cash/snapshot', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ available_balance: parseFloat(cashBalance) })
            });

            if (!res.ok) throw new Error('Failed to update balance');

            setCashBalance('');
            setShowCashForm(false);
            setRefreshKey(prev => prev + 1);
        } catch (err) {
            console.error(err);
            alert('Failed to save. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '100%' }}>
            <header>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    CASH COMMITMENTS & POSITION
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    Cash Flow
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Track cash position, expected payments, and receipts in one unified view.
                </p>
            </header>

            {/* Summary Cards */}
            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--gray-500)' }}>Loading...</div>
            ) : cashFlowData && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #dc2626' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingDown size={14} /> TOTAL PAYABLES
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#dc2626' }}>
                            {formatCurrency(cashFlowData.payables.total)}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '20px', borderLeft: '4px solid #16a34a' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={14} /> TOTAL RECEIVABLES
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#16a34a' }}>
                            {formatCurrency(cashFlowData.receivables.total)}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '20px', borderLeft: `4px solid ${cashFlowData.projections.optimistic >= 0 ? '#16a34a' : '#dc2626'}` }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <DollarSign size={14} /> NET POSITION
                        </div>
                        <div style={{ fontSize: '1.75rem', fontWeight: '800', color: cashFlowData.projections.optimistic >= 0 ? '#16a34a' : '#dc2626' }}>
                            {formatCurrency(cashFlowData.receivables.total - cashFlowData.payables.total)}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', borderBottom: '2px solid var(--border-primary)' }}>
                {(['POSITION', 'PAYABLE', 'RECEIVABLE', 'RECONCILIATION'] as TabType[]).map(tab => (
                    <button
                        key={tab}
                        onClick={() => { setActiveTab(tab); setShowTaskForm(false); setShowCashForm(false); }}
                        style={{
                            padding: '12px 24px', border: 'none', background: 'transparent',
                            fontWeight: '600', fontSize: '0.95rem',
                            color: activeTab === tab ? 'var(--brand-primary)' : 'var(--text-secondary)',
                            borderBottom: activeTab === tab ? '3px solid var(--brand-primary)' : 'none',
                            cursor: 'pointer', marginBottom: '-2px'
                        }}
                    >
                        {tab === 'POSITION' ? 'Cash Position' :
                            tab === 'PAYABLE' ? 'Payables (Money Out)' :
                                tab === 'RECEIVABLE' ? 'Receivables (Money In)' : 'Reconciliation'}
                    </button>
                ))}
            </div>

            {/* Action Button + Form for POSITION tab */}
            {activeTab === 'POSITION' && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowCashForm(!showCashForm)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {showCashForm ? <X size={18} /> : <RefreshCw size={18} />}
                            {showCashForm ? 'Cancel' : 'Update Balance'}
                        </button>
                    </div>

                    {/* Inline Cash Update Form */}
                    {showCashForm && (
                        <form onSubmit={handleCashSubmit} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Total Available Cash</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={cashBalance}
                                        onChange={e => setCashBalance(e.target.value)}
                                        placeholder="Enter your current bank balance + cash on hand"
                                        style={{ width: '100%', padding: '12px', fontSize: '1.1rem', fontWeight: '600', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                                    />
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px', margin: '4px 0 0 0' }}>
                                        This creates a new cash snapshot for tracking purposes.
                                    </p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ height: '50px', padding: '0 24px' }}
                                >
                                    {submitting ? 'Saving...' : 'Update Snapshot'}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Action Button + Form for PAYABLE/RECEIVABLE tabs */}
            {(activeTab === 'PAYABLE' || activeTab === 'RECEIVABLE') && (
                <>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            onClick={() => setShowTaskForm(!showTaskForm)}
                            className="btn btn-primary"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            {showTaskForm ? <X size={18} /> : <Plus size={18} />}
                            {showTaskForm ? 'Cancel' : `Add ${activeTab === 'PAYABLE' ? 'Payable' : 'Receivable'}`}
                        </button>
                    </div>

                    {/* Inline Task Form */}
                    {showTaskForm && (
                        <form onSubmit={handleTaskSubmit} className="card" style={{ padding: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr 1fr 2fr auto', gap: '12px', alignItems: 'end' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Type</label>
                                    <select
                                        value={taskFormData.type}
                                        onChange={e => setTaskFormData({ ...taskFormData, type: e.target.value as 'PAYABLE' | 'RECEIVABLE' })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                                    >
                                        <option value="PAYABLE">Payable</option>
                                        <option value="RECEIVABLE">Receivable</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Counterparty *</label>
                                    <input
                                        type="text" required
                                        value={taskFormData.counterparty_name}
                                        onChange={e => setTaskFormData({ ...taskFormData, counterparty_name: e.target.value })}
                                        placeholder="Client or Vendor name"
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Amount *</label>
                                    <input
                                        type="number" step="0.01" required
                                        value={taskFormData.amount}
                                        onChange={e => setTaskFormData({ ...taskFormData, amount: e.target.value })}
                                        placeholder="50000"
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Expected Date *</label>
                                    <input
                                        type="date" required
                                        value={taskFormData.expected_date}
                                        onChange={e => setTaskFormData({ ...taskFormData, expected_date: e.target.value })}
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '6px' }}>Notes (optional)</label>
                                    <input
                                        type="text"
                                        value={taskFormData.notes}
                                        onChange={e => setTaskFormData({ ...taskFormData, notes: e.target.value })}
                                        placeholder="e.g. Verbal agreement..."
                                        style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px', fontSize: '0.9rem' }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="btn btn-primary"
                                    style={{ height: '42px' }}
                                >
                                    {submitting ? 'Saving...' : 'Add'}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Conditional View */}
            {activeTab === 'POSITION' ? (
                !cashFlowData || loading ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading analysis...</div>
                ) : (
                    <>
                        {/* Current Position */}
                        <div className="card" style={{ padding: '32px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>Available Cash (Manual)</div>
                                    <div style={{ fontSize: '3rem', fontWeight: '700', letterSpacing: '-0.02em' }}>
                                        {formatCurrency(cashFlowData.currentCash)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '8px' }}>
                                        Last updated: {cashFlowData.lastUpdated ? new Date(cashFlowData.lastUpdated).toLocaleString() : 'Never'}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '0.85rem', opacity: 0.8, marginBottom: '8px' }}>Optimistic Projection</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '600', color: cashFlowData.projections.optimistic < 0 ? '#f87171' : '#4ade80' }}>
                                        {formatCurrency(cashFlowData.projections.optimistic)}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Cash + AR - AP</div>
                                </div>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div style={{ padding: '16px', background: '#f3f4f6', borderRadius: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
                            <strong>Note:</strong> Projections are estimates based on your ledger entries. They do not reflect live bank balances.
                        </div>
                    </>
                )
            ) : activeTab === 'RECONCILIATION' ? (
                <ReconciliationView refreshKey={refreshKey} />
            ) : (
                <TaskTable type={activeTab as 'PAYABLE' | 'RECEIVABLE'} refreshKey={refreshKey} />
            )}
        </div>
    );
}
