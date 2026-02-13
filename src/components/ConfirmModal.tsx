'use client';

import { X, AlertTriangle } from 'lucide-react';
import { useEffect } from 'react';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'primary';
    isLoading?: boolean;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'primary',
    isLoading = false
}: ConfirmModalProps) {
    // Lock scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-[2rem] shadow-2xl border border-[var(--border)] w-full max-w-md overflow-hidden animate-slide-up">
                <div className="p-8">
                    <div className="flex items-center gap-4 mb-6">
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center shrink-0
                            ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-[var(--primary)]/10 text-[var(--primary)]'}
                        `}>
                            {variant === 'danger' ? <AlertTriangle className="w-6 h-6" /> : <X className="w-6 h-6 rotate-45" />}
                        </div>
                        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
                    </div>

                    <p className="text-[var(--muted-foreground)] leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-6 py-3 rounded-xl border border-[var(--border)] text-sm font-bold text-[var(--muted-foreground)] hover:bg-[var(--muted)] transition-all disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`
                                flex-1 px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2
                                ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'gradient-tz hover:opacity-90'}
                            `}
                        >
                            {isLoading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : null}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
