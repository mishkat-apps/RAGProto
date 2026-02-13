'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Library,
    RefreshCcw,
    Play,
    AlertCircle,
    CheckCircle2,
    Clock,
    Trash2,
    Search,
    ChevronRight,
    SearchX,
    RotateCcw
} from 'lucide-react';
import { useToast } from '@/components/Toast';
import ConfirmModal from '@/components/ConfirmModal';

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
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'succeeded' | 'failed' | 'processing'>('all');

    // Management states
    const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const { showToast } = useToast();

    const fetchBooks = useCallback(async (isSilent = false) => {
        if (!isSilent) setRefreshing(true);
        try {
            const res = await fetch('/api/books');
            const data = await res.json();
            setBooks(data.books || []);
        } catch (error) {
            console.error('Failed to fetch books:', error);
            showToast('Failed to load textbook library', 'error');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [showToast]);

    // Initial load
    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    // Intelligent Polling: Only poll if there are active jobs
    useEffect(() => {
        const hasActiveJobs = books.some(b =>
            b.latest_job?.status === 'running' || b.latest_job?.status === 'queued'
        );

        if (!hasActiveJobs) return;

        const interval = setInterval(() => {
            fetchBooks(true);
        }, 3000);

        return () => clearInterval(interval);
    }, [books, fetchBooks]);

    const runWorker = async () => {
        setRefreshing(true);
        try {
            const res = await fetch('/api/worker/run', { method: 'POST' });
            if (res.ok) {
                showToast('Worker triggered successfully. Ingestion started.', 'success');
                fetchBooks();
            } else {
                throw new Error('Worker failed to start');
            }
        } catch {
            showToast('Failed to start worker', 'error');
        } finally {
            setRefreshing(false);
        }
    };

    const handleDeleteBook = async () => {
        if (!bookToDelete) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/books/${bookToDelete.id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast(`"${bookToDelete.title}" deleted successfully`, 'success');
                setBooks(prev => prev.filter(b => b.id !== bookToDelete.id));
                setBookToDelete(null);
            } else {
                const data = await res.json();
                throw new Error(data.error || 'Delete failed');
            }
        } catch (error) {
            showToast(error instanceof Error ? error.message : 'Failed to delete book', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredBooks = useMemo(() => {
        return books.filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                book.subject.toLowerCase().includes(searchQuery.toLowerCase());

            if (statusFilter === 'all') return matchesSearch;
            if (statusFilter === 'succeeded') return matchesSearch && book.latest_job?.status === 'succeeded';
            if (statusFilter === 'failed') return matchesSearch && book.latest_job?.status === 'failed';
            if (statusFilter === 'processing') return matchesSearch && (book.latest_job?.status === 'running' || book.latest_job?.status === 'queued');
            return matchesSearch;
        });
    }, [books, searchQuery, statusFilter]);

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
        <div className="space-y-8 animate-fade-in pb-20">
            <ConfirmModal
                isOpen={!!bookToDelete}
                onClose={() => setBookToDelete(null)}
                onConfirm={handleDeleteBook}
                isLoading={isDeleting}
                title="Delete Textbook?"
                message={`Are you sure you want to delete "${bookToDelete?.title}"? This will permanently remove all associated sections, chunks, and the PDF file from storage.`}
                variant="danger"
                confirmText="Delete Permanently"
            />

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-extrabold text-[var(--foreground)] tracking-tight">Textbook Library</h1>
                    <p className="text-[var(--muted-foreground)] mt-2 font-medium">Manage and monitor NECTA secondary textbooks.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => fetchBooks()}
                        disabled={refreshing}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--border)] bg-white hover:bg-[var(--muted)] text-[var(--foreground)] font-bold text-sm transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={runWorker}
                        className="flex items-center gap-2 px-6 py-2.5 gradient-tz rounded-xl text-sm font-bold text-white shadow-xl hover:opacity-90 transition-all active:scale-95"
                    >
                        <Play className="w-4 h-4 fill-current" />
                        Run All Queued
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <StatCard label="Total Books" value={books.length} icon={<Library className="w-4 h-4" />} />
                <StatCard label="Completed" value={books.filter(b => b.latest_job?.status === 'succeeded').length} color="text-emerald-600" icon={<CheckCircle2 className="w-4 h-4" />} />
                <StatCard label="In Processing" value={books.filter(b => b.latest_job?.status === 'running' || b.latest_job?.status === 'queued').length} color="text-blue-600" icon={<RefreshCcw className="w-4 h-4" />} />
                <StatCard label="Failed" value={books.filter(b => b.latest_job?.status === 'failed').length} color="text-red-600" icon={<AlertCircle className="w-4 h-4" />} />
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] group-focus-within:text-[var(--primary)] transition-colors" />
                    <input
                        type="text"
                        placeholder="Search by title or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-2xl text-sm font-medium focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/5 transition-all"
                    />
                </div>
                <div className="flex items-center gap-2 p-1 bg-[var(--muted)]/50 rounded-2xl border border-[var(--border)]">
                    <FilterButton active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>All</FilterButton>
                    <FilterButton active={statusFilter === 'processing'} onClick={() => setStatusFilter('processing')}>Active</FilterButton>
                    <FilterButton active={statusFilter === 'succeeded'} onClick={() => setStatusFilter('succeeded')}>Done</FilterButton>
                    <FilterButton active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')}>Fail</FilterButton>
                </div>
            </div>

            {loading && books.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 glass rounded-[2.5rem] border border-[var(--border)]">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-3 h-3 rounded-full bg-[var(--primary)] animate-bounce" />
                    </div>
                </div>
            ) : filteredBooks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 glass rounded-[2.5rem] border border-[var(--border)] border-dashed">
                    <div className="w-20 h-20 rounded-3xl bg-[var(--muted)] flex items-center justify-center mb-6">
                        <SearchX className="w-10 h-10 text-[var(--muted-foreground)]" />
                    </div>
                    <p className="text-xl font-bold text-[var(--foreground)]">No results match your view</p>
                    <p className="text-[var(--muted-foreground)] font-medium">Try changing filters or adding new textbooks.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Desktop View */}
                    <div className="hidden xl:block glass rounded-[2rem] overflow-hidden border border-[var(--border)] shadow-xl">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[var(--muted)]/30">
                                    <th className="px-8 py-5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">Textbook Detail</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">Subject/Class</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">Ingestion Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em]">Progress</th>
                                    <th className="px-6 py-5 text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.2em] text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {filteredBooks.map((book) => (
                                    <tr key={book.id} className="hover:bg-[var(--primary)]/[0.02] transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/5 flex items-center justify-center flex-shrink-0 text-[var(--primary)] group-hover:scale-110 transition-transform">
                                                    <Library className="w-6 h-6" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-bold text-[var(--foreground)] truncate max-w-[280px]">{book.title}</p>
                                                    <p className="text-xs text-[var(--muted-foreground)] font-medium mt-0.5">{book.publisher || 'Official Press'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-[var(--foreground)]">{book.subject}</span>
                                                <span className="text-xs text-[var(--muted-foreground)] font-medium">Form {book.form} Secondary</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border ${getStatusStyles(book.latest_job?.status)}`}>
                                                {getStatusIcon(book.latest_job?.status)}
                                                <span className="capitalize">{book.latest_job?.status || 'Uploaded'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 font-mono text-xs">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1 h-2 bg-[var(--muted)] rounded-full overflow-hidden w-24">
                                                    <div
                                                        className={`h-full transition-all duration-700 ${book.latest_job?.status === 'failed' ? 'bg-red-400' : 'bg-[var(--primary)]'}`}
                                                        style={{ width: `${book.latest_job?.progress || 0}%` }}
                                                    />
                                                </div>
                                                <span className="font-bold text-[var(--muted-foreground)]">{book.latest_job?.progress || 0}%</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {book.latest_job?.status === 'failed' && (
                                                    <button
                                                        onClick={runWorker}
                                                        className="p-2.5 rounded-xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                                                        title="Retry Ingestion"
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {!book.latest_job && (
                                                    <button
                                                        onClick={runWorker}
                                                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                                                        title="Start Ingestion"
                                                    >
                                                        <Play className="w-4 h-4 fill-current" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setBookToDelete(book)}
                                                    className="p-2.5 rounded-xl hover:bg-red-50 hover:text-red-600 text-[var(--muted-foreground)] transition-all shadow-sm active:scale-95 border border-transparent hover:border-red-100"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Tablet/Mobile Grid View */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:hidden gap-6">
                        {filteredBooks.map((book) => (
                            <div key={book.id} className="glass p-6 rounded-[2.5rem] flex flex-col gap-6 shadow-sm border border-[var(--border)]">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/5 flex items-center justify-center flex-shrink-0 text-[var(--primary)]">
                                            <Library className="w-6 h-6" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-extrabold text-[var(--foreground)] truncate text-lg leading-tight">{book.title}</p>
                                            <p className="text-[10px] text-[var(--muted-foreground)] uppercase tracking-widest font-bold mt-1">{book.subject} • Form {book.form}</p>
                                        </div>
                                    </div>
                                    <div className={`p-2 rounded-xl border ${getStatusStyles(book.latest_job?.status)}`}>
                                        {getStatusIcon(book.latest_job?.status)}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-3xl bg-[var(--muted)]/30 border border-[var(--border)]">
                                        <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.1em] mb-1">Status</p>
                                        <p className="text-xs font-bold capitalize">{book.latest_job?.status || 'Uploaded'}</p>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-[var(--muted)]/30 border border-[var(--border)]">
                                        <p className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.1em] mb-1">Created</p>
                                        <p className="text-xs font-bold">{new Date(book.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted-foreground)]">
                                        <span>Pipeline Progress</span>
                                        <span className="font-mono">{book.latest_job?.progress || 0}%</span>
                                    </div>
                                    <div className="w-full h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-1000 ${book.latest_job?.status === 'failed' ? 'bg-red-400' : 'bg-[var(--primary)]'}`}
                                            style={{ width: `${book.latest_job?.progress || 0}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 pt-4 border-t border-[var(--border)] border-dashed">
                                    <button
                                        onClick={() => setBookToDelete(book)}
                                        className="w-12 h-12 rounded-2xl bg-white border border-[var(--border)] text-red-600 transition-all flex items-center justify-center shadow-sm active:scale-95"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                    <button className="flex-1 h-12 rounded-2xl gradient-tz text-white text-xs font-bold shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2">
                                        View Analytics
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ label, value, color = "text-[var(--foreground)]", icon }: { label: string, value: number, color?: string, icon?: React.ReactNode }) {
    return (
        <div className="glass p-6 rounded-[2rem] border border-[var(--border)] shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black text-[var(--muted-foreground)] uppercase tracking-[0.1em]">{label}</span>
                <div className="text-[var(--muted-foreground)]/50">{icon}</div>
            </div>
            <p className={`text-3xl font-black ${color}`}>{value}</p>
        </div>
    );
}

function FilterButton({ active, children, onClick }: { active: boolean, children: React.ReactNode, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${active
                ? 'bg-white text-[var(--primary)] shadow-sm'
                : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
                }`}
        >
            {children}
        </button>
    );
}
