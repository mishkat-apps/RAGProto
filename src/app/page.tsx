'use client';

import Link from 'next/link';
import { BookOpen, Search, ArrowRight, ShieldCheck, Zap, Library, Sparkles } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)]/10">
      {/* Header placeholder */}
      <header className="fixed top-0 w-full z-50 bg-[var(--card)]/80 backdrop-blur-md border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl gradient-btn flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-[var(--foreground)]">NECTA RAG</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/admin/books" className="text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest">Admin</Link>
          <Link href="/chat" className="px-5 py-2.5 gradient-btn rounded-xl text-sm font-bold text-white shadow-lg hover:opacity-90 transition-all active:scale-95">Launch App</Link>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto flex flex-col items-center">
        {/* Hero Section */}
        <div className="text-center space-y-8 max-w-3xl mb-24 animate-slide-up">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-xs font-bold uppercase tracking-widest animate-pulse-glow">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Learning
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-[var(--foreground)]">
            Master Your Studies with <span className="gradient-text">Textbook AI</span>
          </h1>

          <p className="text-lg md:text-xl text-[var(--muted-foreground)] leading-relaxed">
            Instant answers with citations directly from NECTA secondary textbooks.
            Simplified learning for Geography, Biology, and more.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/chat"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              Start Asking Questions
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/admin/upload"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] font-bold text-lg hover:bg-[var(--muted)] transition-all flex items-center justify-center gap-3"
            >
              Upload Textbooks
            </Link>
          </div>
        </div>

        {/* Quick Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full animate-fade-in [animation-delay:0.3s]">
          <FeatureCard
            icon={<Search className="w-6 h-6" />}
            title="Smart RAG Search"
            description="Our AI finds the exact paragraphs you need and cites them accurately."
          />
          <FeatureCard
            icon={<Zap className="w-6 h-6" />}
            title="Full Textbook Mode"
            description="Switch to CAG mode to analyze entire books in one comprehensive context."
          />
          <FeatureCard
            icon={<ShieldCheck className="w-6 h-6" />}
            title="Verified Content"
            description="Answers restricted to official NECTA curriculum—no halluncinations."
          />
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="glass p-10 rounded-[2.5rem] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all hover:shadow-xl group">
      <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 flex items-center justify-center mb-8 text-[var(--primary)] group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">{title}</h3>
      <p className="text-[var(--muted-foreground)] leading-relaxed">{description}</p>
    </div>
  );
}
