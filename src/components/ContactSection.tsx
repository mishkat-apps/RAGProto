'use client';

import { Mail, MessageSquare, Send, MapPin, Phone } from 'lucide-react';

export function ContactSection() {
    return (
        <section id="contact" className="py-32 px-6 bg-[var(--card)]/30 border-t border-[var(--border)]">
            <div className="max-w-7xl mx-auto space-y-16">
                <div className="text-center space-y-4">
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[var(--foreground)]">Get in Touch</h2>
                    <p className="text-[var(--muted-foreground)] max-w-xl mx-auto font-medium">
                        Have questions about NECTA RAG? Whether you&apos;re a student, teacher, or school administrator, we&apos;re here to help.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Contact Info Cards */}
                    <div className="lg:col-span-1 space-y-6">
                        <ContactInfoCard
                            icon={<Mail className="w-5 h-5" />}
                            title="Email Us"
                            detail="info@nectarag.co.tz"
                            href="mailto:info@nectarag.co.tz"
                        />
                        <ContactInfoCard
                            icon={<Phone className="w-5 h-5" />}
                            title="Call Us"
                            detail="+255 700 000 000"
                            href="tel:+255700000000"
                        />
                        <ContactInfoCard
                            icon={<MapPin className="w-5 h-5" />}
                            title="Office"
                            detail="Dar es Salaam, Tanzania"
                            href="#"
                        />
                    </div>

                    {/* Contact Form */}
                    <div className="lg:col-span-2">
                        <div className="glass p-8 md:p-12 rounded-[2.5rem] border border-[var(--border)] shadow-2xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[var(--foreground)] ml-1">Full Name</label>
                                    <input type="text" placeholder="John Doe" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[var(--foreground)] ml-1">Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[var(--foreground)] ml-1">Message</label>
                                <textarea rows={4} placeholder="How can we help you?" className="w-full bg-[var(--background)] border border-[var(--border)] rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors resize-none"></textarea>
                            </div>
                            <button className="w-full py-4 gradient-tz rounded-2xl text-white font-bold flex items-center justify-center gap-2 shadow-xl hover:opacity-90 transition-all active:scale-95">
                                <Send className="w-4 h-4" />
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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
