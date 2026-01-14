'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Bot, Send, User, Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/context/SettingsContext';

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export default function AIInsightsPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [initialized, setInitialized] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const { settings } = useSettings();

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Add welcome message on mount
    useEffect(() => {
        if (!initialized) {
            setInitialized(true);
            setMessages([{
                id: 'welcome',
                role: 'assistant',
                content: `Hello${settings.owner_name ? `, ${settings.owner_name}` : ''}! 👋 I'm ONCA's AI assistant. I have access to your financial data including accounts payable, receivables, invoices, expenses, TDS obligations, and investments.\n\nTry asking me:\n• "What is my total outstanding receivables?"\n• "How much do I owe in TDS this month?"\n• "Summarize my financial health"\n• "What invoices are overdue?"`,
                timestamp: new Date()
            }]);
        }
    }, [initialized, settings.owner_name]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: input.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await fetch('/api/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: userMessage.content,
                    history: messages.slice(-10).map(m => ({ role: m.role, content: m.content }))
                })
            });

            const data = await res.json();

            const assistantMessage: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || data.error || "I couldn't process that request.",
                timestamp: new Date()
            };

            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again.",
                timestamp: new Date()
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <div style={{ height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '100%' }}>
            <header>
                <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--brand-primary)', letterSpacing: '0.1em', marginBottom: '8px' }}>
                    FINANCIAL INTELLIGENCE
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.03em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    AI Insights <Sparkles size={20} color="var(--brand-primary)" />
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
                    Ask questions about your financial data in plain language.
                </p>
            </header>

            {/* Chat Messages */}
            <div style={{
                flex: 1,
                overflowY: 'auto',
                background: 'var(--bg-secondary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-primary)',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
            }}>
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
                        }}
                    >
                        {/* Avatar */}
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: msg.role === 'user' ? 'var(--brand-primary)' : 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            {msg.role === 'user' ? (
                                <User size={18} color="white" />
                            ) : (
                                <Bot size={18} color="white" />
                            )}
                        </div>

                        {/* Message Bubble */}
                        <div style={{
                            maxWidth: '70%',
                            padding: '14px 18px',
                            borderRadius: msg.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                            background: msg.role === 'user' ? 'var(--brand-primary)' : 'white',
                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            whiteSpace: 'pre-wrap'
                        }}>
                            {msg.content}
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {loading && (
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <div style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Bot size={18} color="white" />
                        </div>
                        <div style={{
                            padding: '14px 18px',
                            borderRadius: '20px 20px 20px 4px',
                            background: 'white',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            color: 'var(--text-secondary)'
                        }}>
                            <Loader2 size={16} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
                            <span style={{ fontSize: '0.85rem' }}>Analyzing your data...</span>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask about your finances..."
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '16px 56px 16px 20px',
                        borderRadius: '12px',
                        background: 'white',
                        border: '2px solid var(--border-primary)',
                        color: 'var(--text-primary)',
                        fontSize: '0.95rem',
                        outline: 'none',
                        transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => e.target.style.borderColor = 'var(--brand-primary)'}
                    onBlur={(e) => e.target.style.borderColor = 'var(--border-primary)'}
                />
                <button
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: input.trim() && !loading ? 'var(--brand-primary)' : 'var(--border-primary)',
                        padding: '10px',
                        borderRadius: '8px',
                        border: 'none',
                        cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s'
                    }}
                >
                    <Send size={18} color="white" />
                </button>
            </div>

            <style jsx>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
