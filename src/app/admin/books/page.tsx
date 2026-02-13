'use client';

import { useState, useEffect } from 'react';
import {
    Library,
    RefreshCcw,
    Play,
    AlertCircle,
    CheckCircle2,
    Clock,
    MoreVertical,
    Trash2,
    Search,
    Filter,
    ChevronRight,
    SearchX
} from 'lucide-react';

interface Book {
    id: string;
    title: string;
    subject: string;
    form: number;
    language: string;
    publisher?: string;
    created_at: string;
    latest_job?: {
        id: string;
        status: 'queued' | 'running' | 'succeeded' | 'failed';
        progress: number;
        error?: string;
    };
}

export default function BooksPage() {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [runningJobId, setRunningJobId] = useState<string | null>(null);

    const fetchBooks = async () => {
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            setBooks(data.books || []);
        } catch (error) {
            console.error('Failed to fetch books:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchBooks();
        const interval = setInterval(fetchBooks, 5000); // Poll every 5s for progress
        return () => clearInterval(interval);
    }, []);

    const runWorker = async () => {
        setRefreshing(true);
        try {
            await fetch('/api/worker/run', { method: 'POST' });
            fetchBooks();
        } catch (error) {
            console.error('Failed to run worker:', error);
        }
    };

    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'succeeded': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
            case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'running': return <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />;
            default: return <Clock className="w-4 h-4 text-amber-500" />;
        }
    };

    const getStatusStyles = (status?: string) => {
        switch (status) {
            case 'succeeded': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            case 'failed': return 'bg-red-50 text-red-700 border-red-100';
            case 'running': return 'bg-blue-50 text-blue-700 border-blue-100';
            default: return 'bg-amber-50 text-amber-700 border-amber-100';
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Textbook Library</h1>
                    <p className="text-[var(--muted-foreground)] mt-1">Manage and monitor ingested textbooks for RAG.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => { setRefreshing(true); fetchBooks(); }}
                        disabled={refreshing}
                        className="p-2.5 rounded-xl border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-all"
                        title="Refresh list"
                    >
                        <RefreshCcw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={runWorker}
                        className="flex items-center gap-2 px-5 py-2.5 gradient-btn rounded-xl text-sm font-semibold text-white shadow-md hover:opacity-90 transition-all active:scale-95"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Run All Jobs
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass p-5 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Total Books</p>
                    <p className="text-2xl font-bold mt-1">{books.length}</p>
                </div>
                <div className="glass p-5 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Succeeded</p>
                    <p className="text-2xl font-bold mt-1 text-emerald-600">{books.filter(b => b.latest_job?.status === 'succeeded').length}</p>
                </div>
                <div className="glass p-5 rounded-2xl">
                    <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Failed / Queued</p>
                    <p className="text-2xl font-bold mt-1 text-amber-600">{books.filter(b => b.latest_job?.status !== 'succeeded').length}</p>
                </div>
            </div>

            {loading && books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--border)]">
                    <LoaderPulse />
                </div>
            ) : books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--border)] border-dashed">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-4">
                        <SearchX className="w-8 h-8 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-[var(--foreground)] font-semibold">No books found</p>
                    <p className="text-[var(--muted-foreground)] text-sm">Upload your first textbook to get started.</p>
                </div>
            ) : (
                <div className="glass rounded-3xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--muted)]/50">
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Book Details</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Subject & Form</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Progress</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Added On</th>
                                    <th className="px-6 py-4 text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {books.map((book) => (
                                    <tr key={book.id} className="hover:bg-[var(--muted)]/30 transition-colors">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center flex-shrink-0 text-[var(--primary)]">
                                                    <Library className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-semibold text-[var(--foreground)] truncate max-w-[200px]">{book.title}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)] uppercase tracking-tight">{book.publisher || 'Unknown Publisher'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-[var(--foreground)]">{book.subject}</span>
                                                <span className="text-xs text-[var(--muted-foreground)]">Form {book.form}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyles(book.latest_job?.status)}`}>
                                                {getStatusIcon(book.latest_job?.status)}
                                                <span className="capitalize">{book.latest_job?.status || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="w-32">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[10px] font-bold text-[var(--muted-foreground)]">{book.latest_job?.progress || 0}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-[var(--primary)] transition-all duration-1000"
                                                        style={{ width: `${book.latest_job?.progress || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-sm text-[var(--muted-foreground)]">
                                                {new Date(book.created_at).toLocaleDateString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-2">
                                                <button className="p-2 rounded-lg hover:bg-neutral-100 text-[var(--muted-foreground)] hover:text-red-600 transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                <button className="p-2 rounded-lg hover:bg-neutral-100 text-[var(--muted-foreground)] transition-colors">
                                                    <MoreVertical className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Show jobs without associated books if any */}
            <PendingJobsSection />
        </div>
    );
}

function LoaderPulse() {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 rounded-full bg-[var(--primary)] animate-bounce" />
        </div>
    );
}

function PendingJobsSection() {
    const [jobs, setJobs] = useState<any[]>([]);

    useEffect(() => {
        const fetchJobs = async () => {
            try {
                const res = await fetch('/api/jobs');
                const data = await res.json();
                // Filter jobs that don't have a book title in the UI for now, 
                // though usually jobs relate to books.
                setJobs((data.jobs || []).filter((j: any) => !j.book_id));
            } catch { }
        };
        fetchJobs();
    }, []);

    if (jobs.length === 0) return null;

    return (
        <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold text-[var(--foreground)] px-1">Other Background Tasks</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {jobs.map((job) => (
                    <div key={job.id} className="glass p-5 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-[var(--muted-foreground)]" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--foreground)]">System Job #{job.id.slice(0, 8)}</p>
                                <p className="text-xs text-[var(--muted-foreground)] capitalize">{job.status} • {job.progress}%</p>
                            </div>
                        </div>
                        <div className="w-20 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                            <div className="h-full bg-[var(--accent-blue)]" style={{ width: `${job.progress}%` }} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
