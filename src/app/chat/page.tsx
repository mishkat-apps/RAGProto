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
            // Migrate old single-session history
            try {
                const messages = JSON.parse(oldHistory);
                if (Array.isArray(messages) && messages.length > 0) {
                    const id = uuidv4();
                    const firstMsg = messages.find(m => m.role === 'user')?.content || 'New Chat';
                    initialSessions = [{
                        id,
                        title: firstMsg.slice(0, 40) + (firstMsg.length > 40 ? '...' : ''),
                        messages,
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
            // Create a default first session
            startNewChat([]);
        }

        setIsLoaded(true);

        fetch('/api/books')
            .then((r) => r.json())
            .then((d) => setBooks(d.books || []))
            .catch(() => { });
    }, []);

    // Save sessions on change
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('necta_sessions', JSON.stringify(sessions));
        }
    }, [sessions, isLoaded]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentSessionId, sessions]);

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

        // Update session with user message
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
            case 'high': return 'text-green-400';
            case 'medium': return 'text-yellow-400';
            case 'low': return 'text-red-400';
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
                                className="text-purple-400 font-semibold text-[0.65em] cursor-default hover:text-purple-300 transition-colors"
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
            {/* Sidebar */}
            <aside className={`${showSidebar ? 'w-72' : 'w-0'} border-r border-[var(--border)] bg-[var(--card)] flex flex-col transition-all duration-300 relative overflow-hidden`}>
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <button
                        onClick={() => startNewChat()}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-violet-500 rounded-xl text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-purple-500/10"
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
                                ? 'bg-purple-600/10 border border-purple-500/20 text-purple-100'
                                : 'hover:bg-[var(--muted)] text-[var(--muted-foreground)]'
                                }`}
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <MessageSquare className={`w-4 h-4 flex-shrink-0 ${s.id === currentSessionId ? 'text-purple-400' : 'text-[var(--muted-foreground)]'}`} />
                                <span className="text-sm truncate font-medium">{s.title}</span>
                            </div>
                            <button
                                onClick={(e) => deleteSession(e, s.id)}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 rounded-lg transition-all"
                            >
                                <Trash2 className="w-3.5 h-3.5 text-red-400" />
                            </button>
                        </div>
                    ))}
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* Header */}
                <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex items-center justify-between shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowSidebar(!showSidebar)}
                            className="p-2 -ml-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                        >
                            <Menu className="w-5 h-5" />
                        </button>

                        <Link href="/" className="flex items-center gap-3 group transition-all">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="font-bold text-base leading-tight">NECTA Textbook Chat</h1>
                                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold">Ask anything</p>
                            </div>
                        </Link>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* RAG / CAG Toggle */}
                        <div className="flex items-center bg-[var(--muted)] rounded-xl p-1 border border-[var(--border)]">
                            <button
                                onClick={() => setMode('rag')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'rag'
                                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                                    : 'text-[var(--muted-foreground)] hover:text-white'
                                    }`}
                            >
                                <Search className="w-3.5 h-3.5" />
                                RAG
                            </button>
                            <button
                                onClick={() => {
                                    setMode('cag');
                                    // Force book selection if not already selected
                                    if (!selectedBookId && books.length > 0) {
                                        const bid = books[0].id;
                                        setSelectedBookId(bid);
                                        setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, selectedBookId: bid } : s));
                                    }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${mode === 'cag'
                                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : 'text-[var(--muted-foreground)] hover:text-white'
                                    }`}
                            >
                                <Zap className="w-3.5 h-3.5" />
                                CAG
                            </button>
                        </div>

                        <select
                            value={selectedBookId}
                            onChange={(e) => {
                                const bid = e.target.value;
                                setSelectedBookId(bid);
                                setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, selectedBookId: bid } : s));
                            }}
                            className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
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
                    <div className="px-6 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-b border-amber-500/20 flex items-center justify-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                            Full Textbook Mode — Entire book loaded into context
                        </span>
                    </div>
                )}

                {/* Messages Container */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 custom-scrollbar bg-[var(--background)]">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center max-w-2xl mx-auto px-4">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-600/20 to-violet-500/20 flex items-center justify-center mb-8 animate-pulse">
                                <Sparkles className="w-10 h-10 text-purple-400" />
                            </div>
                            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">Ask a Textbook Question</h2>
                            <p className="text-[var(--muted-foreground)] text-lg mb-10 leading-relaxed">
                                Our AI tutor will search through the NECTA curriculum to give you precise answers with citations.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                                {[
                                    'What is geographic research?',
                                    'Explain the formation of fold mountains',
                                    'What are the types of rainfall?',
                                    'Define the term "ecosystem"',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="px-6 py-4 rounded-2xl border border-[var(--border)] text-sm text-left hover:bg-purple-500/10 hover:border-purple-500/30 transition-all hover:-translate-y-1 active:scale-[0.98]"
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
                                className={`flex gap-4 md:gap-6 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
                            >
                                {msg.role === 'assistant' && (
                                    <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg shadow-purple-500/20">
                                        <BookOpen className="w-5 h-5 text-white" />
                                    </div>
                                )}

                                <div
                                    className={`max-w-[85%] md:max-w-[75%] ${msg.role === 'user'
                                        ? 'bg-purple-600/20 border border-purple-500/30 rounded-3xl rounded-br-md px-6 py-4 shadow-sm text-purple-100'
                                        : 'glass rounded-3xl rounded-bl-md px-6 py-5 shadow-xl border border-white/5'
                                        }`}
                                >
                                    {msg.role === 'assistant' ? (
                                        <div className="text-sm md:text-base leading-relaxed">
                                            {renderContentWithFootnotes(msg.content)}

                                            {msg.citations && msg.citations.length > 0 && (() => {
                                                const usedRefs = getUsedFootnoteNumbers(msg.content);
                                                const footnotes = msg.citations
                                                    .map((c, idx) => ({ ...c, num: idx + 1 }))
                                                    .filter(c => usedRefs.has(c.num));
                                                if (footnotes.length === 0) return null;
                                                return (
                                                    <div className="mt-6 pt-4 border-t border-white/10">
                                                        <p className="text-xs font-bold text-[var(--muted-foreground)] mb-3 uppercase tracking-wider">References</p>
                                                        <div className="space-y-2">
                                                            {footnotes.map((c) => (
                                                                <p key={c.num} className="text-xs text-[var(--muted-foreground)] leading-relaxed">
                                                                    <span className="text-purple-400 font-bold mr-2">[{c.num}]</span>{' '}
                                                                    <span className="text-gray-300 font-medium">{c.book_title}</span> — {c.chapter}{c.topic ? ` › ${c.topic}` : ''}, <span className="text-purple-300/60 italics">pp. {c.page_start || '?'}–{c.page_end || '?'}</span>
                                                                </p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {msg.citations && msg.citations.length > 0 && (
                                                <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between">
                                                    <button
                                                        onClick={() => {
                                                            setActiveCitations(msg.citations!);
                                                            setShowSources(true);
                                                        }}
                                                        className="flex items-center gap-2 text-xs font-medium text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/5 px-3 py-1.5 rounded-lg border border-purple-500/10"
                                                    >
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {msg.citations.length} Source{msg.citations.length !== 1 ? 's' : ''}
                                                        <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                    {msg.confidence && (
                                                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md bg-[var(--muted)]/50 ${confidenceColor(msg.confidence)}`}>
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
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <div className="glass rounded-3xl rounded-bl-md px-6 py-5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
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
                <div className="border-t border-[var(--border)] bg-[var(--card)]/80 backdrop-blur-lg p-6 relative z-10">
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
                                className="w-full px-6 py-4 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all shadow-inner text-base"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!input.trim() || loading || !currentSessionId}
                            className="px-6 py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 disabled:opacity-50 disabled:translate-y-0 transition-all shadow-lg shadow-purple-500/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center min-w-[60px]"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                    <p className="max-w-4xl mx-auto mt-3 text-[10px] text-[var(--muted-foreground)] text-center font-medium uppercase tracking-widest opacity-60">
                        AI-generated answers can be incorrect. Please verify with textbook pages.
                    </p>
                </div>
            </div>

            {/* Sources sidebar section - can be optimized */}
            {showSources && (
                <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col animate-slide-in-right z-20">
                    <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--border)] shadow-sm">
                        <div className="flex items-center gap-3">
                            <History className="w-5 h-5 text-purple-400" />
                            <h2 className="font-bold">Original Sources</h2>
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
                            <div key={i} className="rounded-2xl bg-[var(--card)] p-5 border border-[var(--border)] shadow-md hover:border-purple-500/30 transition-all hover:shadow-purple-500/5">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-purple-400" />
                                    </div>
                                    <span className="text-sm font-bold truncate">{c.book_title}</span>
                                </div>
                                <div className="space-y-1 ml-11">
                                    <p className="text-xs text-[var(--muted-foreground)] font-medium">
                                        {c.chapter}
                                    </p>
                                    <p className="text-xs text-[var(--muted-foreground)] opacity-70">
                                        {c.topic}
                                    </p>
                                    <p className="inline-block mt-3 text-[10px] bg-purple-500/10 text-purple-300 px-2 py-1 rounded-md font-bold uppercase tracking-wider">
                                        Pages {c.page_start || '?'}–{c.page_end || '?'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
