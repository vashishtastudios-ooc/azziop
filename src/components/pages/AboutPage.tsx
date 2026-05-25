'use client';

import { motion } from 'framer-motion';
import { Sparkles, Rocket, Code2, Brain, Heart, ArrowRight } from 'lucide-react';
import { usePipelineStore } from '@/store/pipeline';

export function AboutPage() {
    const setCurrentPage = usePipelineStore((state) => state.setCurrentPage);

    return (
        <div className="relative min-h-screen pt-24 pb-20 px-4 lg:px-8">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
            <div className="absolute inset-0 bg-mesh-gradient" />

            <div className="relative max-w-5xl mx-auto">

                {/* Hero */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-8">
                        <Heart className="w-4 h-4 text-rose-400" />
                        <span className="text-sm text-surface-300">Our Story</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]">
                        Marketing should be{' '}
                        <span className="text-gradient-purple">painless</span>
                    </h1>

                    <p className="text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
                        We believe every brand deserves stunning campaigns without the complexity,
                        cost, or time investment traditionally required.
                    </p>
                </motion.div>

                {/* Mission Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-24">
                    {[
                        {
                            icon: Rocket,
                            title: 'Our Mission',
                            description: 'Democratize professional marketing by making AI-powered campaign creation accessible to every business, from solo founders to agencies.',
                        },
                        {
                            icon: Brain,
                            title: 'The Technology',
                            description: 'Our proprietary 6-layer AI pipeline analyzes brands at a deeper level than traditional tools — extracting DNA, not just colors.',
                        },
                        {
                            icon: Code2,
                            title: 'Built Different',
                            description: 'Powered by Gemini Pro, every campaign is contextually aware of your brand identity, target audience, and industry best practices.',
                        },
                    ].map((card, i) => (
                        <motion.div
                            key={card.title}
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                            className="p-8 rounded-3xl glass-morphism border border-surface-800/50 hover:border-indigo-500/30 transition-all duration-300"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 flex items-center justify-center mb-6">
                                <card.icon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <h3 className="text-xl font-display font-semibold text-white mb-3">{card.title}</h3>
                            <p className="text-surface-400 leading-relaxed">{card.description}</p>
                        </motion.div>
                    ))}
                </div>

                {/* Founder Section */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="relative p-10 md:p-14 rounded-3xl glass-morphism border border-surface-800/50 overflow-hidden mb-20"
                >
                    {/* Decorative gradient */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-radial from-indigo-500/10 to-transparent blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-radial from-violet-500/10 to-transparent blur-3xl" />

                    <div className="relative flex flex-col md:flex-row items-center gap-10">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-rose-500 p-[3px]">
                                <div className="w-full h-full rounded-full bg-surface-900 flex items-center justify-center">
                                    <span className="text-4xl md:text-5xl font-display font-bold text-gradient-purple">SV</span>
                                </div>
                            </div>
                        </div>

                        {/* Bio */}
                        <div className="text-center md:text-left">
                            <span className="text-xs uppercase tracking-widest text-indigo-400 font-mono mb-2 block">Founder & Creator</span>
                            <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                                Siddhartha Vashishta
                            </h2>
                            <p className="text-lg text-surface-300 leading-relaxed mb-4">
                                Passionate about the intersection of AI and creative marketing, Siddhartha built
                                No Pain Marketing to solve a problem he experienced firsthand — the struggle of
                                creating professional, on-brand marketing campaigns quickly and affordably.
                            </p>
                            <p className="text-surface-400 leading-relaxed">
                                With a vision to make world-class marketing accessible to everyone, he designed
                                the 6-layer AI pipeline that powers NoPain — turning any website URL into a
                                complete marketing campaign in under 60 seconds.
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center"
                >
                    <button
                        onClick={() => {
                            setCurrentPage('home');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="group inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-indigo-600/25"
                    >
                        <Sparkles className="w-5 h-5" />
                        <span>Try It Now — It&apos;s Free</span>
                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                </motion.div>
            </div>
        </div>
    );
}
