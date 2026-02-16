'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { name: 'Features', href: '/#features' },
        { name: 'About', href: '/about' },
        { name: 'Contact', href: '/contact' },
    ];

    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{
                y: 0,
                height: isScrolled ? '64px' : '88px',
                backgroundColor: isScrolled ? 'rgba(var(--background-rgb), 0.95)' : 'rgba(var(--background-rgb), 0.5)',
                backdropFilter: 'blur(20px)',
            }}
            style={{ width: '100VW', left: 0, right: 0 }}
            className={`fixed top-0 z-50 transition-all duration-500 border-b ${isScrolled ? 'border-border/50 shadow-lg' : 'border-transparent'
                }`}
        >
            <div className="w-full max-w-7xl mx-auto px-6 h-full flex items-center justify-between relative">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center gap-3 group">
                        <motion.div
                            animate={{ scale: isScrolled ? 0.9 : 1 }}
                            className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"
                        >
                            <BookOpen className="w-5 h-5 text-white" />
                        </motion.div>
                        <motion.span
                            animate={{ opacity: 1, x: 0 }}
                            className="font-bold text-xl tracking-tight text-[var(--foreground)] hidden sm:block"
                        >
                            NECTA RAG
                        </motion.span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                href={link.href}
                                className="relative text-xs font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-[0.2em] group/link"
                            >
                                {link.name}
                                {pathname === link.href && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="absolute -bottom-2 left-0 right-0 h-0.5 gradient-tz rounded-full shadow-[0_0_8px_rgba(30,181,58,0.4)]"
                                    />
                                )}
                            </Link>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <ThemeToggle />
                    <div className="hidden sm:flex items-center gap-3">
                        <Link href="/auth/signin">
                            <button className="text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)] px-5 py-2.5 rounded-xl transition-all">Sign In</button>
                        </Link>
                        <Link href="/auth/signup">
                            <button className="px-6 py-2.5 gradient-tz rounded-xl text-sm font-bold text-white shadow-xl hover:opacity-90 hover:scale-105 transition-all active:scale-95">Sign Up</button>
                        </Link>
                    </div>
                </div>

                {/* Horizon Line (Tanzanian Gradient) */}
                <AnimatePresence>
                    {isScrolled && (
                        <motion.div
                            initial={{ scaleX: 0, opacity: 0 }}
                            animate={{ scaleX: 1, opacity: 1 }}
                            exit={{ scaleX: 0, opacity: 0 }}
                            className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-[var(--tz-green)] via-[var(--tz-gold)] to-[var(--tz-blue)] origin-center"
                        />
                    )}
                </AnimatePresence>
            </div>
        </motion.header>
    );
}
