'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, ShieldCheck, ArrowRight, Zap, Database, Sparkles } from 'lucide-react'

export default function LandingPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      overflow: 'hidden'
    }}>
      {/* Background Grain/Effect */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: 'radial-gradient(circle at 50% 50%, rgba(0, 103, 79, 0.03) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: '800px' }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          background: 'rgba(0, 103, 79, 0.05)',
          borderRadius: '100px',
          border: '1px solid rgba(0, 103, 79, 0.1)',
          marginBottom: '32px',
          animation: 'fadeInUp 0.6s ease-out'
        }}>
          <Sparkles size={14} color="var(--brand-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            AI-First Financial OS
          </span>
        </div>

        <h1 style={{
          fontSize: '4.5rem',
          fontWeight: '900',
          lineHeight: '1.05',
          letterSpacing: '-0.05em',
          marginBottom: '24px',
          animation: 'fadeInUp 0.8s ease-out'
        }}>
          Financial control <br />
          <span style={{ color: 'var(--brand-primary)' }}>made for SME speed.</span>
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: 'var(--text-secondary)',
          lineHeight: '1.6',
          maxWidth: '600px',
          margin: '0 auto 48px',
          animation: 'fadeInUp 1s ease-out'
        }}>
          Connect your spreadsheets, automate your ledger, and get AI insights
          that actually help you grow. No manual entry, just pure intelligence.
        </p>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '24px',
          animation: 'fadeInUp 1.2s ease-out'
        }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              minWidth: '280px',
              padding: '16px 32px',
              borderRadius: '16px',
              background: 'var(--text-primary)',
              color: 'white',
              fontWeight: '700',
              fontSize: '1.1rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              border: 'none',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}
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
            {loading ? 'Initializing...' : 'Continue with Google'}
          </button>

          {error && (
            <p style={{ color: 'var(--error)', fontSize: '0.9rem', fontWeight: '600' }}>{error}</p>
          )}
        </div>

        {/* Features Row */}
        <div style={{
          marginTop: '80px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '40px',
          animation: 'fadeInUp 1.4s ease-out'
        }}>
          {[
            { icon: Database, title: 'Sheet Sync', desc: 'Auto-sync from Google Sheets' },
            { icon: Zap, title: 'Real-time', desc: 'Syncs detected as they happen' },
            { icon: ShieldCheck, title: 'Secure', desc: 'Full RLS isolation & encryption' }
          ].map((f, i) => (
            <div key={i} style={{ textAlign: 'left', padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border-primary)' }}>
              <div style={{ width: '40px', height: '40px', background: 'rgba(0, 103, 79, 0.05)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <f.icon size={20} color="var(--brand-primary)" />
              </div>
              <h3 style={{ fontSize: '0.95rem', fontWeight: '800', marginBottom: '8px' }}>{f.title}</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
    </div>
  )
}
