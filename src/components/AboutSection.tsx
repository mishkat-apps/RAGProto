'use client';

import { Info, Target, Users, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export function AboutSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <section id="about" className="py-20 px-6 relative overflow-hidden">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
                className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center"
            >
                <div className="space-y-8">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 text-xs font-bold uppercase tracking-widest">
                        <Info className="w-3.5 h-3.5" />
                        Our Mission
                    </motion.div>

                    <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                        Bridging the gap in <span className="gradient-text">Tanzanian Education</span>
                    </motion.h2>

                    <motion.p variants={itemVariants} className="text-lg text-[var(--muted-foreground)] leading-relaxed font-medium">
                        NECTA RAG was born out of a simple goal: to make official Tanzanian textbooks
                        accessible and interactive for every student. By combining the power of
                        Retrieval-Augmented Generation (RAG) with curated NECTA curriculum, we provide
                        a trusted digital tutor available 24/7.
                    </motion.p>

                    <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3 hover:shadow-lg transition-all group">
                            <Target className="w-8 h-8 text-[var(--tz-gold)] group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-[var(--foreground)]">Accuracy First</h3>
                            <p className="text-sm text-[var(--muted-foreground)]">Zero hallucinations. Every answer is grounded in official Ministry materials.</p>
                        </div>
                        <div className="p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] space-y-3 hover:shadow-lg transition-all group">
                            <Users className="w-8 h-8 text-[var(--tz-green)] group-hover:scale-110 transition-transform" />
                            <h3 className="font-bold text-[var(--foreground)]">For Everyone</h3>
                            <p className="text-sm text-[var(--muted-foreground)]">Designed for both urban and rural schools to democratize quality education resources.</p>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="relative"
                >
                    <div className="aspect-square rounded-[3rem] gradient-tz opacity-10 absolute -inset-4 rotate-3 -z-10" />
                    <motion.div
                        whileHover={{ scale: 1.02 }}
                        className="aspect-square rounded-[3rem] border-2 border-[var(--border)] bg-[var(--background)] glass flex items-center justify-center p-12 overflow-hidden group"
                    >
                        <div className="text-center space-y-6">
                            <motion.div
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 4 }}
                                className="w-24 h-24 rounded-3xl gradient-btn mx-auto flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500"
                            >
                                <BookOpen className="w-12 h-12 text-white" />
                            </motion.div>
                            <div className="space-y-2">
                                <p className="text-3xl font-black gradient-text">100% Official</p>
                                <p className="text-[var(--muted-foreground)] font-medium uppercase tracking-widest text-xs">NECTA Verified Sources</p>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </section>
    );
}
