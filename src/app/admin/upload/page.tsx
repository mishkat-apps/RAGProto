'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

type UploadStatus = 'idle' | 'uploading' | 'ingesting' | 'success' | 'error';

export default function UploadPage() {
    const [file, setFile] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('Geography');
    const [form, setForm] = useState(4);
    const [language, setLanguage] = useState('en');
    const [publisher, setPublisher] = useState('');
    const [status, setStatus] = useState<UploadStatus>('idle');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [jobId, setJobId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((accepted: File[]) => {
        if (accepted.length > 0) {
            setFile(accepted[0]);
            if (!title) {
                setTitle(accepted[0].name.replace('.pdf', ''));
            }
        }
    }, [title]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        maxFiles: 1,
        maxSize: 100 * 1024 * 1024, // 100MB
    });

    const handleSubmit = async () => {
        if (!file || !title || !subject) return;

        setStatus('uploading');
        setError(null);

        try {
            // Upload to Supabase Storage
            const supabase = createSupabaseBrowser();
            const storagePath = `books/${Date.now()}-${file.name}`;

            setUploadProgress(10);

            const { error: uploadError } = await supabase.storage
                .from('textbooks')
                .upload(storagePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                });

            if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

            setUploadProgress(50);
            setStatus('ingesting');

            // Create ingest job
            const res = await fetch('/api/ingest', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    storage_path: storagePath,
                    title,
                    subject,
                    form,
                    language,
                    publisher: publisher || undefined,
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Failed to create ingest job');

            setJobId(data.job_id);
            setUploadProgress(100);
            setStatus('success');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
            setStatus('error');
        }
    };

    const subjects = ['Geography', 'History', 'Biology', 'Chemistry', 'Physics', 'Mathematics', 'English', 'Kiswahili', 'Civics'];

    return (
        <div className="animate-fade-in">
            <div className="mb-8">
                <h1 className="text-3xl font-bold gradient-text mb-2">Upload Textbook</h1>
                <p className="text-[var(--muted-foreground)]">
                    Upload a PDF textbook to process and add to the knowledge base.
                </p>
            </div>

            <div className="glass rounded-2xl p-8 max-w-2xl">
                {/* Dropzone */}
                <div
                    {...getRootProps()}
                    className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${isDragActive
                            ? 'border-purple-500 bg-purple-500/10'
                            : file
                                ? 'border-green-500/50 bg-green-500/5'
                                : 'border-[var(--border)] hover:border-purple-500/50 hover:bg-purple-500/5'
                        }`}
                >
                    <input {...getInputProps()} />
                    {file ? (
                        <div className="flex flex-col items-center gap-3">
                            <FileText className="w-12 h-12 text-green-400" />
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-[var(--muted-foreground)]">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <Upload className="w-12 h-12 text-[var(--muted-foreground)]" />
                            <p className="font-medium">
                                {isDragActive ? 'Drop the PDF here' : 'Drop a PDF textbook or click to browse'}
                            </p>
                            <p className="text-sm text-[var(--muted-foreground)]">Max 100 MB</p>
                        </div>
                    )}
                </div>

                {/* Metadata form */}
                <div className="mt-8 space-y-5">
                    <div>
                        <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
                            Book Title *
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Geography Form 4"
                            className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
                                Subject *
                            </label>
                            <select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            >
                                {subjects.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
                                Form *
                            </label>
                            <select
                                value={form}
                                onChange={(e) => setForm(Number(e.target.value))}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            >
                                {[1, 2, 3, 4, 5, 6].map((f) => (
                                    <option key={f} value={f}>Form {f}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
                                Language
                            </label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            >
                                <option value="en">English</option>
                                <option value="sw">Kiswahili</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2 text-[var(--muted-foreground)]">
                                Publisher
                            </label>
                            <input
                                type="text"
                                value={publisher}
                                onChange={(e) => setPublisher(e.target.value)}
                                placeholder="Optional"
                                className="w-full px-4 py-3 rounded-xl bg-[var(--muted)] border border-[var(--border)] focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-colors"
                            />
                        </div>
                    </div>
                </div>

                {/* Upload progress */}
                {status !== 'idle' && (
                    <div className="mt-6">
                        <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-purple-600 to-violet-500 transition-all duration-500 rounded-full"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            {status === 'uploading' && (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span className="text-sm text-[var(--muted-foreground)]">Uploading to storage...</span>
                                </>
                            )}
                            {status === 'ingesting' && (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                                    <span className="text-sm text-[var(--muted-foreground)]">Creating ingest job...</span>
                                </>
                            )}
                            {status === 'success' && (
                                <>
                                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                                    <span className="text-sm text-green-400">
                                        Job created! ID: {jobId}
                                    </span>
                                </>
                            )}
                            {status === 'error' && (
                                <>
                                    <AlertCircle className="w-4 h-4 text-red-400" />
                                    <span className="text-sm text-red-400">{error}</span>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* Submit button */}
                <button
                    onClick={handleSubmit}
                    disabled={!file || !title || status === 'uploading' || status === 'ingesting'}
                    className="mt-6 w-full py-3 px-6 rounded-xl font-semibold transition-all duration-200 bg-gradient-to-r from-purple-600 to-violet-500 hover:from-purple-500 hover:to-violet-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30"
                >
                    {status === 'uploading' || status === 'ingesting' ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Processing...
                        </span>
                    ) : (
                        'Upload & Queue Ingestion'
                    )}
                </button>

                {status === 'success' && (
                    <p className="mt-4 text-sm text-[var(--muted-foreground)] text-center">
                        To start processing, call <code className="px-2 py-1 rounded bg-[var(--muted)] text-purple-400">POST /api/worker/ingest</code> with your WORKER_SECRET, or click &ldquo;Run Worker&rdquo; on the Books page.
                    </p>
                )}
            </div>
        </div>
    );
}
