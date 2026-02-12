'use client';

import { useState, useEffect, useRef } from 'react';
import {
    Send,
    BookOpen,
    Loader2,
    ChevronRight,
    FileText,
    X,
    MessageSquare,
    Sparkles,
} from 'lucide-react';
import type { Citation } from '@/lib/supabase/types';

interface Message {
    role: 'user' | 'assistant';
    content: string;
    citations?: Citation[];
    confidence?: string;
}

interface BookOption {
    id: string;
    title: string;
    subject: string;
    form: number;
}

export default function ChatPage() {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState<BookOption[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('');
    const [showSources, setShowSources] = useState(false);
    const [activeCitations, setActiveCitations] = useState<Citation[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/books')
            .then((r) => r.json())
            .then((d) => setBooks(d.books || []))
            .catch(() => { });
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const question = input.trim();
        setInput('');
        setMessages((prev) => [...prev, { role: 'user', content: question }]);
        setLoading(true);

        try {
            const res = await fetch('/api/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question,
                    filters: selectedBookId ? { book_id: selectedBookId } : undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                setMessages((prev) => [
                    ...prev,
                    { role: 'assistant', content: `Error: ${data.error || 'Failed to get answer'}` },
                ]);
            } else {
                setMessages((prev) => [
                    ...prev,
                    {
                        role: 'assistant',
                        content: data.answer,
                        citations: data.citations,
                        confidence: data.confidence,
                    },
                ]);
            }
        } catch {
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: 'Error: Network error. Please try again.' },
            ]);
        }

        setLoading(false);
    };

    const confidenceColor = (conf?: string) => {
        switch (conf) {
            case 'high':
                return 'text-green-400';
            case 'medium':
                return 'text-yellow-400';
            case 'low':
                return 'text-red-400';
            default:
                return 'text-[var(--muted-foreground)]';
        }
    };

    return (
        <div className="flex h-screen">
            {/* Main chat area */}
            <div className="flex-1 flex flex-col">
                {/* Header */}
                <header className="border-b border-[var(--border)] bg-[var(--card)] px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="font-bold">NECTA Textbook Chat</h1>
                            <p className="text-xs text-[var(--muted-foreground)]">Ask questions, get cited answers</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <select
                            value={selectedBookId}
                            onChange={(e) => setSelectedBookId(e.target.value)}
                            className="px-3 py-2 rounded-lg bg-[var(--muted)] border border-[var(--border)] text-sm focus:border-purple-500 focus:outline-none"
                        >
                            <option value="">All Books</option>
                            {books.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.title} (Form {b.form})
                                </option>
                            ))}
                        </select>
                    </div>
                </header>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full text-center">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-600/20 to-violet-500/20 flex items-center justify-center mb-6">
                                <Sparkles className="w-10 h-10 text-purple-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">Ask a Textbook Question</h2>
                            <p className="text-[var(--muted-foreground)] max-w-md mb-8">
                                Select a book above and ask any question. You&apos;ll get an answer with chapter and page citations.
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-lg">
                                {[
                                    'What is geographic research?',
                                    'Explain the formation of fold mountains',
                                    'What are the types of rainfall?',
                                    'Define the term "ecosystem"',
                                ].map((q) => (
                                    <button
                                        key={q}
                                        onClick={() => setInput(q)}
                                        className="px-4 py-3 rounded-xl border border-[var(--border)] text-sm text-left hover:bg-purple-500/10 hover:border-purple-500/30 transition-colors"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-4 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
                        >
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center flex-shrink-0 mt-1">
                                    <BookOpen className="w-4 h-4 text-white" />
                                </div>
                            )}

                            <div
                                className={`max-w-[70%] ${msg.role === 'user'
                                        ? 'bg-purple-600/20 border border-purple-500/30 rounded-2xl rounded-br-md px-5 py-3'
                                        : 'glass rounded-2xl rounded-bl-md px-5 py-4'
                                    }`}
                            >
                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                                {msg.citations && msg.citations.length > 0 && (
                                    <div className="mt-4 pt-3 border-t border-[var(--border)]">
                                        <button
                                            onClick={() => {
                                                setActiveCitations(msg.citations!);
                                                setShowSources(true);
                                            }}
                                            className="flex items-center gap-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                        >
                                            <FileText className="w-3 h-3" />
                                            {msg.citations.length} source{msg.citations.length !== 1 ? 's' : ''}
                                            <ChevronRight className="w-3 h-3" />
                                        </button>
                                        {msg.confidence && (
                                            <span className={`text-xs mt-1 block ${confidenceColor(msg.confidence)}`}>
                                                Confidence: {msg.confidence}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>

                            {msg.role === 'user' && (
                                <div className="w-8 h-8 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0 mt-1">
                                    <MessageSquare className="w-4 h-4 text-[var(--muted-foreground)]" />
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-4 animate-fade-in">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center flex-shrink-0">
                                <BookOpen className="w-4 h-4 text-white" />
                            </div>
                            <div className="glass rounded-2xl rounded-bl-md px-5 py-4">
                                <div className="flex items-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span className="text-sm text-[var(--muted-foreground)]">Searching textbook...</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="border-t border-[var(--border)] bg-[var(--card)] p-4"
                >
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask a question about the textbook..."
                            disabled={loading}
                            className="flex-1 px-5 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || loading}
                            className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>

            {/* Sources drawer */}
            {showSources && (
                <div className="w-96 border-l border-[var(--border)] bg-[var(--card)] flex flex-col animate-fade-in">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                        <h2 className="font-semibold">Sources</h2>
                        <button
                            onClick={() => setShowSources(false)}
                            className="p-1 rounded-lg hover:bg-[var(--muted)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {activeCitations.map((c, i) => (
                            <div key={i} className="rounded-xl bg-[var(--muted)] p-4 border border-[var(--border)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-medium">{c.book_title}</span>
                                </div>
                                <p className="text-xs text-[var(--muted-foreground)] mb-1">
                                    {c.chapter}
                                    {c.topic ? ` > ${c.topic}` : ''}
                                </p>
                                <p className="text-xs text-purple-400">
                                    Pages {c.page_start || '?'}–{c.page_end || '?'}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
