'use client';

import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-[var(--primary)]/5 via-transparent to-[var(--accent)]/5 -z-10" />
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-[var(--tz-gold)]/10 rounded-full blur-[100px] -z-10 animate-float" />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[var(--tz-green)]/10 rounded-full blur-[100px] -z-10 animate-float" style={{ animationDelay: '1s' }} />

            <SignUpForm />
        </div>
    );
}
