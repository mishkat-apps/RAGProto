'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, Loader2, BookOpen, AlertCircle } from 'lucide-react';
import { createSupabaseBrowser } from '@/lib/supabase/client';

export function SignInForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const supabase = createSupabaseBrowser();

    const handleSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            window.location.href = '/chat';
        }
    };

    const handleGoogleSignIn = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/api/auth/callback`,
            },
        });
    };

    return (
        <div className="w-full max-w-md space-y-8 animate-slide-up">
            <div className="text-center space-y-2">
                <Link href="/" className="inline-flex items-center gap-3 group mb-4">
                    <div className="w-12 h-12 rounded-2xl gradient-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                </Link>
                <h1 className="text-3xl font-black text-[var(--foreground)] tracking-tight">Welcome Back</h1>
                <p className="text-[var(--muted-foreground)] font-medium">Continue your learning journey with NECTA RAG</p>
            </div>

            <div className="glass p-8 rounded-[2.5rem] border border-[var(--border)] shadow-2xl space-y-6">
                {error && (
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 text-red-600 border border-red-100 animate-shake">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm font-bold">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest ml-1">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="mwanafunzi@shule.ac.tz"
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center ml-1">
                            <label className="text-xs font-bold text-[var(--foreground)] uppercase tracking-widest">Password</label>
                            <a href="#" className="text-xs font-bold text-[var(--primary)] hover:underline">Forgot?</a>
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--muted-foreground)]" />
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl pl-12 pr-6 py-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                                disabled={loading}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 gradient-tz rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[var(--border)]"></div></div>
                    <div className="relative flex justify-center text-xs uppercase tracking-widest font-bold font-medium"><span className="bg-[var(--card)] px-4 text-[var(--muted-foreground)]">Or continue with</span></div>
                </div>

                <button
                    onClick={handleGoogleSignIn}
                    type="button"
                    className="w-full py-4 border border-[var(--border)] rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-[var(--muted)] transition-all active:scale-95"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1.02.68-2.33 1.09-3.71 1.09-2.85 0-5.27-1.92-6.13-4.51H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.87 14.15c-.22-.68-.35-1.44-.35-2.15s.13-1.47.35-2.15V7.01H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.99l3.69-2.84z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.01l3.69 2.84c.86-2.59 3.28-4.51 6.13-4.51z" fill="#EA4335" />
                    </svg>
                    Google Account
                </button>
            </div>

            <p className="text-center text-sm font-medium text-[var(--muted-foreground)]">
                Don&apos;t have an account? <Link href="/auth/signup" className="text-[var(--primary)] font-bold hover:underline">Join the scholars</Link>
            </p>
        </div>
    );
}
