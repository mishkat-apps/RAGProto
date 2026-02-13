'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Upload, Library, BarChart3, ArrowLeft, Menu, X } from 'lucide-react';

const navLinks = [
    { href: '/admin/upload', icon: Upload, label: 'Upload Textbook' },
    { href: '/admin/books', icon: Library, label: 'Books' },
    { href: '/admin/eval', icon: BarChart3, label: 'Evaluation' },
];

const SidebarContent = ({ pathname, setSidebarOpen }: { pathname: string, setSidebarOpen: (open: boolean) => void }) => (
    <>
        <div className="p-6 border-b border-[var(--border)]">
            <Link href="/" className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center shadow-md">
                    <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg text-[var(--foreground)]">NECTA RAG</span>
            </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
            {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                    <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${isActive
                            ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)]'
                            }`}
                    >
                        <link.icon className="w-4 h-4" />
                        {link.label}
                    </Link>
                );
            })}
        </nav>

        <div className="p-4 border-t border-[var(--border)]">
            <Link
                href="/chat"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                Back to Chat
            </Link>
        </div>
    </>
);

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const pathname = usePathname();

    return (
        <div className="min-h-screen flex">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Mobile drawer */}
            <aside
                className={`fixed inset-y-0 left-0 w-64 bg-[var(--card)] border-r border-[var(--border)] flex flex-col z-50 transform transition-transform duration-300 md:relative md:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Mobile close button */}
                <button
                    onClick={() => setSidebarOpen(false)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] md:hidden"
                >
                    <X className="w-5 h-5" />
                </button>
                <SidebarContent pathname={pathname} setSidebarOpen={setSidebarOpen} />
            </aside>

            {/* Main content */}
            <main className="flex-1 overflow-auto min-w-0">
                {/* Mobile header */}
                <div className="sticky top-0 z-30 bg-[var(--card)]/80 backdrop-blur-lg border-b border-[var(--border)] px-4 py-3 flex items-center gap-3 md:hidden">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="p-2 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)]"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                    <span className="font-semibold text-sm text-[var(--foreground)]">NECTA RAG Admin</span>
                </div>
                <div className="max-w-5xl mx-auto p-4 md:p-8">{children}</div>
            </main>
        </div>
    );
}
