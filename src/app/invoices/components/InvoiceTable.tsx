'use client';

import { useState, useEffect } from 'react';
import { Edit2, Trash2, FileText, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { DownloadPDFButton } from './InvoicePDFGenerator';

interface Invoice {
    id: string;
    invoice_type: 'PAYABLE' | 'RECEIVABLE';
    counterparty_name: string;
    invoice_number?: string;
    amount: number;
    tax_amount: number;
    invoice_date: string;
    due_date: string;
    status: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
    source: 'MANUAL' | 'OCR';
    notes?: string;
}

export function InvoiceTable({ type, refreshKey }: { type: 'PAYABLE' | 'RECEIVABLE', refreshKey: number }) {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        fetchInvoices();
    }, [type, refreshKey]);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/invoices?type=${type}`);
            const data = await res.json();
            if (data.invoices) setInvoices(data.invoices);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this invoice? This cannot be undone.')) return;

        try {
            const res = await fetch(`/api/invoices?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Delete failed');
            fetchInvoices();
        } catch (err) {
            console.error(err);
            alert('Failed to delete invoice');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PAID': return { bg: '#dcfce7', text: '#166534' };
            case 'UNPAID': return { bg: '#fef3c7', text: '#92400e' };
            case 'PARTIALLY_PAID': return { bg: '#dbeafe', text: '#1e40af' };
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
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Invoice #</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Counterparty</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'right' }}>Amount</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Invoice Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'left' }}>Due Date</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Status</th>
                            <th style={{ padding: '12px 16px', fontWeight: '600', textAlign: 'center' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading invoices...</td></tr>
                        ) : invoices.length === 0 ? (
                            <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-secondary)' }}>No invoices found.</td></tr>
                        ) : (
                            invoices.map(invoice => {
                                const statusColors = getStatusColor(invoice.status);
                                return (
                                    <tr key={invoice.id} style={{ borderBottom: '1px solid var(--border-primary)' }}>
                                        <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                                            {invoice.invoice_number || '—'}
                                        </td>
                                        <td style={{ padding: '12px 16px', fontWeight: '600' }}>{invoice.counterparty_name}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: '600' }}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
                                        </td>
                                        <td style={{ padding: '12px 16px' }}>{new Date(invoice.invoice_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px' }}>{new Date(invoice.due_date).toLocaleDateString()}</td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            {invoice.source === 'MANUAL' ? (
                                                <select
                                                    value={invoice.status}
                                                    onChange={async (e) => {
                                                        const newStatus = e.target.value;
                                                        try {
                                                            const res = await fetch(`/api/invoices?id=${invoice.id}`, {
                                                                method: 'PATCH',
                                                                headers: { 'Content-Type': 'application/json' },
                                                                body: JSON.stringify({ status: newStatus })
                                                            });
                                                            if (!res.ok) throw new Error('Update failed');
                                                            fetchInvoices(); // Refresh
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert('Failed to update status');
                                                        }
                                                    }}
                                                    style={{
                                                        fontSize: '0.7rem',
                                                        fontWeight: '700',
                                                        padding: '4px 10px',
                                                        borderRadius: '12px',
                                                        background: getStatusColor(invoice.status).bg,
                                                        color: getStatusColor(invoice.status).text,
                                                        border: 'none',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <option value="UNPAID">UNPAID</option>
                                                    <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                                                    <option value="PAID">PAID</option>
                                                    <option value="OVERDUE">OVERDUE</option>
                                                </select>
                                            ) : (
                                                <span style={{
                                                    fontSize: '0.7rem', fontWeight: '700', padding: '4px 10px', borderRadius: '12px',
                                                    background: getStatusColor(invoice.status).bg, color: getStatusColor(invoice.status).text
                                                }}>
                                                    {invoice.status.replace('_', ' ')}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                <DownloadPDFButton invoice={invoice} />
                                                <button
                                                    onClick={() => router.push(`/invoices/${invoice.id}`)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid var(--border-primary)',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center'
                                                    }}
                                                    title="View details"
                                                >
                                                    <FileText size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(invoice.id)}
                                                    style={{
                                                        padding: '6px', background: 'transparent', border: '1px solid #fecaca',
                                                        borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#dc2626'
                                                    }}
                                                    title="Delete invoice"
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
