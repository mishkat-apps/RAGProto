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
            animate={{ y: 0 }}
            className={`fixed top-0 w-full z-50 transition-all duration-500 px-6 py-4 flex justify-center`}
        >
            <motion.div
                animate={{
                    width: isScrolled ? '90%' : '100%',
                    maxWidth: isScrolled ? '1000px' : '1400px',
                    borderRadius: isScrolled ? '24px' : '0px',
                    y: isScrolled ? 10 : 0
                }}
                className={`relative w-full transition-all duration-500 overflow-hidden ${isScrolled
                        ? 'bg-[var(--background)]/70 backdrop-blur-xl border border-[var(--border)] shadow-[0_8px_32px_rgba(0,0,0,0.1)]'
                        : 'bg-transparent border-b border-[var(--border)]'
                    }`}
            >
                {/* Liquid Glow Border (Only when scrolled) */}
                <AnimatePresence>
                    {isScrolled && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 -z-10 animate-liquid-glow pointer-events-none"
                            style={{
                                padding: '1px',
                                background: 'linear-gradient(90deg, var(--tz-green), var(--tz-gold), var(--tz-blue), var(--tz-green))',
                                mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
                                maskComposite: 'exclude',
                                WebkitMaskComposite: 'xor',
                            }}
                        />
                    )}
                </AnimatePresence>

                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl gradient-btn flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <BookOpen className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-bold text-xl tracking-tight text-[var(--foreground)] hidden sm:block">NECTA RAG</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8 ml-8">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.name}
                                    href={link.href}
                                    className="relative text-sm font-bold text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors uppercase tracking-widest group/link"
                                >
                                    {link.name}
                                    {pathname === link.href && (
                                        <motion.div
                                            layoutId="nav-underline"
                                            className="absolute -bottom-1 left-0 right-0 h-0.5 gradient-tz rounded-full"
                                        />
                                    )}
                                </Link>
                            ))}
                        </nav>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <Link href="/auth/signin">
                            <button className="hidden sm:block text-sm font-bold text-[var(--foreground)] hover:bg-[var(--muted)] px-5 py-2.5 rounded-xl transition-all">Sign In</button>
                        </Link>
                        <Link href="/auth/signup">
                            <button className="px-6 py-2.5 gradient-tz rounded-xl text-sm font-bold text-white shadow-xl hover:opacity-90 transition-all active:scale-95">Sign Up</button>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.header>
    );
}
