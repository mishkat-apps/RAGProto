'use client';

import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
    return (
        <header className="fixed top-0 w-full z-50 bg-[var(--background)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4">
            <div className="max-w-7xl mx-auto flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <BookOpen className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-[var(--foreground)]">NECTA RAG</span>
                    </Link>
                    <nav className="hidden md:flex items-center gap-8 ml-8">
                        <a href="#features" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest">Features</a>
                        <a href="#about" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest">About</a>
                        <Link href="/admin/books" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest">Admin</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <Link href="/auth/signin">
                        <button className="hidden sm:block text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)] px-5 py-2.5 rounded-xl transition-all">Sign In</button>
                    </Link>
                    <Link href="/auth/signup">
                        <button className="px-6 py-2.5 gradient-tz rounded-xl text-sm font-bold text-white shadow-xl hover:opacity-90 transition-all active:scale-95">Sign Up</button>
                    </Link>
                </div>
            </div>
        </header>
    );
}
