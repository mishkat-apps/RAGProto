'use client';

import { useState, useEffect } from 'react';
import {
    Play,
    Loader2,
    BarChart3,
    ClipboardList,
    Beaker,
    Sparkles,
    Trash2,
    MessageSquarePlus,
    ChevronDown,
    Settings2,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowRight,
    Star
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
    const [showConfig, setShowConfig] = useState(true);

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
        // Collapse config on mobile/small screens after running
        if (window.innerWidth < 1024) setShowConfig(false);

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
                // Smooth scroll to report
                setTimeout(() => {
                    document.getElementById('ai-report')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
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
        <div className="min-h-screen bg-[#F8FAFB] pb-20 px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <header className="max-w-7xl mx-auto pt-8 pb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-2 text-indigo-600 mb-2">
                            <Beaker className="w-5 h-5" />
                            <span className="text-xs font-bold uppercase tracking-widest">RAG Lab</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-[#1A1A2E] tracking-tight sm:text-5xl">
                            System <span className="text-indigo-600">Evaluation</span>
                        </h1>
                        <p className="text-slate-500 mt-3 text-lg max-w-2xl leading-relaxed">
                            Benchmark multiple retrieval strategies side-by-side to ensure the highest accuracy for the NECTA curriculum.
                        </p>
                    </div>

                    <div className="flex items-center gap-4 animate-fade-in delay-100">
                        <button
                            onClick={runEval}
                            disabled={loading || !currentQuestion}
                            className="group flex items-center gap-2 px-8 py-3.5 bg-[#1EB53A] rounded-2xl text-sm font-bold text-white shadow-[0_8px_20px_-6px_rgba(30,181,58,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(30,181,58,0.5)] hover:-translate-y-0.5 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                            <span>Run Benchmark</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                    {/* Left Panel: Configuration */}
                    <aside className={`lg:col-span-4 transition-all duration-500 ease-in-out ${showConfig ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-[2rem] p-8 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 sticky top-8">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-slate-50 rounded-xl">
                                        <Settings2 className="w-5 h-5 text-slate-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-800">Parameters</h2>
                                </div>
                                <button
                                    onClick={() => setShowConfig(!showConfig)}
                                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                                >
                                    <ChevronDown className={`w-6 h-6 transform transition-transform ${showConfig ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-8">
                                {/* Book Select */}
                                <div className="space-y-3">
                                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" />
                                        Source Material
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={selectedBookId}
                                            onChange={(e) => setSelectedBookId(e.target.value)}
                                            className="w-full pl-5 pr-12 py-4 rounded-2xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none appearance-none transition-all text-sm font-semibold text-slate-700 shadow-sm group-hover:bg-slate-100/50"
                                        >
                                            {books.map(b => (
                                                <option key={b.id} value={b.id}>{b.title} (Form {b.form})</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
                                    </div>
                                </div>

                                {/* Question Input Area */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            <MessageSquarePlus className="w-3.5 h-3.5" />
                                            Test Query
                                        </label>
                                        {currentQuestion && (
                                            <button
                                                onClick={() => setCurrentQuestion('')}
                                                className="text-[10px] font-bold text-red-400 hover:text-red-600 transition-colors uppercase tracking-widest flex items-center gap-1.5"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Reset
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative group">
                                        <textarea
                                            value={currentQuestion}
                                            onChange={(e) => setCurrentQuestion(e.target.value)}
                                            placeholder="Type a custom query or let AI generate one..."
                                            className="w-full h-44 px-6 py-5 rounded-[1.5rem] bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none transition-all text-sm leading-relaxed font-medium text-slate-700 resize-none shadow-sm placeholder:text-slate-300"
                                        />
                                        <div className="absolute bottom-4 right-4 flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">
                                                {currentQuestion.length} Chars
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Generation Tool */}
                                <button
                                    onClick={generateTestCase}
                                    disabled={generating || !selectedBookId}
                                    className="w-full py-4 rounded-2xl bg-indigo-50 hover:bg-indigo-600 group text-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {generating ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-5 h-5 animate-float" />
                                    )}
                                    <span className="text-sm font-bold tracking-wide">Generate Pro-Level Question</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    {/* Right Panel: Results */}
                    <div className="lg:col-span-8 space-y-8">
                        {loading ? (
                            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 animate-pulse-glow">
                                <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-8">
                                    <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-3">Orchestrating Triple-RAG Benchmark</h3>
                                <p className="text-slate-500 max-w-sm">Comparing Standard Vector Search, Full-Context CAG, and Knowledge Graph retrieval in parallel...</p>
                                <div className="mt-8 flex gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                                    <div className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:-0.15s]" />
                                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                                </div>
                            </div>
                        ) : !comparison ? (
                            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 border-dashed border-2">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-8">
                                    <ClipboardList className="w-10 h-10 text-slate-300" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-300 mb-3">Ready for Benchmarking</h3>
                                <p className="text-slate-400 max-w-sm">Select a textbook and provide a question to start the side-by-side strategy comparison.</p>
                                <button
                                    onClick={() => setShowConfig(true)}
                                    className="mt-8 text-indigo-500 font-bold text-sm uppercase tracking-widest flex items-center gap-2 hover:gap-3 transition-all lg:hidden"
                                >
                                    Open Settings <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-slide-up">
                                {/* Comparison Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <ResultCard
                                        title="Standard"
                                        badge="Fastest"
                                        description="Reranked Vector Search"
                                        color="emerald"
                                        result={comparison.results.rag}
                                    />
                                    <ResultCard
                                        title="Context"
                                        badge="Accurate"
                                        description="Full Book Context (CAG)"
                                        color="amber"
                                        result={comparison.results.cag}
                                    />
                                    <ResultCard
                                        title="GraphRAG"
                                        badge="Intelligent"
                                        description="Entity-Linked Hybrid"
                                        color="indigo"
                                        result={comparison.results.graph}
                                    />
                                </div>

                                {/* Report Action */}
                                <div className="bg-white rounded-[2rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-8">
                                    <div className="flex items-center gap-6 text-center md:text-left">
                                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center relative flex-shrink-0">
                                            <Sparkles className="w-8 h-8 text-indigo-600" />
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-4 border-white animate-pulse" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-800">Generate Intelligent Verdict</h3>
                                            <p className="text-slate-500 mt-1">Let LLM analyze the retrieval quality and pick the definitive winner.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={generateAiReport}
                                        disabled={analyzing}
                                        className="w-full md:w-auto px-10 py-5 bg-indigo-600 rounded-2xl text-white font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        {analyzing ? (
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                        ) : (
                                            <BarChart3 className="w-5 h-5" />
                                        )}
                                        {analyzing ? 'Analyzing Strategies...' : 'Request AI Report'}
                                    </button>
                                </div>

                                {/* Markdown Report */}
                                {aiReport && (
                                    <article id="ai-report" className="bg-white rounded-[2.5rem] p-12 shadow-2xl shadow-indigo-100/50 border border-slate-100 animate-slide-up relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                            <Sparkles className="w-64 h-64 text-indigo-600" />
                                        </div>
                                        <div className="relative">
                                            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-8">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                Benchmark Verdict
                                            </div>
                                            <div className="prose prose-slate max-w-none 
                                                prose-h1:text-4xl prose-h1:font-black prose-h1:tracking-tight prose-h1:text-slate-900 
                                                prose-h2:text-2xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-indigo-900 
                                                prose-strong:text-indigo-800 prose-strong:font-bold
                                                prose-p:text-slate-600 prose-p:leading-8 prose-p:text-lg
                                                prose-li:text-slate-600 prose-li:text-lg
                                                prose-table:border prose-table:rounded-2xl prose-table:overflow-hidden
                                                prose-th:bg-slate-50 prose-th:px-6 prose-th:py-4 prose-th:text-xs prose-th:font-black prose-th:uppercase prose-th:tracking-widest
                                                prose-td:px-6 prose-td:py-4 prose-td:border-t">
                                                <div dangerouslySetInnerHTML={{
                                                    __html: aiReport
                                                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                                        .replace(/^# (.*$)/gim, '<h1 className="border-b pb-4 mb-4">$1</h1>')
                                                        .replace(/^## (.*$)/gim, '<h2 className="flex items-center gap-2">$1</h2>')
                                                        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
                                                        .replace(/^\* (.*$)/gim, '<li className="source-list-item">$1</li>')
                                                        .replace(/^\d\. (.*$)/gim, '<li className="ordered-list-item">$1</li>')
                                                        .replace(/\n/g, '<br />')
                                                }} />
                                            </div>
                                        </div>
                                    </article>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function ResultCard({ title, badge, description, color, result }: {
    title: string,
    badge: string,
    description: string,
    color: 'emerald' | 'amber' | 'indigo',
    result: EvalResult
}) {
    const config = {
        emerald: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-700',
            border: 'border-emerald-100',
            accent: 'bg-emerald-500',
            light: 'bg-emerald-50/50',
            icon: <CheckCircle2 className="w-5 h-5" />,
        },
        amber: {
            bg: 'bg-amber-50',
            text: 'text-amber-700',
            border: 'border-amber-100',
            accent: 'bg-amber-500',
            light: 'bg-amber-50/50',
            icon: <AlertCircle className="w-5 h-5" />,
        },
        indigo: {
            bg: 'bg-indigo-50',
            text: 'text-indigo-700',
            border: 'border-indigo-100',
            accent: 'bg-indigo-500',
            light: 'bg-indigo-50/50',
            icon: <Sparkles className="w-5 h-5" />,
        },
    };

    const style = config[color];
    const confidenceValue = result.confidence === 'high' ? 95 : result.confidence === 'medium' ? 65 : 35;

    return (
        <div className={`flex flex-col rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group`}>
            {/* Card Header */}
            <div className={`p-8 ${style.light}`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-1.5 ${style.bg} ${style.text} rounded-full text-[10px] font-black uppercase tracking-widest`}>
                        {badge}
                    </span>
                    <div className={`${style.text} opacity-40 group-hover:opacity-100 transition-opacity`}>
                        {style.icon}
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">{title}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{description}</p>
            </div>

            {/* Metrics */}
            <div className="px-8 pt-8 space-y-6 flex-1">
                {/* Confidence Meter */}
                <div className="space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Confidence</span>
                        <span className={style.text}>{result.confidence}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-50 rounded-full overflow-hidden p-0.5 border border-slate-100">
                        <div
                            className={`h-full ${style.accent} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${confidenceValue}%` }}
                        />
                    </div>
                </div>

                {/* Answer Content */}
                <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Response</span>
                    <div className="relative">
                        <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 text-sm leading-relaxed text-slate-600 font-medium h-[280px] overflow-y-auto custom-scrollbar shadow-inner">
                            {result.error ? (
                                <div className="flex items-center gap-2 text-red-500 font-bold italic">
                                    <AlertCircle className="w-4 h-4" />
                                    {result.error}
                                </div>
                            ) : result.answer}
                        </div>
                        {/* Shimmer overlay for top/bottom of scroll */}
                        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-slate-50 to-transparent pointer-events-none rounded-t-3xl" />
                        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none rounded-b-3xl" />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="p-8 mt-auto border-t border-slate-50">
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Attributions</span>
                        <span className="text-xs font-black text-slate-800">{result.citations?.length || 0} Source{result.citations?.length === 1 ? '' : 's'}</span>
                    </div>
                    <div className="flex -space-x-2">
                        {[...Array(Math.min(3, result.citations?.length || 0))].map((_, i) => (
                            <div key={i} className={`w-8 h-8 rounded-full border-2 border-white ${style.accent} flex items-center justify-center shadow-sm`}>
                                <div className="w-1.5 h-1.5 bg-white rounded-full opacity-60" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
