'use client';

import Link from 'next/link';
import {
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  MessageSquare,
  FileUp,
  Library,
} from 'lucide-react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AboutSection } from '@/components/AboutSection';
import { ContactSection } from '@/components/ContactSection';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)]/10 flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-44 pb-32 px-6 overflow-hidden">
          {/* Decorative Gradient Orb */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[var(--primary)]/20 via-[var(--accent)]/20 to-[var(--accent-blue)]/20 rounded-full blur-[120px] -z-10 animate-float" />

          <div className="max-w-4xl mx-auto text-center space-y-10 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 text-xs font-bold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Learning Assistant
            </div>

            <div className="space-y-6">
              <h1 className="text-5xl md:text-8xl font-black tracking-tighter text-[var(--foreground)] leading-[0.9]">
                Learn Smarter with <br />
                <span className="gradient-text tracking-tighter">Official Textbooks</span>
              </h1>
              <p className="text-xl md:text-2xl text-[var(--muted-foreground)] max-w-2xl mx-auto font-medium">
                Instant answers with verified citations from the NECTA curriculum. Powering the next generation of Tanzanian scholars.
              </p>
            </div>

            {/* Search-style Prompt Box */}
            <div className="max-w-2xl mx-auto group">
              <Link href="/chat" className="relative block">
                <div className="absolute inset-0 bg-gradient-to-r from-[var(--primary)] to-[var(--accent-blue)] rounded-[2rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
                <div className="relative glass p-2 rounded-[2rem] flex items-center shadow-2xl border-white/50 group-hover:scale-[1.02] transition-transform">
                  <div className="flex-1 px-6 text-left text-[var(--muted-foreground)] font-medium">
                    Ask anything about your syllabus...
                  </div>
                  <div className="w-14 h-14 rounded-full gradient-tz flex items-center justify-center text-white shadow-lg">
                    <ArrowRight className="w-6 h-6" />
                  </div>
                </div>
              </Link>
            </div>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-10">
              <SuggestionCard
                href="/chat"
                icon={<MessageSquare className="w-5 h-5" />}
                title="Ask a Question"
                color="bg-emerald-50 text-emerald-600"
              />
              <SuggestionCard
                href="/admin/upload"
                icon={<FileUp className="w-5 h-5" />}
                title="Upload PDF"
                color="bg-amber-50 text-amber-600"
              />
              <SuggestionCard
                href="/admin/books"
                icon={<Library className="w-5 h-5" />}
                title="Manage Books"
                color="bg-blue-50 text-blue-600"
              />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 px-6 bg-[var(--card)]/50 border-y border-[var(--border)]">
          <div className="max-w-7xl mx-auto space-y-20">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">Everything you need to excel</h2>
              <p className="text-[var(--muted-foreground)] max-w-xl mx-auto font-medium">Deep RAG integration with official NECTA textbooks ensures 100% accuracy and zero hallucinations.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Search className="w-6 h-6 text-emerald-600" />}
                title="Accurate Citations"
                description="Every answer includes precise page numbers and chapter references from the origin textbook."
              />
              <FeatureCard
                icon={<Zap className="w-6 h-6 text-amber-600" />}
                title="Whole-Book Analysis"
                description="Switch to Contextual Analysis (CAG) mode to get summaries and insights across entire subjects."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-6 h-6 text-blue-600" />}
                title="Verified Content"
                description="Trained exclusively on official Ministry of Education materials for the Tanzanian curriculum."
              />
            </div>
          </div>
        </section>

        {/* CTA to About Page */}
        <section className="py-20 px-6 border-t border-[var(--border)]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Discover Our Story</h2>
            <p className="text-[var(--muted-foreground)] text-lg">
              Learn how we are leveraging AI to revolutionize the way students interact with the NECTA curriculum.
            </p>
            <Link href="/about">
              <button className="px-8 py-4 rounded-2xl bg-[var(--foreground)] text-[var(--background)] font-bold hover:scale-105 transition-transform">
                Read About Us
              </button>
            </Link>
          </div>
        </section>

        {/* CTA to Contact Page */}
        <section className="py-20 px-6 border-t border-[var(--border)]">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Get in Touch</h2>
            <p className="text-[var(--muted-foreground)] text-lg">
              Have questions or want to partner with us? We'd love to hear from you.
            </p>
            <Link href="/contact">
              <button className="px-8 py-4 rounded-2xl bg-[var(--primary)] text-white font-bold hover:scale-105 transition-transform">
                Contact Us
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function SuggestionCard({ href, icon, title, color }: { href: string, icon: React.ReactNode, title: string, color: string }) {
  return (
    <Link href={href} className="group flex flex-col items-center gap-3 p-6 glass rounded-3xl border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all hover:shadow-xl">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${color}`}>
        {icon}
      </div>
      <span className="font-bold text-sm text-[var(--foreground)]">{title}</span>
    </Link>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-10 rounded-[2.5rem] bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/20 transition-all group">
      <div className="w-14 h-14 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-[var(--foreground)] mb-4">{title}</h3>
      <p className="text-[var(--muted-foreground)] text-sm leading-relaxed font-medium">{description}</p>
    </div>
  );
}
