'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AboutSection } from '@/components/AboutSection';
import { motion, useScroll, useTransform } from 'framer-motion';

export default function AboutPage() {
    const { scrollYProgress } = useScroll();
    const auraOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.1, 0.2, 0.1]);

    return (
        <div className="min-h-screen bg-[var(--background)] flex flex-col relative">
            {/* Background Storytelling Aura */}
            <motion.div
                style={{ opacity: auraOpacity }}
                className="fixed inset-0 bg-gradient-to-tr from-[var(--primary)]/20 via-[var(--accent)]/10 to-[var(--accent-blue)]/20 blur-[150px] -z-10"
            />

            <Header />

            <main className="flex-1 pt-32 pb-20">
                <AboutSection />
            </main>

            <Footer />
        </div>
    );
}
