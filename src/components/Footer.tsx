'use client';

import Link from 'next/link';
import {
    BookOpen,
    Twitter,
    Github,
    Linkedin,
    ChevronRight
} from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-[var(--card)] border-t border-[var(--border)] pt-20 pb-10 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
                    <div className="col-span-1 md:col-span-1 space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg gradient-btn flex items-center justify-center text-white">
                                <BookOpen className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-lg text-[var(--foreground)]">NECTA RAG</span>
                        </div>
                        <p className="text-sm text-[var(--muted-foreground)] leading-relaxed">
                            Empowering students and teachers in Tanzania with AI-powered retrieval from official educational materials.
                        </p>
                        <div className="flex items-center gap-4 text-[var(--muted-foreground)]">
                            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
                                <Twitter className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
                            </a>
                            <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                                <Github className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
                            </a>
                            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                                <Linkedin className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
                            </a>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)]">Product</h4>
                        <ul className="space-y-4">
                            <li><Link href="/chat" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Ask Mwalimu</Link></li>
                            <li><Link href="/admin/upload" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Teacher Portal</Link></li>
                            <li><a href="#" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Syllabus Coverage</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)]">Support</h4>
                        <ul className="space-y-4">
                            <li><a href="#" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Help Center</a></li>
                            <li><a href="#" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Documentation</a></li>
                            <li><a href="#contact" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Contact Us</a></li>
                        </ul>
                    </div>

                    <div className="space-y-6">
                        <h4 className="font-bold text-sm uppercase tracking-widest text-[var(--foreground)]">Newsletter</h4>
                        <p className="text-sm text-[var(--muted-foreground)]">Get updates on new textbook arrivals and features.</p>
                        <div className="flex gap-2">
                            <input type="email" placeholder="Email" className="flex-1 min-w-0 bg-[var(--muted)] border border-[var(--border)] rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                            <button className="p-2.5 gradient-tz rounded-xl text-white shadow-lg"><ChevronRight className="w-4 h-4" /></button>
                        </div>
                    </div>
                </div>

                <div className="pt-10 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-6">
                    <p className="text-xs text-[var(--muted-foreground)]">
                        © {new Date().getFullYear()} NECTA RAG Pro. Built for Tanzania Secondary education.
                    </p>
                    <div className="flex items-center gap-8 text-xs text-[var(--muted-foreground)]">
                        <a href="#" className="hover:text-[var(--foreground)]">Privacy Policy</a>
                        <a href="#" className="hover:text-[var(--foreground)]">Terms of Service</a>
                        <a href="#" className="hover:text-[var(--foreground)]">Cookies</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
