'use client';

import { Info, Target, Users, BookOpen } from 'lucide-react';

export function AboutSection() {
    return (
        <section id="about" className="py-32 px-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--primary)]/5 rounded-full blur-[100px] -z-10" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="space-y-8">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-bold uppercase tracking-widest">
                        <Info className="w-3.5 h-3.5" />
                        Our Mission
                    </div>

                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                        Bridging the gap in <span className="gradient-text">Tanzanian Education</span>
                    </h2>

                    <p className="text-lg text-[var(--muted-foreground)] leading-relaxed font-medium">
                        NECTA RAG was born out of a simple goal: to make official Tanzanian textbooks
                        accessible and interactive for every student. By combining the power of
                        Retrieval-Augmented Generation (RAG) with curated NECTA curriculum, we provide
                        a trusted digital tutor available 24/7.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
                            <Target className="w-8 h-8 text-[var(--tz-gold)]" />
                            <h3 className="font-bold text-[var(--foreground)]">Accuracy First</h3>
                            <p className="text-sm text-[var(--muted-foreground)]">Zero hallucinations. Every answer is grounded in official Ministry materials.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3">
                            <Users className="w-8 h-8 text-[var(--tz-green)]" />
                            <h3 className="font-bold text-[var(--foreground)]">For Everyone</h3>
                            <p className="text-sm text-[var(--muted-foreground)]">Designed for both urban and rural schools to democratize quality education resources.</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div className="aspect-square rounded-[3rem] gradient-tz opacity-10 absolute -inset-4 rotate-3 -z-10" />
                    <div className="aspect-square rounded-[3rem] border-2 border-[var(--border)] bg-[var(--background)] glass flex items-center justify-center p-12 overflow-hidden group">
                        <div className="text-center space-y-6">
                            <div className="w-24 h-24 rounded-3xl gradient-btn mx-auto flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                                <BookOpen className="w-12 h-12 text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-3xl font-black gradient-text">100% Official</p>
                                <p className="text-[var(--muted-foreground)] font-medium">NECTA Verified Sources</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
