'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    ChevronLeft,
    ChevronRight,
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
    const carouselRef = useRef<HTMLDivElement>(null);

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

    const scrollCarousel = (direction: 'left' | 'right') => {
        if (!carouselRef.current) return;
        const scrollAmount = direction === 'left' ? -carouselRef.current.offsetWidth : carouselRef.current.offsetWidth;
        carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-[#F8FAFB] pb-20 px-4 sm:px-6 lg:px-8">
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

                    <aside className={`lg:col-span-3 transition-all duration-500 ease-in-out ${showConfig ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-[2rem] p-6 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] border border-slate-100/50 sticky top-8">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Settings2 className="w-4 h-4 text-slate-400" />
                                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">Setup</h2>
                                </div>
                                <button
                                    onClick={() => setShowConfig(!showConfig)}
                                    className="lg:hidden p-2 text-slate-400 hover:text-slate-600"
                                >
                                    <ChevronDown className={`w-6 h-6 transform transition-transform ${showConfig ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest pl-1">
                                        Subject Material
                                    </label>
                                    <div className="relative group">
                                        <select
                                            value={selectedBookId}
                                            onChange={(e) => setSelectedBookId(e.target.value)}
                                            className="w-full pl-4 pr-10 py-3 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none appearance-none transition-all text-xs font-bold text-slate-700 shadow-sm"
                                        >
                                            {books.map(b => (
                                                <option key={b.id} value={b.id}>{b.title}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between pl-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                            The Question
                                        </label>
                                        {currentQuestion && (
                                            <button
                                                onClick={() => setCurrentQuestion('')}
                                                className="text-[9px] font-black text-red-400 hover:text-red-500 transition-colors uppercase"
                                            >
                                                Clear
                                            </button>
                                        )}
                                    </div>
                                    <textarea
                                        value={currentQuestion}
                                        onChange={(e) => setCurrentQuestion(e.target.value)}
                                        placeholder="Type or generate a question..."
                                        className="w-full h-32 px-4 py-4 rounded-xl bg-slate-50 border-2 border-transparent focus:border-indigo-500/20 focus:bg-white focus:outline-none transition-all text-xs leading-relaxed font-bold text-slate-700 resize-none shadow-sm"
                                    />
                                </div>

                                <button
                                    onClick={generateTestCase}
                                    disabled={generating}
                                    className="w-full py-3.5 rounded-xl bg-indigo-50 hover:bg-indigo-600 group text-indigo-600 hover:text-white transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                    <span className="text-[11px] font-black uppercase tracking-wider">Generate Question</span>
                                </button>
                            </div>
                        </div>
                    </aside>

                    <div className={`lg:col-span-9 space-y-8 ${showConfig ? 'lg:col-span-9' : 'lg:col-span-12'}`}>
                        {loading ? (
                            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 animate-pulse-glow min-h-[500px]">
                                <Loader2 className="w-12 h-12 animate-spin text-indigo-600 mb-6" />
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Benchmarking Triple RAG</h3>
                                <p className="text-slate-500">Wait as we analyze across Standard, CAG, and Graph modes...</p>
                            </div>
                        ) : !comparison ? (
                            <div className="bg-white rounded-[2rem] p-20 flex flex-col items-center justify-center text-center shadow-sm border border-slate-100 border-dashed border-2 min-h-[500px]">
                                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                    <ClipboardList className="w-8 h-8 text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold text-slate-400">Ready to compare</h3>
                                <p className="text-slate-400 mt-2 max-w-xs mx-auto text-sm">Select a textbook and a question to see how different search strategies perform.</p>
                            </div>
                        ) : (
                            <div className="space-y-10 animate-slide-up">
                                {/* Carousel Section */}
                                <div className="relative group/carousel">
                                    <div
                                        ref={carouselRef}
                                        className="flex gap-6 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-6 scroll-smooth px-2"
                                    >
                                        <div className="snap-center shrink-0 w-full md:w-[450px]">
                                            <ResultCard
                                                title="Standard"
                                                badge="Fastest"
                                                description="Reranked Vector Search"
                                                color="emerald"
                                                result={comparison.results.rag}
                                            />
                                        </div>
                                        <div className="snap-center shrink-0 w-full md:w-[450px]">
                                            <ResultCard
                                                title="Context"
                                                badge="Deep Context"
                                                description="Full Book Context (CAG)"
                                                color="amber"
                                                result={comparison.results.cag}
                                            />
                                        </div>
                                        <div className="snap-center shrink-0 w-full md:w-[450px]">
                                            <ResultCard
                                                title="GraphRAG"
                                                badge="Intelligent"
                                                description="Entity-Linked Hybrid"
                                                color="indigo"
                                                result={comparison.results.graph}
                                            />
                                        </div>
                                    </div>

                                    {/* Navigation Arrows */}
                                    <button
                                        onClick={() => scrollCarousel('left')}
                                        className="absolute left-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex border border-slate-100"
                                    >
                                        <ChevronLeft className="w-6 h-6" />
                                    </button>
                                    <button
                                        onClick={() => scrollCarousel('right')}
                                        className="absolute right-[-20px] top-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all opacity-0 group-hover/carousel:opacity-100 hidden md:flex border border-slate-100"
                                    >
                                        <ChevronRight className="w-6 h-6" />
                                    </button>

                                    {/* Mobile Indicator */}
                                    <div className="flex justify-center gap-1.5 mt-2 md:hidden">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                                    </div>
                                </div>

                                {/* Report Action */}
                                <div className="bg-white rounded-[2rem] p-8 shadow-[0_15px_50px_-15px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-6">
                                    <div className="flex items-center gap-5 text-center md:text-left">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                                            <Sparkles className="w-6 h-6 text-indigo-600 animate-float" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">AI Benchmark Verdict</h3>
                                            <p className="text-slate-500 mt-0.5 text-sm">Compare strategies and discover which mode provided the best answer.</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={generateAiReport}
                                        disabled={analyzing}
                                        className="w-full md:w-auto px-8 py-4 bg-indigo-600 rounded-2xl text-white text-sm font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
                                        {analyzing ? 'Analyzing Performance...' : 'Generate Verdict Report'}
                                    </button>
                                </div>

                                {/* AI Markdown Report */}
                                {aiReport && (
                                    <article id="ai-report" className="bg-white rounded-[2.5rem] p-10 md:p-14 shadow-[0_25px_80px_-20px_rgba(0,0,0,0.08)] border border-slate-100 animate-slide-up relative overflow-hidden">
                                        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                            <Beaker className="w-64 h-64 text-indigo-600" />
                                        </div>
                                        <div className="relative">
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 rounded-full text-indigo-600 text-[10px] font-black uppercase tracking-widest mb-10">
                                                <Star className="w-3.5 h-3.5 fill-current" />
                                                Benchmark Analysis
                                            </div>

                                            <div className="prose prose-slate max-w-none 
                                                prose-h1:text-3xl prose-h1:font-black prose-h1:tracking-tight prose-h1:text-slate-900 prose-h1:mb-8
                                                prose-h2:text-xl prose-h2:font-bold prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-indigo-900 prose-h2:flex prose-h2:items-center prose-h2:gap-3
                                                prose-p:text-slate-600 prose-p:leading-8 prose-p:text-lg
                                                prose-strong:text-slate-900 prose-strong:font-bold
                                                prose-li:text-slate-600 prose-li:text-lg
                                                prose-table:w-full prose-table:border-collapse prose-table:rounded-xl prose-table:overflow-hidden prose-table:my-8
                                                prose-th:bg-slate-50 prose-th:text-slate-800 prose-th:font-black prose-th:text-[10px] prose-th:uppercase prose-th:tracking-widest prose-th:px-6 prose-th:py-4 prose-th:text-left prose-th:border-b
                                                prose-td:px-6 prose-td:py-4 prose-td:text-sm prose-td:border-b prose-td:text-slate-600">
                                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                    {aiReport}
                                                </ReactMarkdown>
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
        <div className={`flex flex-col rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 h-[650px] group`}>
            {/* Card Header */}
            <div className={`p-8 ${style.light}`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-4 py-1.5 ${style.bg} ${style.text} rounded-full text-[10px] font-black uppercase tracking-widest`}>
                        {badge}
                    </span>
                    <div className={`${style.text} opacity-30 group-hover:opacity-100 transition-opacity`}>
                        {style.icon}
                    </div>
                </div>
                <h3 className="text-2xl font-black text-slate-800 leading-tight">{title}</h3>
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-1">{description}</p>
            </div>

            {/* Metrics */}
            <div className="px-8 flex-1 pt-8 overflow-hidden flex flex-col">
                {/* Confidence Meter */}
                <div className="space-y-3 mb-8">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <span>Reliability Score</span>
                        <span className={style.text}>{result.confidence}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${style.accent} rounded-full transition-all duration-1000 ease-out`}
                            style={{ width: `${confidenceValue}%` }}
                        />
                    </div>
                </div>

                {/* Answer Content */}
                <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Output</span>
                    <div className="relative flex-1 overflow-hidden bg-slate-50/50 rounded-2xl border border-slate-100 p-6 shadow-inner">
                        <div className="h-full overflow-y-auto custom-scrollbar text-sm leading-relaxed text-slate-600 font-medium pr-2">
                            {result.error ? (
                                <div className="text-red-500 font-bold flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" />
                                    {result.error}
                                </div>
                            ) : result.answer}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Footer */}
            <div className="p-8 mt-auto border-t border-slate-50 flex items-center justify-between bg-slate-50/10">
                <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Retrieved Data</span>
                    <span className="text-sm font-black text-slate-800 tracking-tight">{result.citations?.length || 0} Segment{result.citations?.length === 1 ? '' : 's'}</span>
                </div>
                <div className="flex -space-x-2.5">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className={`w-9 h-9 rounded-full border-2 border-white ${style.accent} shadow-md flex items-center justify-center`}>
                            <ArrowRight className="w-3 h-3 text-white opacity-40" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
