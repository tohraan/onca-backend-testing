'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';

interface SettingsData {
    // General
    business_name: string;
    owner_name: string;
    business_type: string;

    // Display
    currency: string;
    target_margin: number;

    // Alerts
    alerts_enabled: boolean;
    alert_payable_threshold: number;
    alert_receivable_threshold: number;

    // Contact
    contact_email: string;
    contact_phone: string;
    report_email: string;
    report_frequency: string;
}

interface SettingsContextType {
    settings: SettingsData;
    loading: boolean;
    refreshSettings: () => Promise<void>;
    formatCurrency: (amount: number) => string;
    getCurrencySymbol: () => string;
}

const defaultSettings: SettingsData = {
    business_name: '',
    owner_name: '',
    business_type: 'service',
    currency: 'INR',
    target_margin: 20,
    alerts_enabled: false,
    alert_payable_threshold: 100000,
    alert_receivable_threshold: 100000,
    contact_email: '',
    contact_phone: '',
    report_email: '',
    report_frequency: 'WEEKLY'
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SettingsData>(defaultSettings);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const fetchSettings = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('org_id, email, full_name')
                .eq('id', user.id)
                .single();

            if (!profile?.org_id) {
                setLoading(false);
                return;
            }

            // Fetch organization name
            const { data: org } = await supabase
                .from('organizations')
                .select('name')
                .eq('id', profile.org_id)
                .single();

            // Fetch config
            const { data: config } = await supabase
                .from('organization_configs')
                .select('*')
                .eq('org_id', profile.org_id)
                .single();

            if (config) {
                setSettings({
                    business_name: config.business_name || org?.name || '',
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
                // Use defaults with org/profile data
                setSettings({
                    ...defaultSettings,
                    business_name: org?.name || '',
                    owner_name: profile.full_name || '',
                    contact_email: profile.email || '',
                    report_email: profile.email || ''
                });
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const getCurrencySymbol = (): string => {
        const symbols: Record<string, string> = {
            'INR': '₹',
            'USD': '$',
            'AED': 'AED',
            'GBP': '£',
            'EUR': '€',
            'SGD': 'S$'
        };
        return symbols[settings.currency] || settings.currency;
    };

    const formatCurrency = (amount: number): string => {
        const locales: Record<string, string> = {
            'INR': 'en-IN',
            'USD': 'en-US',
            'AED': 'en-AE',
            'GBP': 'en-GB',
            'EUR': 'de-DE',
            'SGD': 'en-SG'
        };

        return new Intl.NumberFormat(locales[settings.currency] || 'en-US', {
            style: 'currency',
            currency: settings.currency,
            minimumFractionDigits: 2
        }).format(amount);
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            loading,
            refreshSettings: fetchSettings,
            formatCurrency,
            getCurrencySymbol
        }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings(): SettingsContextType {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        // Return a default context for when provider is not available
        return {
            settings: defaultSettings,
            loading: false,
            refreshSettings: async () => { },
            formatCurrency: (amount: number) => new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR'
            }).format(amount),
            getCurrencySymbol: () => '₹'
        };
    }
    return context;
}
