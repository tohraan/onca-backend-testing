'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Edit2, Save, X } from 'lucide-react';

export default function InvoiceDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [invoice, setInvoice] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [formData, setFormData] = useState<any>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [params.id]);

    const fetchInvoice = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/invoices?id=${params.id}`);
            const data = await res.json();
            if (data.invoice) {
                setInvoice(data.invoice);
                setFormData(data.invoice);
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
            const res = await fetch(`/api/invoices?id=${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) throw new Error('Update failed');

            await fetchInvoice();
            setEditing(false);
        } catch (err) {
            console.error(err);
            alert('Failed to update invoice');
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!confirm(`Mark this invoice as ${newStatus}?`)) return;

        try {
            const res = await fetch(`/api/invoices?id=${params.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error('Update failed');
            await fetchInvoice();
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    if (loading) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Loading invoice...</div>;
    }

    if (!invoice) {
        return <div style={{ padding: '32px', textAlign: 'center' }}>Invoice not found.</div>;
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
                <ArrowLeft size={18} /> Back to Invoices
            </button>

            <div className="card" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: '700' }}>
                        Invoice Details
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
                                    onClick={() => { setEditing(false); setFormData(invoice); }}
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
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>TYPE</label>
                        <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                            {invoice.invoice_type === 'RECEIVABLE' ? 'Receivable (Money In)' : 'Payable (Money Out)'}
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>STATUS</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{invoice.status.replace('_', ' ')}</div>
                        ) : (
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            >
                                <option value="UNPAID">UNPAID</option>
                                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                                <option value="PAID">PAID</option>
                                <option value="OVERDUE">OVERDUE</option>
                            </select>
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>COUNTERPARTY</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{invoice.counterparty_name}</div>
                        ) : (
                            <input
                                type="text"
                                value={formData.counterparty_name}
                                onChange={e => setFormData({ ...formData, counterparty_name: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>INVOICE NUMBER</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{invoice.invoice_number || '—'}</div>
                        ) : (
                            <input
                                type="text"
                                value={formData.invoice_number || ''}
                                onChange={e => setFormData({ ...formData, invoice_number: e.target.value })}
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
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.amount)}
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
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>TAX AMOUNT</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(invoice.tax_amount || 0)}
                            </div>
                        ) : (
                            <input
                                type="number" step="0.01"
                                value={formData.tax_amount || 0}
                                onChange={e => setFormData({ ...formData, tax_amount: parseFloat(e.target.value) })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>INVOICE DATE</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(invoice.invoice_date).toLocaleDateString()}</div>
                        ) : (
                            <input
                                type="date"
                                value={formData.invoice_date}
                                onChange={e => setFormData({ ...formData, invoice_date: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>DUE DATE</label>
                        {!editing ? (
                            <div style={{ fontSize: '1rem', fontWeight: '600' }}>{new Date(invoice.due_date).toLocaleDateString()}</div>
                        ) : (
                            <input
                                type="date"
                                value={formData.due_date}
                                onChange={e => setFormData({ ...formData, due_date: e.target.value })}
                                style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        )}
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '6px' }}>NOTES</label>
                    {!editing ? (
                        <div style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>{invoice.notes || 'No notes'}</div>
                    ) : (
                        <textarea
                            value={formData.notes || ''}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            rows={4}
                            style={{ width: '100%', padding: '8px', border: '1px solid var(--border-primary)', borderRadius: '6px', resize: 'vertical' }}
                        />
                    )}
                </div>

                {!editing && invoice.status !== 'PAID' && (
                    <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '24px' }}>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '12px' }}>QUICK ACTIONS</label>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button
                                onClick={() => handleStatusChange('PAID')}
                                style={{
                                    padding: '10px 20px', background: '#16a34a', color: 'white',
                                    border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                }}
                            >
                                Mark as Paid
                            </button>
                            {invoice.status === 'UNPAID' && (
                                <button
                                    onClick={() => handleStatusChange('PARTIALLY_PAID')}
                                    style={{
                                        padding: '10px 20px', background: '#3b82f6', color: 'white',
                                        border: 'none', borderRadius: '6px', fontWeight: '600', cursor: 'pointer'
                                    }}
                                >
                                    Mark as Partially Paid
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
