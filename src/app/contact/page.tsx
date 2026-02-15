'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ContactSection } from '@/components/ContactSection';
import { motion } from 'framer-motion';

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col relative overflow-hidden">
            {/* Background Floating Orbs */}
            <motion.div
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="fixed top-20 -left-20 w-80 h-80 bg-[var(--tz-green)]/10 blur-[120px] rounded-full -z-10"
            />
            <motion.div
                animate={{
                    x: [0, -80, 0],
                    y: [0, 100, 0],
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                className="fixed bottom-20 -right-20 w-80 h-80 bg-[var(--tz-blue)]/10 blur-[120px] rounded-full -z-10"
            />

            <Header />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-6 mb-12 text-center">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl font-bold tracking-tight mb-4"
                    >
                        Get in <span className="gradient-text">Touch</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[var(--muted-foreground)] text-lg max-w-2xl mx-auto"
                    >
                        Whether you are a student, teacher, or partner, we are here to help you navigate
                        the NECTA curriculum with ease.
                    </motion.p>
                </div>
                <ContactSection />
            </main>

            <Footer />
        </div>
    );
}
