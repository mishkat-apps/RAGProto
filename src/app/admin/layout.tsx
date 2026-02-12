import Link from 'next/link';
import { BookOpen, Upload, Library, BarChart3, ArrowLeft } from 'lucide-react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen flex">
            {/* Sidebar */}
            <aside className="w-64 border-r border-[var(--border)] bg-[var(--card)] flex flex-col">
                <div className="p-6 border-b border-[var(--border)]">
                    <Link href="/" className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg">NECTA RAG</span>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    <Link
                        href="/admin/upload"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-white hover:bg-purple-600/10 transition-colors"
                    >
                        <Upload className="w-4 h-4" />
                        Upload Textbook
                    </Link>
                    <Link
                        href="/admin/books"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-white hover:bg-purple-600/10 transition-colors"
                    >
                        <Library className="w-4 h-4" />
                        Books
                    </Link>
                    <Link
                        href="/admin/eval"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--muted-foreground)] hover:text-white hover:bg-purple-600/10 transition-colors"
                    >
                        <BarChart3 className="w-4 h-4" />
                        Evaluation
                    </Link>
                </nav>

                <div className="p-4 border-t border-[var(--border)]">
                    <Link
                        href="/chat"
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-purple-400 hover:bg-purple-600/10 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Chat
                    </Link>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto">
                <div className="max-w-5xl mx-auto p-8">{children}</div>
            </main>
        </div>
    );
}
