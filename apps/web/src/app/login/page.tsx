'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const router = useRouter()
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        setLoading(true)
        setError(null)
        const { error: authError } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent',
                },
                scopes: 'https://www.googleapis.com/auth/spreadsheets.readonly',
            }
        })

        if (authError) {
            setError(authError.message)
            setLoading(false)
        }
    }

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-primary)',
            padding: '24px'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '440px', padding: '48px', position: 'relative', overflow: 'hidden', textAlign: 'center' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--brand-primary)' }}></div>

                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        background: 'var(--brand-primary)',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '800',
                        fontSize: '1.6rem',
                        margin: '0 auto 20px',
                        boxShadow: '0 8px 16px rgba(0, 103, 79, 0.15)'
                    }}>O</div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-primary)', letterSpacing: '-0.04em', fontWeight: '800' }}>
                        ONCA Finance
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '12px', fontSize: '1.05rem', lineHeight: '1.5' }}>
                        The AI-first financial operating system. <br />
                        Log in to access your organization.
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {error && (
                        <div style={{
                            padding: '12px', borderRadius: '10px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: 'var(--error)',
                            fontSize: '0.85rem', fontWeight: '500'
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleGoogleLogin}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '12px',
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid var(--border-primary)',
                            background: 'white',
                            color: 'var(--text-primary)',
                            fontWeight: '600',
                            fontSize: '1rem',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                        }}
                        onMouseOver={(e) => !loading && (e.currentTarget.style.background = '#f9f9f9')}
                        onMouseOut={(e) => !loading && (e.currentTarget.style.background = 'white')}
                    >
                        {loading ? (
                            <Loader2 size={20} className="animate-spin" />
                        ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                        )}
                        {loading ? 'Connecting...' : 'Continue with Google'}
                    </button>
                </div>

                <div style={{
                    marginTop: '48px', paddingTop: '24px', borderTop: '1px solid var(--border-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    color: 'var(--text-tertiary)', fontSize: '0.8rem'
                }}>
                    <ShieldCheck size={16} />
                    <span>SOC 2 Compliant Infrastructure</span>
                </div>
            </div>
        </div>
    )
}
