'use client';

import { SignInForm } from '@/components/auth/SignInForm';

export default function SignInPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[var(--primary)]/5 via-transparent to-[var(--accent-blue)]/5 -z-10" />
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-[var(--tz-green)]/10 rounded-full blur-[100px] -z-10 animate-float" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-[var(--tz-blue)]/10 rounded-full blur-[100px] -z-10 animate-float" style={{ animationDelay: '2s' }} />

            <SignInForm />
        </div>
    );
}
