'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

const faqs = [
    {
        question: 'How long does it take to generate a campaign?',
        answer: 'Our 6-layer AI pipeline processes most websites in under 60 seconds. Complex sites with lots of content may take slightly longer, but you\'ll typically have complete campaign assets within 2 minutes.',
    },
    {
        question: 'What platforms are supported for export?',
        answer: 'We generate optimized creatives for all major social platforms including Instagram (posts, stories, reels), Facebook, Twitter/X, LinkedIn, TikTok, and Pinterest. Each export is sized and formatted specifically for that platform.',
    },
    {
        question: 'Can I edit the generated creatives?',
        answer: 'Absolutely! All generated creatives can be edited in our built-in editor. Adjust colors, text, layouts, and images to perfectly match your vision before exporting.',
    },
    {
        question: 'What if the AI misunderstands my brand?',
        answer: 'You can refine the brand DNA extraction by providing additional context or correcting specific elements. The AI learns from your feedback to generate more accurate results in future sessions.',
    },
    {
        question: 'Is there a limit to how many campaigns I can generate?',
        answer: 'This depends on your plan. Free users get 5 campaigns per month. Pro users get unlimited campaign generation with priority processing and advanced features.',
    },
    {
        question: 'How does the AI image generation work?',
        answer: 'We use advanced AI models to generate custom product shots and lifestyle images based on your brand DNA. Simply describe what you want, and the AI creates unique, royalty-free visuals that match your brand aesthetic.',
    },
    {
        question: 'Do I need a website to use the platform?',
        answer: 'Yes, you need a publicly accessible website URL. Our AI scrapes your site to extract brand colors, fonts, messaging, and visual identity. The richer your website content, the better the results.',
    },
    {
        question: 'Can I cancel my subscription anytime?',
        answer: 'Yes! There are no long-term contracts. You can upgrade, downgrade, or cancel your plan at any time. Your campaigns and assets remain accessible even after cancellation.',
    },
    {
        question: 'Is my data secure?',
        answer: 'Absolutely. We only read publicly available website content. We do not store your website data beyond what\'s needed for campaign generation. All data is encrypted in transit and at rest.',
    },
    {
        question: 'What makes No Pain Marketing different from Canva or other tools?',
        answer: 'Unlike generic design tools, our AI deeply understands your brand. It doesn\'t just provide templates — it extracts your brand DNA and generates campaigns that are strategically aligned with your identity, audience, and industry. Everything is created specifically for your brand, not adapted from generic templates.',
    },
];

export function FAQPage() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);
    const router = useRouter();

    return (
        <div className="relative min-h-screen pt-24 pb-20 px-4 lg:px-8">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
            <div className="absolute inset-0 bg-mesh-gradient" />

            <div className="relative max-w-3xl mx-auto">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-8">
                        <HelpCircle className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm text-surface-300">FAQ</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]">
                        Frequently Asked{' '}
                        <span className="text-gradient-purple">Questions</span>
                    </h1>

                    <p className="text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed">
                        Everything you need to know about No Pain Marketing.
                    </p>
                </motion.div>

                {/* FAQ List */}
                <div className="space-y-4 mb-20">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 + index * 0.05 }}
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full p-6 rounded-2xl bg-surface-900/50 border border-surface-800 hover:border-surface-700 transition-all duration-300 text-left group"
                            >
                                <div className="flex items-center justify-between gap-4">
                                    <h3 className="text-lg font-semibold text-white group-hover:text-indigo-400 transition-colors duration-300">
                                        {faq.question}
                                    </h3>
                                    <motion.div
                                        animate={{ rotate: openIndex === index ? 180 : 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="flex-shrink-0"
                                    >
                                        <ChevronDown className="w-5 h-5 text-surface-500" />
                                    </motion.div>
                                </div>

                                <AnimatePresence>
                                    {openIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="overflow-hidden"
                                        >
                                            <p className="pt-4 text-surface-400 leading-relaxed border-t border-surface-800 mt-4">
                                                {faq.answer}
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </button>
                        </motion.div>
                    ))}
                </div>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center"
                >
                    <p className="text-surface-400 mb-6 text-lg">Still have questions?</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={() => {
                                router.push('/');
                            }}
                            className="group inline-flex items-center gap-3 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all duration-200 shadow-xl shadow-indigo-600/25"
                        >
                            <Sparkles className="w-5 h-5" />
                            <span>Try It Free</span>
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="mailto:hello@nopainmarketing.com"
                            className="px-8 py-4 text-surface-300 hover:text-white font-semibold rounded-xl transition-all duration-200 border border-surface-700 hover:border-surface-500"
                        >
                            Contact Support
                        </a>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
