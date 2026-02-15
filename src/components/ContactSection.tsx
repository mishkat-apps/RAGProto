'use client';

import { Mail, MessageSquare, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export function ContactSection() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 }
    };

    return (
        <section id="contact" className="py-20 px-6 relative">
            <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={containerVariants}
                className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16"
            >
                <div className="space-y-8">
                    <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--accent-blue)]/10 text-[var(--accent-blue)] border border-[var(--accent-blue)]/20 text-xs font-bold uppercase tracking-widest">
                        <MessageSquare className="w-3.5 h-3.5" />
                        Support
                    </motion.div>

                    <motion.h2 variants={itemVariants} className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">
                        Let's start a <span className="gradient-text">Conversation</span>
                    </motion.h2>

                    <motion.p variants={itemVariants} className="text-lg text-[var(--muted-foreground)] leading-relaxed font-medium">
                        Have questions about a specific textbook? Need technical support?
                        Our team is dedicated to ensuring you have the best study experience possible.
                    </motion.p>

                    <motion.div variants={itemVariants} className="space-y-6">
                        <div className="flex items-center gap-4 p-6 rounded-2xl bg-[var(--card)] border border-[var(--border)] group hover:border-[var(--accent-blue)]/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-[var(--accent-blue)]/10 flex items-center justify-center text-[var(--accent-blue)] group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-[var(--muted-foreground)] uppercase tracking-wider">Email Us</p>
                                <p className="text-lg font-bold text-[var(--foreground)]">support@nectarag.co.tz</p>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <motion.div
                    variants={itemVariants}
                    className="p-8 md:p-10 rounded-[2.5rem] bg-[var(--card)] border border-[var(--border)] shadow-2xl relative overflow-hidden"
                >
                    {/* Interior glow */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-blue)]/5 blur-[80px] -z-10" />

                    <form className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] ml-1">Full Name</label>
                                <input type="text" className="w-full px-5 py-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent-blue)] outline-none transition-all font-medium" placeholder="John Doe" />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] ml-1">Email Address</label>
                                <input type="email" className="w-full px-5 py-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent-blue)] outline-none transition-all font-medium" placeholder="john@example.com" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--foreground)] ml-1">Subject</label>
                            <input type="text" className="w-full px-5 py-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent-blue)] outline-none transition-all font-medium" placeholder="How can we help?" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[var(--foreground)] ml-1">Message</label>
                            <textarea rows={4} className="w-full px-5 py-4 rounded-2xl bg-[var(--background)] border border-[var(--border)] focus:border-[var(--accent-blue)] outline-none transition-all font-medium resize-none" placeholder="Your message here..." />
                        </div>

                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-5 rounded-2xl gradient-tz text-white font-bold shadow-[0_10px_30px_rgba(30,129,176,0.3)] hover:shadow-[0_15px_40px_rgba(30,129,176,0.4)] transition-all flex items-center justify-center gap-3 relative overflow-hidden group"
                        >
                            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity animate-liquid-glow" />
                            <Send className="w-5 h-5" />
                            Send Message
                        </motion.button>
                    </form>
                </motion.div>
            </motion.div>
        </section>
    );
}

function ContactInfoCard({ icon, title, detail, href }: { icon: React.ReactNode, title: string, detail: string, href: string }) {
    return (
        <a href={href} className="flex items-center gap-4 p-6 rounded-2xl bg-[var(--background)] border border-[var(--border)] hover:border-[var(--primary)]/30 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-[var(--muted)] flex items-center justify-center text-[var(--primary)] group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <div>
                <p className="text-xs font-bold text-[var(--muted-foreground)] uppercase tracking-widest">{title}</p>
                <p className="text-[var(--foreground)] font-bold">{detail}</p>
            </div>
        </a>
    );
}
