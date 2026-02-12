'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Play, Loader2, CheckCircle2, Star, Sparkles, BookOpen } from 'lucide-react';

interface EvalQuestion {
    question: string;
    expected_answer?: string;
}

interface EvalResult {
    question: string;
    answer: string;
    confidence: string;
    citations: Array<{
        book_title: string;
        chapter: string;
        page_start: number | null;
        page_end: number | null;
    }>;
    relevance_rating?: number;
    citation_correct?: boolean;
    answer_quality?: number;
}

interface BookOption {
    id: string;
    title: string;
    form: number;
}

export default function EvalPage() {
    const [questionsJson, setQuestionsJson] = useState(
        JSON.stringify(
            [
                { question: 'What is geographic research?' },
                { question: 'Explain the formation of fold mountains.' },
                { question: 'What are the types of rainfall?' },
            ],
            null,
            2
        )
    );
    const [results, setResults] = useState<EvalResult[]>([]);
    const [running, setRunning] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [books, setBooks] = useState<BookOption[]>([]);
    const [selectedBookId, setSelectedBookId] = useState<string>('');
    const [report, setReport] = useState<string | null>(null);

    useEffect(() => {
        fetch('/api/books')
            .then(res => res.json())
            .then(data => {
                const availableBooks = (data.books || []).filter((b: any) => b.latest_job?.status === 'succeeded');
                setBooks(availableBooks);
            })
            .catch(err => console.error('Failed to fetch books', err));
    }, []);

    const generateTestCases = async () => {
        if (!selectedBookId) {
            alert('Please select a book first.');
            return;
        }

        setGenerating(true);
        setReport(null);
        try {
            const res = await fetch('/api/admin/eval/generate-test-cases', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId: selectedBookId }),
            });

            const data = await res.json();
            if (data.questions) {
                setQuestionsJson(JSON.stringify(data.questions, null, 2));
            } else if (data.error) {
                alert(`Generation failed: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to connect to generation API.');
        } finally {
            setGenerating(false);
        }
    };

    const analyzeResults = async () => {
        if (results.length === 0) return;

        setAnalyzing(true);
        try {
            const res = await fetch('/api/admin/eval/analyze-results', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ results }),
            });

            const data = await res.json();
            if (data.report) {
                setReport(data.report);
                // Scroll to report
                setTimeout(() => {
                    document.getElementById('evaluation-report')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
            } else if (data.error) {
                alert(`Analysis failed: ${data.error}`);
            }
        } catch (err) {
            alert('Failed to connect to analysis API.');
        } finally {
            setAnalyzing(false);
        }
    };

    const runEval = async () => {
        let questions: EvalQuestion[];
        try {
            questions = JSON.parse(questionsJson);
        } catch {
            alert('Invalid JSON. Please paste a valid JSON array of questions.');
            return;
        }

        if (!Array.isArray(questions) || questions.length === 0) {
            alert('Please provide at least one question.');
            return;
        }

        setRunning(true);
        setResults([]);
        setReport(null);
        setProgress(0);

        const newResults: EvalResult[] = [];

        for (let i = 0; i < questions.length; i++) {
            try {
                const res = await fetch('/api/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        question: questions[i].question,
                        filters: selectedBookId ? { book_id: selectedBookId } : undefined
                    }),
                });

                const data = await res.json();

                newResults.push({
                    question: questions[i].question,
                    answer: data.answer || 'Error',
                    confidence: data.confidence || 'unknown',
                    citations: data.citations || [],
                });
            } catch {
                newResults.push({
                    question: questions[i].question,
                    answer: 'Error: Failed to get answer',
                    confidence: 'unknown',
                    citations: [],
                });
            }

            setProgress(Math.round(((i + 1) / questions.length) * 100));
            setResults([...newResults]);
        }

        setRunning(false);
    };

    const updateRating = (index: number, field: string, value: number | boolean) => {
        setResults((prev) =>
            prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
        );
    };

    return (
        <div className="animate-fade-in pb-20">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Evaluation</h1>
                    <p className="text-[var(--muted-foreground)]">
                        Test RAG quality by running a batch of questions and rating the results.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                {/* Book Selection & Controls */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="glass rounded-2xl p-6">
                        <label className="block text-sm font-semibold mb-3 text-[var(--muted-foreground)] uppercase tracking-wider">
                            Step 1: Select Target Book
                        </label>
                        <div className="relative">
                            <select
                                value={selectedBookId}
                                onChange={(e) => setSelectedBookId(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 text-sm transition-all appearance-none"
                            >
                                <option value="">All Ingested Content</option>
                                {books.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.title} (Form {b.form})
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                <BookOpen className="w-4 h-4" />
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-[var(--border)]">
                            <label className="block text-sm font-semibold mb-3 text-[var(--muted-foreground)] uppercase tracking-wider">
                                Quick Actions
                            </label>
                            <button
                                onClick={generateTestCases}
                                disabled={generating || !selectedBookId}
                                className="w-full px-4 py-3 rounded-xl border border-purple-500/30 bg-purple-500/5 text-purple-400 font-medium hover:bg-purple-500/10 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {generating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                Generate 3 Test Cases
                            </button>
                            {!selectedBookId && (
                                <p className="mt-2 text-[10px] text-center text-yellow-500/70 font-medium italic">
                                    Select a book to enable generation
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="glass rounded-2xl p-6">
                        <label className="block text-sm font-semibold mb-3 text-[var(--muted-foreground)] uppercase tracking-wider">
                            Execution
                        </label>
                        <button
                            onClick={runEval}
                            disabled={running}
                            className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 font-bold text-white flex items-center justify-center gap-2 hover:from-purple-500 hover:to-violet-400 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                        >
                            {running ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Running ({progress}%)
                                </>
                            ) : (
                                <>
                                    <Play className="w-5 h-5" />
                                    Run Evaluation
                                </>
                            )}
                        </button>
                        {running && (
                            <div className="mt-4 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Question input */}
                <div className="lg:col-span-2">
                    <div className="glass rounded-2xl p-6 h-full flex flex-col">
                        <label className="block text-sm font-semibold mb-3 text-[var(--muted-foreground)] uppercase tracking-wider">
                            Step 2: Questions (JSON array)
                        </label>
                        <textarea
                            value={questionsJson}
                            onChange={(e) => setQuestionsJson(e.target.value)}
                            className="flex-1 w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-sm transition-colors min-h-[300px]"
                        />
                        <p className="mt-3 text-[10px] text-[var(--muted-foreground)] flex items-center gap-2">
                            <CheckCircle2 className="w-3 h-3 text-green-500" />
                            Format: Array of objects with "question" field.
                        </p>
                    </div>
                </div>
            </div>

            {/* Analysis Result */}
            {report && (
                <div id="evaluation-report" className="mb-10 animate-slide-up">
                    <div className="p-1 rounded-3xl bg-gradient-to-r from-purple-500/30 via-violet-500/30 to-blue-500/30 shadow-2xl">
                        <div className="glass rounded-[22px] p-8">
                            <h2 className="text-2xl font-bold flex items-center gap-3 mb-6">
                                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                                    <BarChart3 className="w-6 h-6" />
                                </span>
                                AI Performance Analysis
                            </h2>
                            <div className="prose prose-invert max-w-none
                                    prose-headings:text-purple-300 prose-headings:font-bold prose-headings:mb-4 prose-headings:mt-8
                                    prose-p:text-[var(--muted-foreground)] prose-p:leading-relaxed prose-p:mb-4
                                    prose-strong:text-white prose-strong:font-bold
                                    prose-li:text-[var(--muted-foreground)] prose-li:mb-2
                                    whitespace-pre-wrap text-sm leading-relaxed"
                            >
                                {report}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            Results ({results.length})
                        </h2>
                        {!running && (
                            <button
                                onClick={analyzeResults}
                                disabled={analyzing}
                                className="px-4 py-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {analyzing ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Sparkles className="w-4 h-4" />
                                )}
                                Analyze with AI
                            </button>
                        )}
                    </div>
                    {results.map((result, i) => (
                        <div key={i} className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
                            <div className="flex items-start justify-between mb-4 gap-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg mb-1">{result.question}</h3>
                                    <span
                                        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${result.confidence === 'high'
                                            ? 'bg-green-500/15 text-green-400'
                                            : result.confidence === 'medium'
                                                ? 'bg-yellow-500/15 text-yellow-400'
                                                : 'bg-red-500/15 text-red-400'
                                            }`}
                                    >
                                        {result.confidence} Confidence
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--muted-foreground)] mb-6 leading-relaxed bg-[var(--muted)]/30 p-4 rounded-xl border border-[var(--border)]">
                                {result.answer}
                            </p>

                            {result.citations.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-[10px] font-bold text-[var(--muted-foreground)] mb-2 uppercase tracking-wider">Sources Found</p>
                                    <div className="flex flex-wrap gap-2">
                                        {result.citations.map((c, j) => (
                                            <span
                                                key={j}
                                                className="text-[10px] font-medium px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                            >
                                                {c.book_title} — {c.chapter} (pp. {c.page_start || '?'}-{c.page_end || '?'})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Rating controls */}
                            <div className="flex flex-wrap items-center gap-x-8 gap-y-4 pt-5 border-t border-[var(--border)]">
                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Relevance</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => updateRating(i, 'relevance_rating', star)}
                                                className="transition-transform hover:scale-125 active:scale-95"
                                            >
                                                <Star
                                                    className={`w-5 h-5 ${(result.relevance_rating || 0) >= star
                                                        ? 'text-yellow-400 fill-yellow-400'
                                                        : 'text-[var(--border)]'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Citations Correct</span>
                                    <button
                                        onClick={() => updateRating(i, 'citation_correct', !result.citation_correct)}
                                        className={`w-6 h-6 rounded-lg border transition-all flex items-center justify-center ${result.citation_correct
                                            ? 'bg-green-500 border-green-500 shadow-lg shadow-green-500/20'
                                            : 'border-[var(--border)] hover:border-green-500/50'
                                            }`}
                                    >
                                        {result.citation_correct && <CheckCircle2 className="w-4 h-4 text-white" />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted-foreground)]">Quality</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => updateRating(i, 'answer_quality', star)}
                                                className="transition-transform hover:scale-125 active:scale-95"
                                            >
                                                <Star
                                                    className={`w-5 h-5 ${(result.answer_quality || 0) >= star
                                                        ? 'text-purple-400 fill-purple-400'
                                                        : 'text-[var(--border)]'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
