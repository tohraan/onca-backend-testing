'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Building2,
    Bell,
    Globe,
    Mail,
    Phone,
    Save,
    CheckCircle2,
    AlertTriangle,
    FileText
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [activeSection, setActiveSection] = useState<'general' | 'alerts' | 'display' | 'contact'>('general');

    const [formData, setFormData] = useState({
        // General
        business_name: '',
        owner_name: '',
        business_type: 'service',

        // Display
        currency: 'INR',
        target_margin: 20,

        // Alerts
        alerts_enabled: false,
        alert_payable_threshold: 100000,
        alert_receivable_threshold: 100000,

        // Contact & Reports
        contact_email: '',
        contact_phone: '',
        report_email: '',
        report_frequency: 'WEEKLY'
    });

    const supabase = createClient();

    useEffect(() => {
        const fetchConfig = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from('profiles').select('org_id, email, full_name').eq('id', user.id).single();
                if (profile?.org_id) {
                    const { data: config } = await supabase.from('organization_configs').select('*').eq('org_id', profile.org_id).single();
                    if (config) {
                        setFormData({
                            business_name: config.business_name || '',
                            owner_name: config.owner_name || profile.full_name || '',
                            business_type: config.business_type || 'service',
                            currency: config.currency || 'INR',
                            target_margin: config.target_margin || 20,
                            alerts_enabled: config.alerts_enabled || false,
                            alert_payable_threshold: config.alert_payable_threshold || 100000,
                            alert_receivable_threshold: config.alert_receivable_threshold || 100000,
                            contact_email: config.contact_email || profile.email || '',
                            contact_phone: config.contact_phone || '',
                            report_email: config.report_email || profile.email || '',
                            report_frequency: config.report_frequency || 'WEEKLY'
                        });
                    } else {
                        // Set defaults from profile if no config exists
                        setFormData(prev => ({
                            ...prev,
                            owner_name: profile.full_name || '',
                            contact_email: profile.email || '',
                            report_email: profile.email || ''
                        }));
                    }
                }
            }
            setLoading(false);
        };
        fetchConfig();
    }, [supabase]);

    const handleSave = async () => {
        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Unauthorized');

            const { data: profile } = await supabase.from('profiles').select('org_id').eq('id', user.id).single();
            if (!profile?.org_id) throw new Error('No organization found');

            const { error } = await supabase.from('organization_configs').upsert({
                org_id: profile.org_id,
                ...formData,
                updated_at: new Date().toISOString()
            });

            if (error) throw error;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            alert(`Failed to save: ${err.message}`);
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-IN', { style: 'currency', currency: formData.currency }).format(value);
    };

    if (loading) return <div style={{ padding: '40px', color: 'var(--text-tertiary)' }}>Loading settings...</div>;

    const sections = [
        { id: 'general', label: 'General', icon: Building2 },
        { id: 'alerts', label: 'Alerts', icon: Bell },
        { id: 'display', label: 'Display', icon: Globe },
        { id: 'contact', label: 'Contact & Reports', icon: Mail }
    ];

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <header>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em' }}>Settings</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Manage your organization's profile and preferences.
                </p>
            </header>

            <div style={{ display: 'flex', gap: '24px' }}>
                {/* Sidebar Navigation */}
                <div style={{ width: '200px', flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {sections.map(section => (
                            <button
                                key={section.id}
                                onClick={() => setActiveSection(section.id as any)}
                                style={{
                                    padding: '12px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: activeSection === section.id ? 'var(--brand-primary)' : 'transparent',
                                    color: activeSection === section.id ? 'white' : 'var(--text-secondary)',
                                    fontWeight: '600',
                                    fontSize: '0.9rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    textAlign: 'left'
                                }}
                            >
                                <section.icon size={18} />
                                {section.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div style={{ flex: 1 }}>
                    <div className="card" style={{ padding: '32px' }}>

                        {/* General Section */}
                        {activeSection === 'general' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>General Information</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Basic details about your business.</p>
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Business Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.business_name}
                                            onChange={e => setFormData({ ...formData, business_name: e.target.value })}
                                            placeholder="e.g. Acme India Pvt Ltd"
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Your Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.owner_name}
                                            onChange={e => setFormData({ ...formData, owner_name: e.target.value })}
                                            placeholder="e.g. Rahul Sharma"
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                            }}
                                        />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Business Type
                                        </label>
                                        <select
                                            value={formData.business_type}
                                            onChange={e => setFormData({ ...formData, business_type: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                            }}
                                        >
                                            <option value="service">Service Business</option>
                                            <option value="saas">SaaS / Software</option>
                                            <option value="retail">Retail / E-commerce</option>
                                            <option value="manufacturing">Manufacturing</option>
                                            <option value="consulting">Consulting</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Alerts Section */}
                        {activeSection === 'alerts' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>Alert Settings</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Get notified when accounts exceed thresholds.</p>
                                </div>

                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '16px', background: '#f9fafb', borderRadius: '8px'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <Bell size={20} color="var(--brand-primary)" />
                                        <div>
                                            <div style={{ fontWeight: '600' }}>Enable Alerts</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Receive notifications for threshold breaches</div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setFormData({ ...formData, alerts_enabled: !formData.alerts_enabled })}
                                        style={{
                                            width: '50px', height: '28px', borderRadius: '14px',
                                            background: formData.alerts_enabled ? 'var(--brand-primary)' : '#d1d5db',
                                            border: 'none', cursor: 'pointer', position: 'relative',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <div style={{
                                            width: '22px', height: '22px', borderRadius: '50%',
                                            background: 'white', position: 'absolute', top: '3px',
                                            left: formData.alerts_enabled ? '25px' : '3px',
                                            transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                                        }} />
                                    </button>
                                </div>

                                {formData.alerts_enabled && (
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ padding: '20px', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <AlertTriangle size={16} color="#dc2626" />
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Payables Alert</span>
                                            </div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Alert when total payables exceed:
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.alert_payable_threshold}
                                                onChange={e => setFormData({ ...formData, alert_payable_threshold: parseFloat(e.target.value) || 0 })}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '6px',
                                                    border: '1px solid var(--border-primary)', fontSize: '0.9rem'
                                                }}
                                            />
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                                                {formatCurrency(formData.alert_payable_threshold)}
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', border: '1px solid var(--border-primary)', borderRadius: '8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                                                <AlertTriangle size={16} color="#16a34a" />
                                                <span style={{ fontWeight: '600', fontSize: '0.9rem' }}>Receivables Alert</span>
                                            </div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                                                Alert when total receivables exceed:
                                            </label>
                                            <input
                                                type="number"
                                                value={formData.alert_receivable_threshold}
                                                onChange={e => setFormData({ ...formData, alert_receivable_threshold: parseFloat(e.target.value) || 0 })}
                                                style={{
                                                    width: '100%', padding: '10px', borderRadius: '6px',
                                                    border: '1px solid var(--border-primary)', fontSize: '0.9rem'
                                                }}
                                            />
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '6px' }}>
                                                {formatCurrency(formData.alert_receivable_threshold)}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Display Section */}
                        {activeSection === 'display' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>Display Preferences</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Customize how data appears in ONCA.</p>
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                            Currency
                                        </label>
                                        <select
                                            value={formData.currency}
                                            onChange={e => setFormData({ ...formData, currency: e.target.value })}
                                            style={{
                                                width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                            }}
                                        >
                                            <option value="INR">🇮🇳 Indian Rupee (₹)</option>
                                            <option value="USD">🇺🇸 US Dollar ($)</option>
                                            <option value="AED">🇦🇪 UAE Dirham (AED)</option>
                                            <option value="GBP">🇬🇧 British Pound (£)</option>
                                            <option value="EUR">🇪🇺 Euro (€)</option>
                                            <option value="SGD">🇸🇬 Singapore Dollar (SGD)</option>
                                        </select>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                            All monetary values in ONCA will be displayed in this currency.
                                        </p>
                                    </div>

                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <label style={{ fontSize: '0.8rem', fontWeight: '600' }}>Target Gross Margin</label>
                                            <span style={{ fontWeight: '700', color: 'var(--brand-primary)', fontSize: '1.1rem' }}>
                                                {formData.target_margin}%
                                            </span>
                                        </div>
                                        <input
                                            type="range" min="5" max="95" step="5"
                                            value={formData.target_margin}
                                            onChange={e => setFormData({ ...formData, target_margin: parseInt(e.target.value) })}
                                            style={{ width: '100%', accentColor: 'var(--brand-primary)', cursor: 'pointer' }}
                                        />
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                                            ONCA will flag when your costs are eating into this margin.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Contact & Reports Section */}
                        {activeSection === 'contact' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0, marginBottom: '4px' }}>Contact & Reports</h3>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>Your contact info and automated report settings.</p>
                                </div>

                                <div style={{ display: 'grid', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <Mail size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                Email Address
                                            </label>
                                            <input
                                                type="email"
                                                value={formData.contact_email}
                                                onChange={e => setFormData({ ...formData, contact_email: e.target.value })}
                                                placeholder="you@company.com"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                    border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                <Phone size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                                                Phone Number
                                            </label>
                                            <input
                                                type="tel"
                                                value={formData.contact_phone}
                                                onChange={e => setFormData({ ...formData, contact_phone: e.target.value })}
                                                placeholder="+91 98765 43210"
                                                style={{
                                                    width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                    border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div style={{ borderTop: '1px solid var(--border-primary)', paddingTop: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <FileText size={18} color="var(--brand-primary)" />
                                            <span style={{ fontWeight: '600' }}>Automated Reports</span>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                    Send Reports To
                                                </label>
                                                <input
                                                    type="email"
                                                    value={formData.report_email}
                                                    onChange={e => setFormData({ ...formData, report_email: e.target.value })}
                                                    placeholder="reports@company.com"
                                                    style={{
                                                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                        border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', marginBottom: '8px' }}>
                                                    Frequency
                                                </label>
                                                <select
                                                    value={formData.report_frequency}
                                                    onChange={e => setFormData({ ...formData, report_frequency: e.target.value })}
                                                    style={{
                                                        width: '100%', padding: '12px 16px', borderRadius: '8px',
                                                        border: '1px solid var(--border-primary)', fontSize: '0.95rem'
                                                    }}
                                                >
                                                    <option value="DAILY">Daily</option>
                                                    <option value="WEEKLY">Weekly</option>
                                                    <option value="MONTHLY">Monthly</option>
                                                    <option value="NEVER">Never</option>
                                                </select>
                                            </div>
                                        </div>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '12px' }}>
                                            Financial summary reports will be sent to this email address.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Save Button */}
                        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid var(--border-primary)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px' }}>
                            {saved && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontSize: '0.85rem', fontWeight: '600' }}>
                                    <CheckCircle2 size={18} /> Settings Saved
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    background: 'var(--brand-primary)', color: 'white', border: 'none',
                                    padding: '12px 28px', borderRadius: '8px', fontWeight: '600', fontSize: '0.9rem',
                                    display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                    opacity: saving ? 0.7 : 1
                                }}
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
