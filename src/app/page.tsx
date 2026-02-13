'use client';

import Link from 'next/link';
import {
  BookOpen,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  Library,
  Sparkles,
  MessageSquare,
  FileUp,
  Twitter,
  Github,
  Linkedin,
  ChevronRight
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--background)] selection:bg-[var(--primary)]/10 flex flex-col">
      {/* Sticky Navigation */}
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
            <button className="hidden sm:block text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)] px-5 py-2.5 rounded-xl transition-all">Sign In</button>
            <button className="px-6 py-2.5 gradient-tz rounded-xl text-sm font-bold text-white shadow-xl hover:opacity-90 transition-all active:scale-95">Sign Up</button>
          </div>

        </div>
      </header>

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
      </main>

      {/* Footer */}
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
                <Twitter className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
                <Github className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
                <Linkedin className="w-5 h-5 hover:text-[var(--primary)] cursor-pointer transition-colors" />
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
                <li><a href="#" className="text-sm text-[var(--muted-foreground)] hover:text-[var(--primary)]">Contact Us</a></li>
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
