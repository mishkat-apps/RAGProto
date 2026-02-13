'use client';

import React from 'react';
import { Palette, Flag } from 'lucide-react';
import { useTheme } from './ThemeProvider';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="w-10 h-10" />; // Placeholder for layout stability
    }

    return (
        <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all hover:bg-[var(--muted)] group relative"
            title={`Switch to ${theme === 'standard' ? 'Tanzania' : 'Standard'} Theme`}
        >
            <div className={`p-1.5 rounded-lg transition-all ${theme === 'tanzania'
                ? 'bg-[#1EB53A] text-white'
                : 'bg-[var(--muted)] text-[var(--muted-foreground)] group-hover:text-[var(--primary)]'
                }`}>
                {theme === 'tanzania' ? <Flag className="w-4 h-4" /> : <Palette className="w-4 h-4" />}
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--foreground)] hidden sm:inline">
                {theme === 'tanzania' ? 'Tanzania' : 'Standard'}
            </span>

            {/* Tooltip hint */}
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 px-2 py-1 bg-[var(--foreground)] text-[var(--background)] text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none font-bold uppercase tracking-widest z-50">
                Theme: {theme}
            </div>
        </button>
    );
}
