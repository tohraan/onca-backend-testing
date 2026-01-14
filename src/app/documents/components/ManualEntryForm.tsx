import React, { useState } from 'react';
import { X, Check } from 'lucide-react';

interface ManualEntryFormProps {
    onClose: () => void;
    onSuccess: () => void;
    pendingUploadId?: string | null;
}

export function ManualEntryForm({ onClose, onSuccess, pendingUploadId }: ManualEntryFormProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        type: 'INVOICE',
        category: 'PAYABLE',
        date: new Date().toISOString().split('T')[0],
        amount: '',
        vendor: '',
        notes: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch('/api/documents/manual', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    amount: parseFloat(formData.amount),
                    uploadId: pendingUploadId
                })
            });

            if (!res.ok) throw new Error('Failed to create entry');

            onSuccess();
        } catch (err) {
            console.error(err);
            alert('Failed to save manual entry');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0 }}>
                        {pendingUploadId ? 'Confirm Details' : 'Manual Entry'}
                    </h3>
                    {pendingUploadId && <span className="status-badge status-open">File Attached</span>}
                </div>
            </div>

            <form onSubmit={handleSubmit} className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                    <div className="form-group">
                        <label className="form-label">Category</label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="PAYABLE">Payable (Bill)</option>
                            <option value="RECEIVABLE">Receivable (Invoice)</option>
                            <option value="EXPENSE">Expense (Receipt)</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Type</label>
                        <select
                            name="type"
                            value={formData.type}
                            onChange={handleChange}
                            className="form-select"
                        >
                            <option value="INVOICE">Invoice</option>
                            <option value="RECEIPT">Receipt</option>
                            <option value="OTHER">Other</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Date</label>
                        <input
                            type="date"
                            name="date"
                            required
                            value={formData.date}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Amount</label>
                        <div style={{ position: 'relative' }}>
                            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-500)', fontSize: '13px' }}>₹</span>
                            <input
                                type="number"
                                step="0.01"
                                required
                                placeholder="0.00"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                className="form-input"
                                style={{ paddingLeft: '24px' }}
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Vendor / Entity</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Office Supplies Co."
                            name="vendor"
                            value={formData.vendor}
                            onChange={handleChange}
                            className="form-input"
                        />
                    </div>
                </div>

                <div className="form-group" style={{ marginBottom: '24px' }}>
                    <label className="form-label">Notes</label>
                    <textarea
                        rows={3}
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        className="form-input"
                        style={{ resize: 'vertical' }}
                    />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid var(--gray-200)', paddingTop: '16px' }}>
                    <button
                        type="button"
                        onClick={onClose}
                        className="btn btn-secondary"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <Check size={16} />
                        {loading ? 'Saving...' : 'Save Entry'}
                    </button>
                </div>
            </form>
        </div>
    );
}
