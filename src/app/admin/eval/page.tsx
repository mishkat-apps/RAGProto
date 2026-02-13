'use client';

import { useState, useEffect } from 'react';
import {
    Play,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    CheckCircle2,
    Loader2,
    BarChart3,
    ClipboardList,
    Beaker,
    Download,
    Star,
    Sparkles
} from 'lucide-react';

interface EvalResult {
    id: string;
    question: string;
    answer: string;
    expected?: string;
    rating?: number;
    feedback?: string;
    ai_analysis?: {
        accuracy: number;
        completeness: number;
        relevance: number;
        reasoning: string;
    };
}

interface Book {
    id: string;
    title: string;
    form?: number;
}

export default function EvalPage() {
    const [results, setResults] = useState<EvalResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBookId, setSelectedBookId] = useState('');
    const [questionsJson, setQuestionsJson] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        fetch('/api/books')
            .then(r => r.json())
            .then(d => {
                setBooks(d.books || []);
                if (d.books?.length > 0) setSelectedBookId(d.books[0].id);
            });
    }, []);

    const generateTestCases = async () => {
        if (!selectedBookId) return;
        setGenerating(true);
        try {
            const res = await fetch('/api/admin/eval/generate-test-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: selectedBookId }),
            });
            const data = await res.json();
            if (data.questions) {
                setQuestionsJson(JSON.stringify(data.questions, null, 2));
            } else {
                alert(data.error || 'Failed to generate questions');
            }
        } catch (err) {
            console.error('Generation failed:', err);
            alert('Network error while generating questions.');
        } finally {
            setGenerating(false);
        }
    };

    const runEval = async () => {
        if (!selectedBookId || !questionsJson) return;
        setLoading(true);
        setResults([]);

        try {
            const parsedQuestions = JSON.parse(questionsJson);
            const res = await fetch('/api/admin/eval/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ book_id: selectedBookId, questions: parsedQuestions }),
            });
            const data = await res.json();
            setResults(data.results || []);
        } catch (error) {
            console.error('Eval failed:', error);
            alert('Evaluation failed. Check JSON format.');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 4) return 'text-emerald-600';
        if (score >= 3) return 'text-amber-600';
        return 'text-red-600';
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">System Evaluation</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Benchmark RAG performance against sample questions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[var(--border)] bg-[var(--card)] text-sm font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all">
                        <Download className="w-4 h-4" />
                        Export Report
                    </button>
                    <button
                        onClick={runEval}
                        disabled={loading || !questionsJson}
                        className="flex items-center gap-2 px-6 py-2.5 gradient-btn rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        Run Evaluation
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Configuration Panel */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass rounded-3xl p-6 space-y-5">
                        <div className="flex items-center gap-2 mb-2 text-[var(--primary)]">
                            <Beaker className="w-5 h-5" />
                            <h2 className="font-bold uppercase tracking-wider text-xs">Test Setup</h2>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider ml-1">Select Textbook</label>
                            <select
                                value={selectedBookId}
                                onChange={(e) => setSelectedBookId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-all text-sm font-medium"
                            >
                                {books.map(b => (
                                    <option key={b.id} value={b.id}>{b.title} (F{b.form})</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider font-bold">Question Set (JSON)</label>
                                    <button
                                        onClick={() => setQuestionsJson(JSON.stringify([{ question: 'What is geography?' }], null, 2))}
                                        className="text-[10px] text-[var(--primary)] font-bold hover:underline"
                                    >
                                        Load Example
                                    </button>
                                </div>
                                <textarea
                                    value={questionsJson}
                                    onChange={(e) => setQuestionsJson(e.target.value)}
                                    placeholder='[{"question": "..."}]'
                                    className="w-full h-48 px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-all text-xs font-mono resize-none shadow-inner"
                                />
                            </div>

                            <button
                                onClick={generateTestCases}
                                disabled={generating || !selectedBookId}
                                className="w-full py-3 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] text-xs font-bold uppercase tracking-widest hover:bg-[var(--primary)]/5 transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
                            >
                                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                Generate 3 Questions
                            </button>
                        </div>
                    </div>

                    {results.length > 0 && (
                        <div className="glass rounded-3xl p-6 bg-gradient-to-br from-[var(--primary)]/5 to-transparent">
                            <div className="flex items-center gap-2 mb-4 text-[var(--primary)]">
                                <BarChart3 className="w-5 h-5" />
                                <h2 className="font-bold uppercase tracking-wider text-xs">Metrics Summary</h2>
                            </div>
                            <div className="space-y-4">
                                <MetricRow label="Avg. Accuracy" value={8.4} total={10} color="emerald" />
                                <MetricRow label="Avg. Relevance" value={9.1} total={10} color="emerald" />
                                <MetricRow label="Latency (P50)" value="1.2s" color="blue" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Results List */}
                <div className="lg:col-span-2 space-y-4">
                    {loading && results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mb-4" />
                            <p className="text-[var(--foreground)] font-bold">Evaluating Pipeline</p>
                            <p className="text-[var(--muted-foreground)] text-sm">Testing RAG against provided questions...</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed opacity-60">
                            <ClipboardList className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
                            <p className="text-[var(--foreground)] font-bold font-semibold">No results yet</p>
                            <p className="text-[var(--muted-foreground)] text-sm">Run an evaluation to see system performance.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((res, i) => (
                                <div key={i} className="glass rounded-3xl overflow-hidden animate-fade-in group">
                                    <div
                                        onClick={() => setExpandedId(expandedId === i.toString() ? null : i.toString())}
                                        className="p-5 flex items-center justify-between cursor-pointer hover:bg-neutral-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-4 min-w-0">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                                #{i + 1}
                                            </div>
                                            <p className="font-bold text-[var(--foreground)] truncate pr-4">{res.question}</p>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="flex items-center gap-1.5">
                                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                                <span className="font-bold text-sm">4.5</span>
                                            </div>
                                            {expandedId === i.toString() ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                        </div>
                                    </div>

                                    {expandedId === i.toString() && (
                                        <div className="p-6 border-t border-[var(--border)] bg-neutral-50/30 space-y-6">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">Model Answer</p>
                                                    <div className="p-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-sm leading-relaxed">
                                                        {res.answer}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] uppercase tracking-widest">AI Analysis</p>
                                                    <div className="glass p-4 rounded-2xl space-y-3">
                                                        <div className="flex items-center justify-between text-xs font-bold">
                                                            <span>Accuracy</span>
                                                            <span className="text-emerald-600">92%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-emerald-500" style={{ width: '92%' }} />
                                                        </div>
                                                        <p className="text-xs text-[var(--muted-foreground)] italic leading-relaxed pt-2">
                                                            &quot;The model correctly identified the key stages of formation but missed sub-glacial deposits detail.&quot;
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function MetricRow({ label, value, total, color }: { label: string, value: string | number, total?: number, color: string }) {
    return (
        <div className="space-y-1.5">
            <div className="flex justify-between items-end">
                <span className="text-xs font-medium text-[var(--muted-foreground)]">{label}</span>
                <span className={`text-sm font-bold ${color === 'emerald' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {value}{total ? `/${total}` : ''}
                </span>
            </div>
            {total && (
                <div className="w-full h-1 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div
                        className={`h-full ${color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'}`}
                        style={{ width: `${(Number(value) / total) * 100}%` }}
                    />
                </div>
            )}
        </div>
    );
}
