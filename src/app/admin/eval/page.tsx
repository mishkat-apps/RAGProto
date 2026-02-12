'use client';

import { useState } from 'react';
import { BarChart3, Play, Loader2, CheckCircle2, Star } from 'lucide-react';

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
    const [progress, setProgress] = useState(0);

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
        setProgress(0);

        const newResults: EvalResult[] = [];

        for (let i = 0; i < questions.length; i++) {
            try {
                const res = await fetch('/api/ask', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ question: questions[i].question }),
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
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Evaluation</h1>
                <p className="text-[var(--muted-foreground)]">
                    Test RAG quality by running a batch of questions and rating the results.
                </p>
            </div>

            {/* Question input */}
            <div className="glass rounded-2xl p-6 mb-8">
                <label className="block text-sm font-medium mb-3 text-[var(--muted-foreground)]">
                    Questions (JSON array)
                </label>
                <textarea
                    value={questionsJson}
                    onChange={(e) => setQuestionsJson(e.target.value)}
                    rows={8}
                    className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono text-sm transition-colors"
                />
                <div className="mt-4 flex items-center gap-4">
                    <button
                        onClick={runEval}
                        disabled={running}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 font-semibold flex items-center gap-2 hover:from-purple-500 hover:to-violet-400 disabled:opacity-50 transition-all shadow-lg shadow-purple-500/20"
                    >
                        {running ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Running ({progress}%)
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4" />
                                Run Evaluation
                            </>
                        )}
                    </button>
                    {running && (
                        <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Results */}
            {results.length > 0 && (
                <div className="space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-purple-400" />
                        Results ({results.length})
                    </h2>

                    {results.map((result, i) => (
                        <div key={i} className="glass rounded-2xl p-6">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-medium text-sm mb-1">Q: {result.question}</p>
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${result.confidence === 'high'
                                                ? 'bg-green-500/15 text-green-400'
                                                : result.confidence === 'medium'
                                                    ? 'bg-yellow-500/15 text-yellow-400'
                                                    : 'bg-red-500/15 text-red-400'
                                            }`}
                                    >
                                        {result.confidence}
                                    </span>
                                </div>
                            </div>

                            <p className="text-sm text-[var(--muted-foreground)] mb-4 leading-relaxed">
                                {result.answer.slice(0, 500)}
                                {result.answer.length > 500 ? '...' : ''}
                            </p>

                            {result.citations.length > 0 && (
                                <div className="mb-4 flex flex-wrap gap-2">
                                    {result.citations.map((c, j) => (
                                        <span
                                            key={j}
                                            className="text-xs px-2 py-1 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20"
                                        >
                                            {c.chapter} pp. {c.page_start || '?'}-{c.page_end || '?'}
                                        </span>
                                    ))}
                                </div>
                            )}

                            {/* Rating controls */}
                            <div className="flex items-center gap-6 pt-3 border-t border-[var(--border)]">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--muted-foreground)]">Relevance:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => updateRating(i, 'relevance_rating', star)}
                                                className="transition-colors"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${(result.relevance_rating || 0) >= star
                                                            ? 'text-yellow-400 fill-yellow-400'
                                                            : 'text-[var(--border)]'
                                                        }`}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--muted-foreground)]">Citations OK:</span>
                                    <button
                                        onClick={() => updateRating(i, 'citation_correct', !result.citation_correct)}
                                        className={`w-5 h-5 rounded border transition-colors flex items-center justify-center ${result.citation_correct
                                                ? 'bg-green-500 border-green-500'
                                                : 'border-[var(--border)]'
                                            }`}
                                    >
                                        {result.citation_correct && <CheckCircle2 className="w-3 h-3 text-white" />}
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-[var(--muted-foreground)]">Quality:</span>
                                    <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => updateRating(i, 'answer_quality', star)}
                                                className="transition-colors"
                                            >
                                                <Star
                                                    className={`w-4 h-4 ${(result.answer_quality || 0) >= star
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
