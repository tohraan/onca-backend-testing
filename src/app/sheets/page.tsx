'use client';

import { useState, useEffect } from 'react';
import {
    Database,
    Plus,
    ExternalLink,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowRight,
    RefreshCw,
    FileSpreadsheet,
    Settings2,
    Copy,
    Search,
    ArrowLeft,
    ShieldCheck,
    Calendar,
    Hash,
    User,
    Tag,
    BookOpen,
    Sparkles
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SheetsPage() {
    const [sheetUrl, setSheetUrl] = useState('');
    const [sheetDescription, setSheetDescription] = useState('');
    const [connecting, setConnecting] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [standardizing, setStandardizing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeStep, setActiveStep] = useState(1);
    const [syncedTransactions, setSyncedTransactions] = useState<any[]>([]);

    // OAuth connection state
    const [connectionStatus, setConnectionStatus] = useState<any>(null);
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
    const [loadingSheets, setLoadingSheets] = useState(false);
    const [isTracker, setIsTracker] = useState(false);
    const [businessType, setBusinessType] = useState('service');
    const [orgConfig, setOrgConfig] = useState<any>(null);

    // AI Mapping State
    const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [isAILoading, setIsAILoading] = useState(false);
    const [spreadsheetSearch, setSpreadsheetSearch] = useState('');

    useEffect(() => {
        checkConnectionStatus();
        fetchOrgConfig();

        const params = new URLSearchParams(window.location.search);
        if (params.get('connected') === 'true') {
            checkConnectionStatus();
            loadSpreadsheets();
            window.history.replaceState({}, '', '/sheets');
        }
        if (params.get('error')) {
            setError(`Connection failed: ${params.get('error')}`);
            window.history.replaceState({}, '', '/sheets');
        }
    }, []);

    const checkConnectionStatus = async () => {
        try {
            const res = await fetch('/api/sheets/connection/status');
            const data = await res.json();
            setConnectionStatus(data);
            if (data.isConnected) {
                loadSpreadsheets();
            }
        } catch (err) {
            console.error('Failed to check connection status', err);
        } finally {
            setLoadingStatus(false);
        }
    };

    const fetchOrgConfig = async () => {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (profile?.org_id) {
                const { data: config } = await supabase
                    .from('organization_configs')
                    .select('*')
                    .eq('org_id', profile.org_id)
                    .single();

                if (config) {
                    setOrgConfig(config);
                    setBusinessType(config.business_type);
                }
            }
        }
    };

    const handleGoogleConnect = () => {
        window.location.href = '/api/sheets/oauth/initiate';
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect Google Sheets?')) return;
        try {
            await fetch('/api/sheets/connection/disconnect', { method: 'POST' });
            setConnectionStatus({ isConnected: false });
            setSpreadsheets([]);
        } catch (err) {
            setError('Failed to disconnect');
        }
    };

    const loadSpreadsheets = async () => {
        setLoadingSheets(true);
        setError(null);
        try {
            const res = await fetch('/api/sheets/list');
            const data = await res.json();
            if (res.ok && data.spreadsheets) {
                setSpreadsheets(data.spreadsheets);
            } else {
                setError(data.error || 'Failed to load spreadsheets');
            }
        } catch (err: any) {
            setError('Connection error: Could not reach the server.');
        } finally {
            setLoadingSheets(false);
        }
    };

    const proposeMapping = (headers: string[]) => {
        const proposed: Record<string, string> = {
            date: '',
            amount: '',
            description: '',
            category: ''
        };

        const headerLower = headers.map(h => h.toLowerCase().trim());
        const keywords: Record<string, string[]> = {
            date: ['date', 'time', 'period', 'day'],
            amount: ['amount', 'price', 'value', 'cost', 'total', 'amt'],
            description: ['description', 'desc', 'narration', 'particulars', 'entity', 'vendor'],
            category: ['category', 'type', 'head', 'label', 'tag']
        };

        Object.keys(proposed).forEach(key => {
            const match = headerLower.find(h => keywords[key].some(kw => h.includes(kw)));
            if (match) {
                proposed[key] = headers[headerLower.indexOf(match)];
            }
        });

        setColumnMapping(proposed);
    };

    const handleConnect = async (e: React.FormEvent) => {
        e.preventDefault();
        setConnecting(true);
        setError(null);
        setIsAILoading(true);

        try {
            const res = await fetch('/api/sheets/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: sheetUrl }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Failed to fetch sheet details');
                setConnecting(false);
                return;
            }

            setIsTracker(data.isMasterTracker || false);

            if (!data.isMasterTracker && data.sheets.length > 0) {
                const headRes = await fetch(`/api/sheets/headers?url=${encodeURIComponent(sheetUrl)}&sheet=${encodeURIComponent(data.sheets[0])}`);
                const headData = await headRes.json();
                if (headData.headers) {
                    setDetectedHeaders(headData.headers);
                    proposeMapping(headData.headers);
                }
            }

            setActiveStep(2);
        } catch (err: any) {
            setError(err.message || 'Failed to connect');
        } finally {
            setConnecting(false);
            setIsAILoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/transactions');
            const data = await res.json();
            if (data.success) {
                setSyncedTransactions(data.transactions);
            }
        } catch (err) {
            console.error('Failed to fetch transactions', err);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const res = await fetch('/api/sheets/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: sheetUrl,
                    mapping: isTracker ? null : columnMapping
                }),
            });
            const data = await res.json();
            if (res.ok) {
                await fetchTransactions();
                setActiveStep(3); // Shift to Ledger View
            } else {
                setError(data.error || 'Sync failed');
            }
        } catch (err: any) {
            setError(err.message || 'Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    const handleStandardize = async () => {
        setStandardizing(true);
        setError(null);
        try {
            const res = await fetch('/api/sheets/standardize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: sheetUrl,
                    mapping: isTracker ? null : columnMapping
                }),
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = "onca_standardized_financials.csv";
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to standardize');
            }
        } catch (err: any) {
            setError(err.message || 'Standardization failed');
        } finally {
            setStandardizing(false);
        }
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '60px' }}>
            {/* Page Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                <div>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-0.03em', margin: 0, color: 'var(--brand-primary)' }}>
                        Source Integration
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                        {activeStep === 3 ? 'Reviewing the Master Ledger for data integrity.' : 'Manage spreadsheets acting as your financial source of truth.'}
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{
                        padding: '6px 12px',
                        background: connectionStatus?.isConnected ? '#F0FDF4' : '#FFF1F2',
                        borderRadius: '100px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        border: `1px solid ${connectionStatus?.isConnected ? '#86EFAC' : '#FECACA'}`
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: connectionStatus?.isConnected ? '#22C55E' : '#EF4444' }}></div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', color: connectionStatus?.isConnected ? '#166534' : '#991B1B' }}>
                            {connectionStatus?.isConnected ? 'Google Linked' : 'Disconnected'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Stage */}
            {activeStep < 3 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '24px', alignItems: 'start' }}>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {/* Step-by-Step Sync Tool */}
                        <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ width: '32px', height: '32px', background: 'var(--bg-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Database size={18} color="var(--brand-primary)" />
                                </div>
                                <h3 style={{ fontSize: '1rem', fontWeight: '800', margin: 0 }}>Step {activeStep}: {activeStep === 1 ? 'Link Source' : 'Mapping Verification'}</h3>
                            </div>

                            <div style={{ padding: '24px' }}>
                                {activeStep === 1 ? (
                                    <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                            <div>
                                                <div style={{ marginBottom: '20px', padding: '16px', background: 'rgba(0, 103, 79, 0.03)', border: '1px solid var(--brand-primary)', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-primary)' }}>
                                                        <ShieldCheck color="var(--brand-primary)" size={20} />
                                                    </div>
                                                    <div>
                                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active DNA Profile</div>
                                                        <div style={{ fontWeight: '800', fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                                            {orgConfig?.business_type?.toUpperCase() || 'SERVICE'} MODE ACTIVE
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => window.location.href = '/onboarding/dna'}
                                                        style={{ marginLeft: 'auto', padding: '4px 8px', borderRadius: '6px', border: '1px solid var(--border-primary)', background: 'white', fontSize: '0.65rem', fontWeight: '700' }}
                                                    >
                                                        Edit DNA
                                                    </button>
                                                </div>
                                            </div>

                                            <div>
                                                <label style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-tertiary)', display: 'block', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                    Spreadsheet URL
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="https://docs.google.com/spreadsheets/d/..."
                                                    value={sheetUrl}
                                                    onChange={(e) => setSheetUrl(e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '12px 16px',
                                                        borderRadius: '12px',
                                                        border: '1px solid var(--border-primary)',
                                                        background: '#F9FAFB',
                                                        fontSize: '0.9rem',
                                                        outline: 'none'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={connecting || !sheetUrl}
                                            className="btn-primary"
                                            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                        >
                                            {connecting ? <RefreshCw className="animate-spin" size={18} /> : 'Process & Map Data'}
                                            {!connecting && <ArrowRight size={18} />}
                                        </button>
                                    </form>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        {isTracker ? (
                                            <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', padding: '16px', borderRadius: '12px', display: 'flex', gap: '12px' }}>
                                                <CheckCircle2 color="#166534" size={20} style={{ flexShrink: 0 }} />
                                                <div>
                                                    <h4 style={{ margin: '0 0 2px', color: '#166534', fontWeight: '800', fontSize: '0.9rem' }}>Verified Master Tracker</h4>
                                                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#15803D', lineHeight: '1.4' }}>
                                                        Recognized standard ledger format. Manual mapping skipped.
                                                    </p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', padding: '12px', background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '10px' }}>
                                                    <Sparkles size={16} color="#0369A1" />
                                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#0369A1' }}>AI Mapping Assistant</span>
                                                </div>

                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    {[
                                                        { label: 'Date', key: 'date' },
                                                        { label: 'Amount', key: 'amount' },
                                                        { label: 'Description', key: 'description' },
                                                        { label: 'Category', key: 'category' }
                                                    ].map(field => (
                                                        <div key={field.key} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 1.5fr', alignItems: 'center', gap: '16px', padding: '12px', background: '#F9FAFB', borderRadius: '10px' }}>
                                                            <span style={{ fontWeight: '700', fontSize: '0.8rem' }}>{field.label}</span>
                                                            <select
                                                                value={columnMapping[field.key]}
                                                                onChange={(e) => setColumnMapping({ ...columnMapping, [field.key]: e.target.value })}
                                                                style={{
                                                                    padding: '8px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid var(--border-primary)',
                                                                    background: 'white',
                                                                    fontSize: '0.8rem',
                                                                    fontWeight: '600'
                                                                }}
                                                            >
                                                                <option value="">Select column...</option>
                                                                {detectedHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                                                            </select>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {!isTracker && (
                                            <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(59, 130, 246, 0.03)', border: '1px solid #BFDBFE', borderRadius: '16px' }}>
                                                <div style={{ display: 'flex', gap: '12px' }}>
                                                    <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #BFDBFE' }}>
                                                        <FileSpreadsheet size={20} color="#2563EB" />
                                                    </div>
                                                    <div>
                                                        <h4 style={{ margin: '0 0 4px', fontSize: '0.9rem', fontWeight: '800', color: '#1E40AF' }}>Standardization Bridge</h4>
                                                        <p style={{ margin: 0, fontSize: '0.75rem', color: '#1E40AF', opacity: 0.8, lineHeight: '1.4' }}>
                                                            Onca can transform your existing transactions into our professional template. Download the standardized version to use going forward.
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={handleStandardize}
                                                    disabled={standardizing}
                                                    style={{ width: '100%', marginTop: '16px', padding: '10px', borderRadius: '10px', background: 'white', border: '1px solid #2563EB', color: '#2563EB', fontWeight: '800', fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                                >
                                                    {standardizing ? <RefreshCw className="animate-spin" size={14} /> : <Copy size={14} />}
                                                    {standardizing ? 'Generating...' : 'Download Standardized CSV'}
                                                </button>
                                            </div>
                                        )}

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button
                                                onClick={() => setActiveStep(1)}
                                                style={{
                                                    flex: 1,
                                                    padding: '12px',
                                                    borderRadius: '100px',
                                                    border: '1px solid var(--border-primary)',
                                                    fontWeight: '600',
                                                    fontSize: '0.85rem',
                                                    color: 'var(--text-secondary)'
                                                }}
                                            >
                                                Back
                                            </button>
                                            <button
                                                onClick={handleSync}
                                                disabled={syncing}
                                                className="btn-primary"
                                                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '0.85rem' }}
                                            >
                                                {syncing ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />}
                                                {syncing ? 'Syncing...' : 'Initialize Sync'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {error && (
                            <div style={{ display: 'flex', gap: '12px', padding: '16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#B91C1C' }}>
                                <AlertCircle size={20} />
                                <div style={{ fontSize: '0.85rem', fontWeight: '600' }}>{error}</div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar Area */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {!loadingStatus && connectionStatus?.isConnected && (
                            <div className="card" style={{ padding: '16px', border: '1px solid #86EFAC', background: 'white' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                    <div style={{ width: '36px', height: '36px', background: 'var(--brand-primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                        <Database size={18} />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Active Account</div>
                                        <div style={{ fontWeight: '700', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {connectionStatus.googleEmail}
                                        </div>
                                    </div>
                                </div>

                                {orgConfig?.last_sync_at && (
                                    <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--bg-primary)', borderRadius: '10px', border: '1px solid var(--border-primary)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-tertiary)' }}>LAST SYNC</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--brand-primary)' }}>
                                                {new Date(orgConfig.last_sync_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '700', color: 'var(--text-tertiary)' }}>LATEST ROWS</span>
                                            <span style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-primary)' }}>{orgConfig.last_row_count}</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={handleDisconnect}
                                    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #FCA5A5', color: '#B91C1C', fontWeight: '700', fontSize: '0.75rem', cursor: 'pointer', background: 'white' }}
                                >
                                    Disconnect
                                </button>
                            </div>
                        )}

                        {!loadingStatus && !connectionStatus?.isConnected && (
                            <div className="card" style={{ padding: '16px', border: '1px solid var(--border-primary)', background: '#F9FAFB' }}>
                                <h4 style={{ margin: '0 0 8px', fontSize: '0.85rem', fontWeight: '800' }}>Cloud Connector</h4>
                                <button
                                    onClick={handleGoogleConnect}
                                    className="btn-primary"
                                    style={{ width: '100%', background: 'white', color: '#374151', border: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontSize: '0.8rem' }}
                                >
                                    Connect Google Drive
                                </button>
                            </div>
                        )}

                        {connectionStatus?.isConnected && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <h4 style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Recent Sources</h4>
                                    <RefreshCw size={12} className={loadingSheets ? "animate-spin" : ""} style={{ cursor: 'pointer' }} onClick={loadSpreadsheets} />
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    {spreadsheets.slice(0, 5).map(sheet => (
                                        <button
                                            key={sheet.id}
                                            onClick={() => { setSheetUrl(sheet.url); setActiveStep(1); }}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                padding: '8px 12px',
                                                borderRadius: '100px',
                                                background: sheetUrl === sheet.url ? 'rgba(0, 103, 79, 0.05)' : 'white',
                                                border: `1px solid ${sheetUrl === sheet.url ? 'var(--brand-primary)' : 'var(--border-primary)'}`,
                                                width: '100%',
                                                textAlign: 'left'
                                            }}
                                        >
                                            <FileSpreadsheet size={14} color={sheetUrl === sheet.url ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                                            <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.75rem', fontWeight: '600' }}>{sheet.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Master Ledger Step 3 */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '16px 24px', borderRadius: '16px', border: '1px solid var(--border-primary)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '40px', height: '40px', background: 'rgba(0, 103, 79, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck color="var(--brand-primary)" size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>Master Journal Verified</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Normalized data has been committed to Truth.db</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                                onClick={() => setActiveStep(1)}
                                style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid var(--border-primary)', background: 'white', fontSize: '0.8rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <ArrowLeft size={14} /> Back to Sources
                            </button>
                            <button
                                onClick={() => window.location.href = '/'}
                                className="btn-primary"
                                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '800' }}
                            >
                                Go to Performance Dashboard
                            </button>
                        </div>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <BookOpen size={16} color="var(--brand-primary)" /> NORMALIZED LEDGER (AUDIT MODE)
                            </h3>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-tertiary)', fontWeight: '700' }}>
                                SHOWING {syncedTransactions.length} MOST RECENT ENTRIES
                            </div>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#F9FAFB', borderBottom: '1px solid var(--border-primary)' }}>
                                        {['ROW', 'DATE', 'DESCRIPTION', 'ENTITY', 'CATEGORY', 'AMOUNT', 'STATUS'].map(h => (
                                            <th key={h} style={{ padding: '12px 16px', fontSize: '0.65rem', fontWeight: '800', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {syncedTransactions.map((tx, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                            <td style={{ padding: '12px 16px', fontSize: '0.7rem', fontWeight: '800', color: 'var(--text-tertiary)' }}>#{tx.row_index}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: '700' }}>{tx.date}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.75rem' }}>{tx.description}</td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: '600' }}>{tx.entity}</td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '700', padding: '4px 8px', borderRadius: '6px', background: 'rgba(0,0,0,0.04)', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{tx.category || 'Uncategorized'}</span>
                                            </td>
                                            <td style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: '800', color: tx.type === 'expense' ? '#991B1B' : '#166534' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                    <div style={{ fontSize: '0.85rem' }}>{tx.type === 'expense' ? '-' : '+'}{tx.currency || 'INR'} {parseFloat(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                    {tx.source_currency && tx.source_currency !== tx.currency && (
                                                        <div style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontWeight: '600', marginTop: '2px' }}>
                                                            Original: {tx.source_currency} {parseFloat(tx.source_amount).toLocaleString()} (@{parseFloat(tx.exchange_rate).toFixed(4)})
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px 16px' }}>
                                                <span style={{ fontSize: '0.65rem', fontWeight: '800', color: '#166534', background: '#F0FDF4', padding: '4px 8px', borderRadius: '4px' }}>{tx.status?.toUpperCase()}</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
