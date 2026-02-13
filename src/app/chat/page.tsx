'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
    Send,
    BookOpen,
    Loader2,
    ChevronRight,
    FileText,
    X,
    MessageSquare,
    Sparkles,
    Trash2,
    Plus,
    History,
    Menu,
    Zap,
    Search,
} from 'lucide-react';
import type { Citation } from '@/lib/supabase/types';
import { v4 as uuidv4 } from 'uuid';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    confidence?: string;
}

interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    selectedBookId?: string;
    updatedAt: number;
}

interface BookOption {
    id: string;
    title: string;
    subject: string;
    form: number;
}

export default function ChatPage() {
    const [sessions, setSessions] = useState<ChatSession[]>([]);
    const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState<BookOption[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('');
    const [showSources, setShowSources] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);
    const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [mode, setMode] = useState<'rag' | 'cag'>('rag');
    const activeSession = sessions.find(s => s.id === currentSessionId);
    const messages = activeSession?.messages || [];

    const startNewChat = (initialMsgs: Message[] = []) => {
        const id = uuidv4();
        const newSession: ChatSession = {
            id,
            title: 'New Chat',
            messages: initialMsgs,
            updatedAt: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(id);
        setSelectedBookId('');
        setInput('');
    };

    // Initial load: Migrate old data and load sessions
    useEffect(() => {
        const savedSessions = localStorage.getItem('necta_sessions');
        const oldHistory = localStorage.getItem('necta_chat_history');

        let initialSessions: ChatSession[] = [];

        if (savedSessions) {
            try {
                initialSessions = JSON.parse(savedSessions);
            } catch (e) {
                console.error('Failed to parse sessions', e);
            }
        } else if (oldHistory) {
            try {
                const msgs = JSON.parse(oldHistory);
                if (Array.isArray(msgs) && msgs.length > 0) {
                    const id = uuidv4();
                    const firstMsg = msgs.find((m: Message) => m.role === 'user')?.content || 'New Chat';
                    initialSessions = [{
                        id,
                        title: firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '...' : ''),
                        messages: msgs,
                        updatedAt: Date.now()
                    }];
                    localStorage.removeItem('necta_chat_history');
                }
            } catch (e) {
                console.error('Migration failed', e);
            }
        }

        if (initialSessions.length > 0) {
            setSessions(initialSessions);
            setCurrentSessionId(initialSessions[0].id);
            setSelectedBookId(initialSessions[0].selectedBookId || '');
        } else {
            startNewChat([]);
        }

        setIsLoaded(true);

        fetch('/api/books')
            .then((r) => r.json())
            .then((d) => setBooks(d.books || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('necta_sessions', JSON.stringify(sessions));
        }
    }, [sessions, isLoaded]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSessionId, sessions]);

    const deleteSession = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (confirm('Delete this chat history?')) {
            const updated = sessions.filter(s => s.id !== id);
            setSessions(updated);
            if (currentSessionId === id) {
                if (updated.length > 0) {
                    setCurrentSessionId(updated[0].id);
                } else {
                    startNewChat();
                }
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading || !currentSessionId) return;

        const question = input.trim();
        setInput('');

        const userMsg: Message = { role: 'user', content: question };
        const updatedMsgs = [...messages, userMsg];

        setSessions(prev => prev.map(s => s.id === currentSessionId ? {
            ...s,
            messages: updatedMsgs,
            title: s.title === 'New Chat' ? question.slice(0, 40) + (question.length > 40 ? '...' : '') : s.title,
            updatedAt: Date.now()
        } : s));

        setLoading(true);

        try {
            const history = messages.slice(-6).map(m => ({
                role: m.role,
                content: m.content
            }));

            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    history,
                    filters: selectedBookId ? { book_id: selectedBookId } : undefined,
                    mode,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                const errorMsg: Message = { role: 'assistant', content: `Error: ${data.error || 'Failed to get answer'}` };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s,
                    messages: [...s.messages, errorMsg],
                    updatedAt: Date.now()
                } : s));
            } else {
                const assistantMsg: Message = {
                    role: 'assistant',
                    content: data.answer,
                    citations: data.citations,
                    confidence: data.confidence,
                };
                setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                    ...s,
                    messages: [...s.messages, assistantMsg],
                    updatedAt: Date.now()
                } : s));
            }
        } catch {
            const errorMsg: Message = { role: 'assistant', content: 'Error: Network error. Please try again.' };
            setSessions(prev => prev.map(s => s.id === currentSessionId ? {
                ...s,
                messages: [...s.messages, errorMsg],
                updatedAt: Date.now()
            } : s));
        }

        setLoading(false);
    };

    const confidenceColor = (conf?: string) => {
        switch (conf) {
            case 'high': return 'text-green-600';
            case 'medium': return 'text-amber-600';
            case 'low': return 'text-red-500';
            default: return 'text-[var(--muted-foreground)]';
        }
    };

    const renderContentWithFootnotes = (content: string) => {
        const parts = content.split(/(\[\d+(?:,\s*\d+)*\])/g);
        return (
            <div className="whitespace-pre-wrap">
                {parts.map((part, idx) => {
                    const match = part.match(/^\[(\d+(?:,\s*\d+)*)\]$/);
                    if (match) {
                        return (
                            <sup
                                key={idx}
                                className="text-[var(--primary)] font-semibold text-[0.65em] cursor-default hover:text-[var(--accent-blue)] transition-colors"
                                title={`Source ${match[1]}`}
                            >
                                [{match[1]}]
                            </sup>
                        );
                    }
                    return <span key={idx}>{part}</span>;
                })}
            </div>
        );
    };

    const getUsedFootnoteNumbers = (content: string): Set<number> => {
        const matches = content.matchAll(/\[(\d+)\]/g);
        const nums = new Set<number>();
        for (const m of matches) {
            nums.add(parseInt(m[1], 10));
        }
        return nums;
    };

    return (
        <div className="flex h-screen bg-[var(--background)] overflow-hidden">
            {/* Mobile sidebar overlay */}
            {showSidebar && (
                <div
                    className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setShowSidebar(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 w-72 border-r border-[var(--border)] bg-[var(--card)] flex flex-col z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden'}`}>
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <button
                        onClick={() => startNewChat()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 gradient-btn rounded-xl text-sm font-medium text-white hover:opacity-90 transition-all shadow-md"
                    >
                        <Plus className="w-4 h-4" />
                        New Chat
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                    <div className="px-3 py-2 text-[10px] uppercase tracking-wider font-bold text-[var(--muted-foreground)]">Recent Chats</div>
                    {sessions.map((s) => (
                        <div
                            key={s.id}
                            onClick={() => setCurrentSessionId(s.id)}
                            className={`group flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all ${s.id === currentSessionId
                                ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 text-[var(--foreground)]'
                                : 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                                }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${s.id === currentSessionId ? 'text-[var(--primary)]' : 'text-[var(--muted-foreground)]'}`} />
                                <span className="text-sm truncate font-medium">{s.title}</span>
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, s.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="border-b border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-lg px-4 md:px-6 py-3 md:py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 -ml-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <Link href="/" className="flex items-center gap-3 group transition-all">
                            <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center group-hover:scale-110 transition-transform shadow-md">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="hidden sm:block">
                                <h1 className="font-bold text-base leading-tight text-[var(--foreground)]">NECTA Textbook Chat</h1>
                                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">Ask anything</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-2 md:gap-3">
                        {/* RAG / CAG Toggle */}
                        <div className="flex items-center bg-[var(--muted)] rounded-xl p-1 border border-[var(--border)]">
                            <button
                                onClick={() => setMode('rag')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'rag'
                                    ? 'gradient-btn text-white shadow-md'
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                <Search className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">RAG</span>
                            </button>
                            <button
                                onClick={() => {
                                    setMode('cag');
                                    if (!selectedBookId && books.length > 0) {
                                        const bid = books[0].id;
                                        setSelectedBookId(bid);
                                        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, selectedBookId: bid } : s));
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'cag'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                                    : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                                    }`}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">CAG</span>
                            </button>
                        </div>

                        <select
                            value={selectedBookId}
                            onChange={(e) => {
                                const bid = e.target.value;
                                setSelectedBookId(bid);
                                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, selectedBookId: bid } : s));
                            }}
                            className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-sm focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 max-w-[120px] md:max-w-none"
                        >
                            {mode === 'cag' ? null : <option value="">All Books</option>}
                            {books.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title} (Form {b.form})
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* CAG Mode Banner */}
                {mode === 'cag' && (
                    <div className="px-6 py-2.5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                            Full Textbook Mode — Entire book loaded into context
                        </span>
                    </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-[var(--background)]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-4">
                            <div className="w-24 h-24 rounded-3xl gradient-tz opacity-20 flex items-center justify-center mb-8 animate-float">
                                <Sparkles className="w-10 h-10 text-white" />
                            </div>
                            <h2 className="text-2xl md:text-3xl font-bold mb-4 gradient-text">Ask a Textbook Question</h2>
                            <p className="text-[var(--muted-foreground)] text-base md:text-lg mb-10 leading-relaxed">
                                Our AI tutor will search through the NECTA curriculum to give you precise answers with citations.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 w-full">
                                {[
                                    'What is geographic research?',
                                    'Explain the formation of fold mountains',
                                    'What are the types of rainfall?',
                                    'Define the term "ecosystem"',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="px-5 py-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] text-sm text-left hover:border-[var(--primary)]/40 hover:shadow-md transition-all hover:-translate-y-0.5 active:scale-[0.98]"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="max-w-4xl mx-auto space-y-8">
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex gap-3 md:gap-6 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-btn flex items-center justify-center flex-shrink-0 mt-1 shadow-md">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user'
                                        ? 'bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-3xl rounded-br-md px-5 md:px-6 py-4 shadow-sm text-[var(--foreground)]'
                                        : 'glass rounded-3xl rounded-bl-md px-5 md:px-6 py-5 shadow-md'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="text-sm md:text-base leading-relaxed text-[var(--foreground)]">
                                            {renderContentWithFootnotes(msg.content)}

                                            {msg.citations && msg.citations.length > 0 && (() => {
                                                const usedRefs = getUsedFootnoteNumbers(msg.content);
                                                const footnotes = msg.citations
                                                    .map((c, idx) => ({ ...c, num: idx + 1 }))
                                                    .filter(c => usedRefs.has(c.num));
                                                if (footnotes.length === 0) return null;
                                                return (
                                                    <div className="mt-6 pt-4 border-t border-[var(--border)]">
                                                        <p className="text-xs font-bold text-[var(--muted-foreground)] mb-3 uppercase tracking-wider">References</p>
                                                        <div className="space-y-2">
                                                            {footnotes.map((c) => (
                                                                <p key={c.num} className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                                                                    <span className="text-[var(--primary)] font-bold mr-2">[{c.num}]</span>{' '}
                                                                    <span className="text-[var(--foreground)] font-medium">{c.book_title}</span> — {c.chapter}{c.topic ? ` › ${c.topic}` : ''}, <span className="text-[var(--accent-blue)] italic">pp. {c.page_start || '?'}–{c.page_end || '?'}</span>
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between">
                                                    <button
                                                        onClick={() => {
                                                            setActiveCitations(msg.citations!);
                                                            setShowSources(true);
                                                        }}
                                                        className="flex items-center gap-2 text-xs font-medium text-[var(--primary)] hover:text-[var(--accent-blue)] transition-colors bg-[var(--primary)]/5 px-3 py-1.5 rounded-lg border border-[var(--primary)]/10"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {msg.citations.length} Source{msg.citations.length !== 1 ? 's' : ''}
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                    {msg.confidence && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[var(--muted)] ${confidenceColor(msg.confidence)}`}>
                                                            {msg.confidence} Confidence
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm md:text-base leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                    )}
                                </div>

                                {msg.role === 'user' && (
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-[var(--muted)] border border-[var(--border)] flex items-center justify-center flex-shrink-0 mt-1">
                                        <MessageSquare className="w-5 h-5 text-[var(--muted-foreground)]" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {loading && (
                        <div className="max-w-4xl mx-auto flex gap-4 md:gap-6 animate-fade-in">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl gradient-btn flex items-center justify-center flex-shrink-0 shadow-md">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="glass rounded-3xl rounded-bl-md px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
                                    <span className="text-sm md:text-base text-[var(--muted-foreground)] font-medium">
                                        {mode === 'cag' ? 'Analyzing full textbook...' : 'Analyzing curriculum...'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="border-t border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-lg p-4 md:p-6 relative z-10">
                    <form
                        onSubmit={handleSubmit}
                        className="max-w-4xl mx-auto flex gap-3"
                    >
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ask a question about the textbook..."
                                disabled={loading}
                                className="w-full px-5 md:px-6 py-3 md:py-4 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all text-sm md:text-base"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading || !currentSessionId}
                            className="px-5 md:px-6 py-3 md:py-4 rounded-2xl gradient-btn text-white hover:opacity-90 disabled:opacity-50 disabled:translate-y-0 transition-all shadow-md hover:-translate-y-0.5 active:scale-95 flex items-center justify-center min-w-[50px] md:min-w-[60px]"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="max-w-4xl mx-auto mt-3 text-[10px] text-[var(--muted-foreground)] text-center font-medium uppercase tracking-widest opacity-60">
                        AI-generated answers can be incorrect. Please verify with textbook pages.
                    </p>
                </div>
            </div>

            {/* Sources sidebar section */}
            {showSources && (
                <>
                    {/* Mobile overlay for sources */}
                    <div
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
                        onClick={() => setShowSources(false)}
                    />
                    <div className="fixed inset-y-0 right-0 w-full sm:w-96 md:relative md:w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col z-50 animate-fade-in">
                        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] shadow-sm">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-[var(--primary)]" />
                                <h2 className="font-bold text-[var(--foreground)]">Original Sources</h2>
                            </div>
                            <button
                                onClick={() => setShowSources(false)}
                                className="p-2 rounded-xl hover:bg-[var(--muted)] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 custom-scrollbar bg-[var(--background)]">
                            {activeCitations.map((c, i) => (
                                <div key={i} className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)] shadow-sm hover:border-[var(--primary)]/30 transition-all hover:shadow-md">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                                            <FileText className="w-4 h-4 text-[var(--primary)]" />
                                        </div>
                                        <span className="text-sm font-bold truncate text-[var(--foreground)]">{c.book_title}</span>
                                    </div>
                                    <div className="space-y-1 ml-11">
                                        <p className="text-xs text-[var(--muted-foreground)] font-medium">
                                            {c.chapter}
                                        </p>
                                        <p className="text-xs text-[var(--muted-foreground)] opacity-70">
                                            {c.topic}
                                        </p>
                                        <p className="inline-block mt-3 text-[10px] bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                            Pages {c.page_start || '?'}–{c.page_end || '?'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
