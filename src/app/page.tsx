import Link from 'next/link';
import { BookOpen, MessageSquare, Settings, Upload } from 'lucide-react';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* Hero */}
      <div className="text-center mb-16 animate-slide-up">
        <div className="inline-flex items-center gap-3 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
        </div>
        <h1 className="text-5xl font-extrabold gradient-text mb-4">
          NECTA Textbook RAG
        </h1>
        <p className="text-lg text-[var(--muted-foreground)] max-w-xl mx-auto">
          AI-powered question answering for Tanzanian secondary school textbooks.
          Upload a textbook, ask questions, and get cited answers.
        </p>
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full animate-fade-in">
        <Link href="/chat" className="group">
          <div className="glass rounded-2xl p-8 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 flex items-center justify-center mb-4 group-hover:bg-purple-600/30 transition-colors">
              <MessageSquare className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Ask Questions</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Chat with your textbooks and get answers with chapter & page citations.
            </p>
          </div>
        </Link>

        <Link href="/admin/upload" className="group">
          <div className="glass rounded-2xl p-8 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-violet-600/20 flex items-center justify-center mb-4 group-hover:bg-violet-600/30 transition-colors">
              <Upload className="w-6 h-6 text-violet-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Upload Textbook</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              Upload a PDF textbook and ingest it into the knowledge base.
            </p>
          </div>
        </Link>

        <Link href="/admin/books" className="group">
          <div className="glass rounded-2xl p-8 transition-all duration-300 hover:border-purple-500/40 hover:shadow-lg hover:shadow-purple-500/10 hover:-translate-y-1">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 flex items-center justify-center mb-4 group-hover:bg-indigo-600/30 transition-colors">
              <Settings className="w-6 h-6 text-indigo-400" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Manage Books</h2>
            <p className="text-sm text-[var(--muted-foreground)]">
              View ingested books, check job statuses, and re-run ingestion.
            </p>
          </div>
        </Link>
      </div>
    </main>
  );
}
