'use client';

import { useState } from 'react';
import {
    Zap,
    ChevronRight,
    CheckCircle2,
    Briefcase,
    Globe,
    Target,
    Coins
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function OnboardingDNAPage() {
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        business_type: 'service',
        currency: 'INR',
        target_margin: 20
    });
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const supabase = createClient();
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not logged in');

            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id')
                .eq('id', user.id)
                .single();

            if (!profile?.org_id) throw new Error('Organization not found');

            const { error } = await supabase
                .from('organization_configs')
                .upsert({
                    org_id: profile.org_id,
                    ...formData
                });

            if (error) throw error;
            setSuccess(true);
        } catch (err: any) {
            alert("Setup failed. Please make sure you've run the 'Clean Slate' SQL in Supabase first!");
        } finally {
            setSaving(false);
        }
    };

    if (success) {
        return (
            <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                <div style={{ maxWidth: '400px', textAlign: 'center' }}>
                    <div style={{ width: '80px', height: '80px', background: 'var(--brand-primary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: 'white' }}>
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px' }}>Ready to Go!</h1>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>Your business profile is set up. Let's start syncing your data.</p>
                    <button onClick={() => window.location.href = '/sheets'} className="btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '12px', fontWeight: 700 }}>
                        Connect your Sheets
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ width: '100%', maxWidth: '440px' }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>Welcome!</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Let's set up your core business profile in 30 seconds.</p>
                </div>

                <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border-primary)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

                        {/* Business Type */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '16px', display: 'block' }}>What do you do?</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                {[
                                    { id: 'service', label: 'Service', icon: Briefcase },
                                    { id: 'saas', label: 'SaaS', icon: Zap },
                                    { id: 'retail', label: 'Retail', icon: Globe },
                                    { id: 'other', label: 'Other', icon: Target }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setFormData({ ...formData, business_type: t.id })}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '12px',
                                            border: `2px solid ${formData.business_type === t.id ? 'var(--brand-primary)' : '#f3f4f6'}`,
                                            background: formData.business_type === t.id ? 'rgba(0, 103, 79, 0.05)' : 'white',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '8px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <t.icon size={20} color={formData.business_type === t.id ? 'var(--brand-primary)' : 'var(--text-tertiary)'} />
                                        <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{t.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Currency */}
                        <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase', marginBottom: '8px', display: 'block' }}>Base Currency</label>
                            <select
                                value={formData.currency}
                                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-primary)', fontWeight: 600, outline: 'none' }}
                            >
                                <option value="INR">Indian Rupee (INR)</option>
                                <option value="USD">US Dollar (USD)</option>
                                <option value="AED">UAE Dirham (AED)</option>
                                <option value="GBP">British Pound (GBP)</option>
                            </select>
                        </div>

                        {/* Margin */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Target Margin</label>
                                <span style={{ fontWeight: 800, color: 'var(--brand-primary)' }}>{formData.target_margin}%</span>
                            </div>
                            <input
                                type="range" min="5" max="90" step="5"
                                value={formData.target_margin}
                                onChange={(e) => setFormData({ ...formData, target_margin: parseInt(e.target.value) })}
                                style={{ width: '100%', accentColor: 'var(--brand-primary)' }}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            disabled={saving}
                            onClick={handleSave}
                            style={{ padding: '16px', borderRadius: '12px', fontWeight: 700, marginTop: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                        >
                            {saving ? 'Saving...' : 'Finish Setup'}
                            {!saving && <ChevronRight size={18} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
