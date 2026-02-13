'use client';

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function UploadPage() {
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [form, setForm] = useState('1');
    const [language, setLanguage] = useState('en');
    const [publisher, setPublisher] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        onDrop: (acceptedFiles) => setFile(acceptedFiles[0])
    });

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title || !subject) return;

        setUploading(true);
        setProgress(0);
        setStatus(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('title', title);
        formData.append('subject', subject);
        formData.append('form', form);
        formData.append('language', language);
        if (publisher) formData.append('publisher', publisher);

        try {
            // Simulated progress for better UX before actual API call
            const progressInterval = setInterval(() => {
                setProgress(prev => (prev < 90 ? prev + 5 : prev));
            }, 500);

            const res = await fetch('/api/admin/books/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setProgress(100);

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Upload failed');

            setStatus({ type: 'success', message: 'Textbook uploaded and queued for ingestion!' });
            setTitle('');
            setSubject('');
            setPublisher('');
            setFile(null);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Upload failed';
            setStatus({ type: 'error', message });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-[var(--foreground)] tracking-tight">Add New Textbook</h1>
                <p className="text-[var(--muted-foreground)] mt-1">Upload a PDF textbook and our AI will parse it into the knowledge base.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-7 space-y-6">
                    <form onSubmit={handleUpload} className="glass rounded-3xl p-8 space-y-5 shadow-sm">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider ml-1">Book Title</label>
                            <input
                                required
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g. Geography for Secondary Schools"
                                className="w-full px-5 py-3.5 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all shadow-inner"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider ml-1">Subject</label>
                                <input
                                    required
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="e.g. Geography"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all shadow-inner"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider ml-1">Form Level</label>
                                <select
                                    value={form}
                                    onChange={(e) => setForm(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-all cursor-pointer"
                                >
                                    {[1, 2, 3, 4, 5, 6].map(n => (
                                        <option key={n} value={n}>Form {n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider ml-1">Language</label>
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none transition-all cursor-pointer"
                                >
                                    <option value="en">English</option>
                                    <option value="sw">Swahili</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] uppercase tracking-wider ml-1">Publisher</label>
                                <input
                                    type="text"
                                    value={publisher}
                                    onChange={(e) => setPublisher(e.target.value)}
                                    placeholder="e.g. TIE, Oxford"
                                    className="w-full px-5 py-3.5 rounded-2xl bg-[var(--muted)] border border-[var(--border)] focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]/50 transition-all shadow-inner"
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={!file || !title || !subject || uploading}
                                className="w-full py-4 rounded-2xl gradient-btn text-white font-bold text-lg shadow-lg hover:opacity-90 disabled:opacity-50 disabled:translate-y-0 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                            >
                                {uploading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Uploading {progress}%
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-5 h-5" />
                                        Upload Textbook
                                    </>
                                )}
                            </button>
                        </div>

                        {status && (
                            <div className={`mt-4 p-4 rounded-xl border flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'
                                }`}>
                                {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                                <p className="text-sm font-medium">{status.message}</p>
                            </div>
                        )}
                    </form>
                </div>

                {/* Dropzone Section */}
                <div className="lg:col-span-5">
                    <div
                        {...getRootProps()}
                        className={`h-full min-h-[300px] border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${isDragActive
                            ? 'border-[var(--primary)] bg-[var(--primary)]/5 scale-[1.02]'
                            : file
                                ? 'border-emerald-400 bg-emerald-50/30'
                                : 'border-[var(--border)] hover:border-[var(--primary)]/50 hover:bg-[var(--muted)]'
                            }`}
                    >
                        <input {...getInputProps()} />

                        {file ? (
                            <div className="animate-fade-in flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4 text-emerald-600">
                                    <FileText className="w-10 h-10" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-bold text-[var(--foreground)] truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-[var(--muted-foreground)] font-medium">{(file.size / 1024 / 1024).toFixed(2)} MB • PDF</p>
                                </div>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                    className="mt-6 flex items-center gap-2 text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest bg-red-50 px-4 py-2 rounded-full"
                                >
                                    <X className="w-3.5 h-3.5" />
                                    Remove File
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-20 h-20 rounded-2xl bg-[var(--muted)] flex items-center justify-center mb-6 text-[var(--muted-foreground)] group-hover:text-[var(--primary)] transition-colors">
                                    <Upload className="w-10 h-10" />
                                </div>
                                <h3 className="text-lg font-bold text-[var(--foreground)] mb-2">Select PDF File</h3>
                                <p className="text-sm text-[var(--muted-foreground)] max-w-[200px]">
                                    Drag and drop your textbook PDF here or click to browse
                                </p>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
