'use client';

import { useState, useEffect } from 'react';
import { BookOpen, RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Play } from 'lucide-react';

interface BookWithJob {
    id: string;
    title: string;
    subject: string;
    form: number;
    language: string;
    publisher: string | null;
    created_at: string;
    latest_job: {
        id: string;
        status: string;
        progress: number;
        error: string | null;
        updated_at: string;
    } | null;
}

export default function BooksPage() {
    const [books, setBooks] = useState<BookWithJob[]>([]);
    const [loading, setLoading] = useState(true);
    const [workerRunning, setWorkerRunning] = useState(false);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            setBooks(data.books || []);
        } catch {
            console.error('Failed to fetch books');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchBooks();
    }, []);

    const runWorker = async () => {
        setWorkerRunning(true);
        try {
            const secret = prompt('Enter WORKER_SECRET:');
            if (!secret) return;

            const res = await fetch('/api/worker/ingest', {
                method: 'POST',
                headers: { Authorization: `Bearer ${secret}` },
            });

            const data = await res.json();
            alert(data.message || JSON.stringify(data));
            fetchBooks();
        } catch (err) {
            alert(`Worker failed: ${err instanceof Error ? err.message : String(err)}`);
        }
        setWorkerRunning(false);
    };

    const statusIcon = (status: string) => {
        switch (status) {
            case 'succeeded':
                return <CheckCircle2 className="w-4 h-4 text-green-400" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-400" />;
            case 'running':
                return <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />;
            default:
                return <Clock className="w-4 h-4 text-[var(--muted-foreground)]" />;
        }
    };

    const statusBadge = (status: string) => {
        const colors: Record<string, string> = {
            succeeded: 'bg-green-500/15 text-green-400 border-green-500/30',
            failed: 'bg-red-500/15 text-red-400 border-red-500/30',
            running: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
            queued: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        };

        return (
            <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${colors[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30'
                    }`}
            >
                {statusIcon(status)}
                {status}
            </span>
        );
    };

    return (
        <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold gradient-text mb-2">Books</h1>
                    <p className="text-[var(--muted-foreground)]">
                        Manage ingested textbooks and their processing status.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={fetchBooks}
                        className="px-4 py-2 rounded-xl border border-[var(--border)] text-sm font-medium hover:bg-[var(--muted)] transition-colors flex items-center gap-2"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={runWorker}
                        disabled={workerRunning}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-violet-500 text-sm font-semibold hover:from-purple-500 hover:to-violet-400 transition-all flex items-center gap-2 shadow-lg shadow-purple-500/20"
                    >
                        {workerRunning ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Play className="w-4 h-4" />
                        )}
                        Run Worker
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
                </div>
            ) : books.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <BookOpen className="w-16 h-16 text-[var(--muted-foreground)] mx-auto mb-4" />
                    <h2 className="text-xl font-semibold mb-2">No books yet</h2>
                    <p className="text-[var(--muted-foreground)]">
                        Upload a textbook to get started.
                    </p>
                </div>
            ) : (
                <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[var(--border)]">
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Title
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Subject
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Form
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Status
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Progress
                                </th>
                                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--muted-foreground)]">
                                    Created
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {books.map((book) => (
                                <tr
                                    key={book.id}
                                    className="border-b border-[var(--border)] last:border-0 hover:bg-purple-500/5 transition-colors"
                                >
                                    <td className="px-6 py-4 font-medium">{book.title}</td>
                                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                                        {book.subject}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                                        Form {book.form}
                                    </td>
                                    <td className="px-6 py-4">
                                        {book.latest_job ? statusBadge(book.latest_job.status) : (
                                            <span className="text-sm text-[var(--muted-foreground)]">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {book.latest_job ? (
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden max-w-[100px]">
                                                    <div
                                                        className="h-full bg-purple-500 rounded-full transition-all"
                                                        style={{ width: `${book.latest_job.progress}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs text-[var(--muted-foreground)]">
                                                    {book.latest_job.progress}%
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-sm text-[var(--muted-foreground)]">—</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-[var(--muted-foreground)]">
                                        {new Date(book.created_at).toLocaleDateString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Show pending jobs without books */}
            <PendingJobs />
        </div>
    );
}

function PendingJobs() {
    const [jobs, setJobs] = useState<Array<{
        id: string;
        status: string;
        progress: number;
        error: string | null;
        metadata: Record<string, unknown>;
        created_at: string;
    }>>([]);

    useEffect(() => {
        fetch('/api/jobs')
            .then((r) => r.json())
            .then((d) => {
                const pending = (d.jobs || []).filter(
                    (j: { status: string }) => j.status === 'queued' || j.status === 'running'
                );
                setJobs(pending);
            })
            .catch(() => { });
    }, []);

    if (jobs.length === 0) return null;

    return (
        <div className="mt-8">
            <h2 className="text-lg font-semibold mb-4">Pending Jobs</h2>
            <div className="space-y-3">
                {jobs.map((job) => (
                    <div key={job.id} className="glass rounded-xl p-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">
                                {(job.metadata as { title?: string })?.title || 'Unnamed'}
                            </p>
                            <p className="text-xs text-[var(--muted-foreground)]">Job ID: {job.id}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="w-24 h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-yellow-500 rounded-full animate-pulse"
                                    style={{ width: `${job.progress}%` }}
                                />
                            </div>
                            <span className="text-xs text-yellow-400">{job.status}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
