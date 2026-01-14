'use client';

import { useState, useEffect } from 'react';
import { FileText, Receipt, Database, TrendingUp, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/lib/context/SettingsContext';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        receivables: 0,
        payables: 0,
        expensesThisMonth: 0,
        invoiceCount: 0,
        expenseCount: 0,
        recentEntries: [] as any[]
    });
    const [loading, setLoading] = useState(true);
    const { settings, formatCurrency } = useSettings();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [invoicesRes, ledgerRes, expensesRes] = await Promise.all([
                fetch('/api/invoices'),
                fetch('/api/ledger'),
                fetch('/api/expenses?filter=month')
            ]);

            const invoicesData = await invoicesRes.json();
            const ledgerData = await ledgerRes.json();
            const expensesData = await expensesRes.json();

            const invoiceReceivables = (invoicesData.invoices || [])
                .filter((inv: any) => inv.invoice_type === 'RECEIVABLE' && inv.status !== 'PAID')
                .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0);

            const invoicePayables = (invoicesData.invoices || [])
                .filter((inv: any) => inv.invoice_type === 'PAYABLE' && inv.status !== 'PAID')
                .reduce((sum: number, inv: any) => sum + parseFloat(inv.amount || 0), 0);

            const ledgerReceivables = (ledgerData.entries || [])
                .filter((e: any) => e.type === 'RECEIVABLE' && e.status !== 'PAID')
                .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

            const ledgerPayables = (ledgerData.entries || [])
                .filter((e: any) => e.type === 'PAYABLE' && e.status !== 'PAID')
                .reduce((sum: number, e: any) => sum + parseFloat(e.amount || 0), 0);

            const expensesThisMonth = (expensesData.expenses || [])
                .reduce((sum: number, exp: any) => sum + parseFloat(exp.amount || 0), 0);

            // Get recent entries for the activity table
            const recentInvoices = (invoicesData.invoices || []).slice(0, 5);

            setStats({
                receivables: invoiceReceivables + ledgerReceivables,
                payables: invoicePayables + ledgerPayables,
                expensesThisMonth,
                invoiceCount: (invoicesData.invoices || []).length,
                expenseCount: (expensesData.expenses || []).length,
                recentEntries: recentInvoices
            });
        } catch (err) {
            console.error('Dashboard data fetch error:', err);
        } finally {
            setLoading(false);
        }
    };

    const userName = settings.owner_name?.split(' ')[0] || 'User';
    const netPosition = stats.receivables - stats.payables;

    return (
        <div style={{ maxWidth: '100%' }}>
            {/* Header */}
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">
                    Welcome back, {userName}. Here's your financial overview.
                </p>
            </div>

            {/* Stats Grid */}
            <div className="stat-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px'
            }}>
                <div className="stat-box">
                    <div className="stat-label">Receivables</div>
                    <div className="stat-value" style={{ color: 'var(--success)' }}>
                        {loading ? '...' : formatCurrency(stats.receivables)}
                    </div>
                    <div className="stat-subtext">Money owed to you</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">Payables</div>
                    <div className="stat-value" style={{ color: 'var(--error)' }}>
                        {loading ? '...' : formatCurrency(stats.payables)}
                    </div>
                    <div className="stat-subtext">Money you owe</div>
                </div>
                <div className="stat-box">
                    <div className="stat-label">This Month</div>
                    <div className="stat-value">
                        {loading ? '...' : formatCurrency(stats.expensesThisMonth)}
                    </div>
                    <div className="stat-subtext">{stats.expenseCount} expenses</div>
                </div>
                <div className="stat-box" style={{
                    background: netPosition >= 0 ? 'var(--success-bg)' : 'var(--error-bg)',
                    borderColor: netPosition >= 0 ? '#A5D6A7' : '#EF9A9A'
                }}>
                    <div className="stat-label">Net Position</div>
                    <div className="stat-value" style={{
                        color: netPosition >= 0 ? 'var(--success)' : 'var(--error)'
                    }}>
                        {loading ? '...' : formatCurrency(Math.abs(netPosition))}
                    </div>
                    <div className="stat-subtext">
                        {netPosition >= 0 ? 'Net positive' : 'Net negative'}
                    </div>
                </div>
            </div>

            {/* Quick Links */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                <Link href="/invoices" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                background: 'var(--primary-light)',
                                borderRadius: 'var(--radius)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <FileText size={18} color="var(--primary)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>Invoices</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                    {stats.invoiceCount} tracked
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/expenses" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                background: 'var(--primary-light)',
                                borderRadius: 'var(--radius)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Receipt size={18} color="var(--primary)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>Expenses</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                    Daily spending
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/ledger" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ padding: '16px', cursor: 'pointer' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                                width: '36px', height: '36px',
                                background: 'var(--primary-light)',
                                borderRadius: 'var(--radius)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Database size={18} color="var(--primary)" />
                            </div>
                            <div>
                                <div style={{ fontWeight: 600, color: 'var(--gray-900)' }}>Ledger</div>
                                <div style={{ fontSize: '12px', color: 'var(--gray-500)' }}>
                                    Manual tracking
                                </div>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Recent Activity */}
            <div className="card">
                <div className="card-header">Recent Invoices</div>
                <div className="card-body" style={{ padding: 0 }}>
                    {stats.recentEntries.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-text">No recent activity</div>
                        </div>
                    ) : (
                        <div>
                            {stats.recentEntries.map((entry: any) => (
                                <div key={entry.id} className="table-row" style={{
                                    gridTemplateColumns: '100px 1fr 100px 100px',
                                    padding: '12px 16px'
                                }}>
                                    <span style={{ color: 'var(--gray-600)', fontSize: '13px' }}>
                                        {new Date(entry.invoice_date || entry.created_at).toLocaleDateString()}
                                    </span>
                                    <span style={{ fontWeight: 500 }}>{entry.counterparty_name}</span>
                                    <span style={{ textAlign: 'right', fontWeight: 600 }}>
                                        {formatCurrency(Number(entry.amount))}
                                    </span>
                                    <span>
                                        <span className={`status-badge ${entry.status === 'PAID' ? 'status-paid' :
                                            entry.status === 'OVERDUE' ? 'status-overdue' : 'status-unpaid'
                                            }`}>
                                            {entry.status}
                                        </span>
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
