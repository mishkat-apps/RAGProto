'use client';

import { useState, useEffect } from 'react';
import {
    Play,
    Loader2,
    BarChart3,
    Download,
    Star,
    Sparkles,
    Trash2,
    MessageSquarePlus,
    Beaker,
    ClipboardList
} from 'lucide-react';

interface EvalResult {
    answer: string;
    confidence: string;
    citations?: any[];
    error?: string;
}

interface ComparisonResult {
    question: string;
    results: {
        rag: EvalResult;
        cag: EvalResult;
        graph: EvalResult;
    };
}

interface Book {
    id: string;
    title: string;
    form?: number;
}

export default function EvalPage() {
    const [comparison, setComparison] = useState<ComparisonResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [books, setBooks] = useState<Book[]>([]);
    const [selectedBookId, setSelectedBookId] = useState('');
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [generating, setGenerating] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [aiReport, setAiReport] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/books')
            .then(r => r.json())
            .then(d => {
                setBooks(d.books || []);
                if (d.books?.length > 0) setSelectedBookId(d.books[0].id);
            });
    }, []);

    const generateTestCase = async () => {
        if (!selectedBookId) return;
        setGenerating(true);
        setAiReport(null);
        setComparison(null);
        try {
            const res = await fetch('/api/admin/eval/generate-test-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: selectedBookId }),
            });
            const data = await res.json();
            if (data.questions?.[0]) {
                setCurrentQuestion(data.questions[0].question);
            } else {
                alert(data.error || 'Failed to generate question');
            }
        } catch (err) {
            console.error('Generation failed:', err);
            alert('Network error while generating question.');
        } finally {
            setGenerating(false);
        }
    };

    const runEval = async () => {
        if (!selectedBookId || !currentQuestion) return;
        setLoading(true);
        setAiReport(null);
        setComparison(null);

        try {
            const res = await fetch('/api/admin/eval/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: selectedBookId, question: currentQuestion }),
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setComparison(data);
        } catch (error: any) {
            console.error('Eval failed:', error);
            alert(`Evaluation failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const generateAiReport = async () => {
        if (!comparison) return;
        setAnalyzing(true);
        try {
            const res = await fetch('/api/admin/eval/analyze-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    results: comparison.results,
                    question: comparison.question
                }),
            });
            const data = await res.json();
            if (data.report) {
                setAiReport(data.report);
            } else {
                alert(data.error || 'Failed to analyze results');
            }
        } catch (err) {
            console.error('Analysis failed:', err);
            alert('Analysis failed.');
        } finally {
            setAnalyzing(false);
        }
    };

    return (
        <div className="space-y-8 animate-fade-in max-w-7xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">System Evaluation</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Compare RAG strategies against a single question.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={runEval}
                        disabled={loading || !currentQuestion}
                        className="flex items-center gap-2 px-6 py-2.5 gradient-btn rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
                        Run Comparison
                    </button>
                    {comparison && (
                        <button
                            onClick={generateAiReport}
                            disabled={analyzing}
                            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 rounded-xl text-sm font-bold text-white shadow-lg hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                            Analyze with AI
                        </button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
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
                                    <label className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Evaluation Question</label>
                                    {currentQuestion && (
                                        <button
                                            onClick={() => setCurrentQuestion('')}
                                            className="text-[10px] font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-tighter flex items-center gap-1"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Clear
                                        </button>
                                    )}
                                </div>
                                <textarea
                                    value={currentQuestion}
                                    onChange={(e) => setCurrentQuestion(e.target.value)}
                                    placeholder="Type your own question here or generate one..."
                                    className="w-full h-32 px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-all text-sm leading-relaxed resize-none shadow-inner"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={generateTestCase}
                                    disabled={generating || !selectedBookId}
                                    className="py-3 rounded-xl border border-[var(--primary)]/30 text-[var(--primary)] text-[10px] font-bold uppercase tracking-widest hover:bg-[var(--primary)]/5 transition-all flex flex-col items-center justify-center gap-1 disabled:opacity-50 shadow-sm"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span>AI Generate</span>
                                </button>
                                <div className="flex flex-col items-center justify-center p-2 rounded-xl bg-indigo-50 border border-indigo-100 opacity-60">
                                    <MessageSquarePlus className="w-4 h-4 text-indigo-600 mb-1" />
                                    <span className="text-[10px] font-bold text-indigo-900 uppercase">Manual Entry</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Comparison Results */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed">
                            <Loader2 className="w-10 h-10 animate-spin text-[var(--primary)] mb-4" />
                            <p className="text-[var(--foreground)] font-bold">Comparing 3 RAG Strategies</p>
                            <p className="text-[var(--muted-foreground)] text-sm">Executing RAG, CAG, and GraphRAG in parallel...</p>
                        </div>
                    ) : !comparison ? (
                        <div className="flex flex-col items-center justify-center py-24 bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed opacity-60">
                            <ClipboardList className="w-12 h-12 text-[var(--muted-foreground)] mb-4" />
                            <p className="text-[var(--foreground)] font-bold">No comparison yet</p>
                            <p className="text-[var(--muted-foreground)] text-sm">Generate a question and run comparison to see results.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="glass p-5 rounded-2xl border-l-4 border-indigo-500">
                                <label className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Target Question</label>
                                <p className="text-lg font-bold text-[var(--foreground)] mt-1">{comparison.question}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <ResultColumn
                                    title="Standard RAG"
                                    subtitle="Vector Search + Rerank"
                                    color="emerald"
                                    result={comparison.results.rag}
                                />
                                <ResultColumn
                                    title="CAG (Full Context)"
                                    subtitle="Entire Book Context"
                                    color="amber"
                                    result={comparison.results.cag}
                                />
                                <ResultColumn
                                    title="GraphRAG"
                                    subtitle="Entities + Hybrid"
                                    color="indigo"
                                    result={comparison.results.graph}
                                />
                            </div>

                            {aiReport && (
                                <div className="glass rounded-3xl p-8 animate-slide-up border-t-4 border-indigo-600">
                                    <div className="flex items-center gap-2 mb-6">
                                        <Sparkles className="w-6 h-6 text-indigo-600" />
                                        <h2 className="text-2xl font-bold">AI Comparison Report</h2>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-[var(--foreground)] leading-relaxed prose-headings:text-indigo-900 prose-strong:text-indigo-800">
                                        <div dangerouslySetInnerHTML={{
                                            __html: aiReport
                                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
                                                .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
                                                .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
                                                .replace(/^\* (.*$)/gim, '<li class="ml-4">$1</li>')
                                                .replace(/^\d\. (.*$)/gim, '<li class="ml-4 list-decimal">$1</li>')
                                                .replace(/\n/g, '<br />')
                                        }} />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ResultColumn({ title, subtitle, color, result }: { title: string, subtitle: string, color: 'emerald' | 'amber' | 'indigo', result: EvalResult }) {
    const headerClasses = {
        emerald: 'bg-emerald-600',
        amber: 'bg-amber-600',
        indigo: 'bg-indigo-600',
    };

    return (
        <div className={`flex flex-col rounded-3xl overflow-hidden glass border-t-4 ${headerClasses[color]} shadow-sm`}>
            <div className="p-4 bg-white/40">
                <h3 className="font-bold text-sm text-[var(--foreground)]">{title}</h3>
                <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-wider font-medium">{subtitle}</p>
            </div>
            <div className="p-5 flex-1 space-y-4">
                <div className="space-y-1.5 font-bold mb-4 flex justify-between items-center">
                    <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-widest font-bold">Status</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-tighter ${result.error ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {result.error ? 'Error' : 'Success'}
                    </span>
                </div>

                <div className="space-y-1.5 flex justify-between items-center">
                    <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-widest font-bold">Confidence</span>
                    <span className={`text-xs font-bold uppercase ${result.confidence === 'high' ? 'text-emerald-600' : result.confidence === 'medium' ? 'text-amber-600' : 'text-red-600'}`}>
                        {result.confidence}
                    </span>
                </div>

                <div className="space-y-2 mt-4">
                    <span className="text-[10px] uppercase text-[var(--muted-foreground)] tracking-widest font-bold">Answer</span>
                    <div className="p-4 rounded-2xl bg-white/50 border border-[var(--border)] text-xs leading-relaxed min-h-[200px] shadow-inner font-medium">
                        {result.answer}
                    </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-bold text-[var(--muted-foreground)] pt-2">
                    <span>Citations</span>
                    <span>{result.citations?.length || 0} Source(s)</span>
                </div>
            </div>
        </div>
    );
}
