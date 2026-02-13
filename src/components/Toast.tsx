'use client';

import { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`
                            pointer-events-auto flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border
                            animate-slide-up bg-white min-w-[320px] max-w-md
                            ${toast.type === 'success' ? 'border-emerald-100' : ''}
                            ${toast.type === 'error' ? 'border-red-100' : ''}
                            ${toast.type === 'warning' ? 'border-amber-100' : ''}
                            ${toast.type === 'info' ? 'border-blue-100' : ''}
                        `}
                    >
                        <div className={`
                            w-10 h-10 rounded-xl flex items-center justify-center shrink-0
                            ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-600' : ''}
                            ${toast.type === 'error' ? 'bg-red-50 text-red-600' : ''}
                            ${toast.type === 'warning' ? 'bg-amber-50 text-amber-600' : ''}
                            ${toast.type === 'info' ? 'bg-blue-50 text-blue-600' : ''}
                        `}>
                            {toast.type === 'success' && <CheckCircle className="w-5 h-5" />}
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
                            {toast.type === 'info' && <Info className="w-5 h-5" />}
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-bold text-[var(--foreground)]">{toast.message}</p>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
