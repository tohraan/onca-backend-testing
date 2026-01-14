'use client';

import { useState } from 'react';
import { FileText, Download, AlertCircle } from 'lucide-react';

export default function ReportsPage() {
    const [formData, setFormData] = useState({
        start_date: '',
        end_date: '',
        format: 'PDF'
    });
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState<any>(null);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        setGenerating(true);
        setReportData(null);

        try {
            const res = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to generate report');

            setReportData(data.report);
        } catch (err: any) {
            console.error(err);
            alert(err.message || 'Failed to generate report');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1200px' }}>
            {/* MVP Notice */}
            <div style={{
                background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '8px',
                padding: '16px', display: 'flex', alignItems: 'flex-start', gap: '12px'
            }}>
                <AlertCircle size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.85rem', color: '#1e40af' }}>
                    <strong>MVP Version:</strong> Reports show aggregated data only. PDF/Excel download functionality coming soon.
                </div>
            </div>

            <header>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    FINANCIAL REPORTING
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
                    Reports
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Generate financial reports from your ledger, invoices, expenses, and tax data.
                </p>
            </header>

            {/* Report Generation Form */}
            <div className="card" style={{ padding: '24px' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={20} /> Generate Report
                </h2>

                <form onSubmit={handleGenerate} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Start Date *</label>
                            <input
                                type="date" required
                                value={formData.start_date}
                                onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>End Date *</label>
                            <input
                                type="date" required
                                value={formData.end_date}
                                onChange={e => setFormData({ ...formData, end_date: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '6px' }}>Format *</label>
                            <select
                                value={formData.format}
                                onChange={e => setFormData({ ...formData, format: e.target.value })}
                                style={{ width: '100%', padding: '10px', border: '1px solid var(--border-primary)', borderRadius: '6px' }}
                            >
                                <option value="PDF">PDF</option>
                                <option value="EXCEL">Excel</option>
                            </select>
                        </div>
                    </div>

                    <button
                        type="submit" disabled={generating}
                        style={{
                            padding: '12px 24px', background: 'var(--brand-primary)', color: 'white',
                            border: 'none', borderRadius: '8px', fontWeight: '600', cursor: generating ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center',
                            opacity: generating ? 0.7 : 1
                        }}
                    >
                        <Download size={18} /> {generating ? 'Generating...' : 'Generate Report'}
                    </button>
                </form>
            </div>

            {/* Report Preview */}
            {reportData && (
                <div className="card" style={{ padding: '24px' }}>
                    <h2 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '20px' }}>Report Summary</h2>

                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Period: {new Date(reportData.period.start_date).toLocaleDateString()} - {new Date(reportData.period.end_date).toLocaleDateString()}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL INCOME</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.summary.totalIncome)}
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>TOTAL EXPENSES</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#dc2626' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.summary.totalExpenses)}
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>NET INCOME</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700', color: reportData.summary.netIncome >= 0 ? '#16a34a' : '#dc2626' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(reportData.summary.netIncome)}
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>RECEIVABLES</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.summary.totalReceivables)}
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>PAYABLES</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.summary.totalPayables)}
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                            <div style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>TDS PENDING</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>
                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(reportData.summary.totalTDS)}
                            </div>
                        </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '12px', background: '#eff6ff', borderRadius: '6px', fontSize: '0.85rem', color: '#1e40af' }}>
                        <strong>Note:</strong> This is a preview. PDF/Excel download functionality will be available in the next update.
                    </div>
                </div>
            )}
        </div>
    );
}
