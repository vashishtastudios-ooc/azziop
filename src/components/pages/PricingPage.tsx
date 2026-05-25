'use client';

import { useState, useCallback } from 'react';
import Script from 'next/script';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, ArrowRight, Zap, Star, Loader2, Coins } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
    PRICING_PLANS,
    CREDIT_PACKS,
    YEARLY_BILLING_DISCOUNT,
    resolvePlanPrice,
    type PlanId,
} from '~/lib/pricing';

declare global {
    interface Window {
        Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
    }
}

interface RazorpayOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color?: string };
    handler: (response: RazorpayResponse) => void;
    modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
    open: () => void;
    on: (event: string, handler: (response: unknown) => void) => void;
}

interface RazorpayResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
}

export function PricingPage() {
    const [yearly, setYearly] = useState(false);
    const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
    const [loadingPack, setLoadingPack] = useState<string | null>(null);
    const router = useRouter();
    const { status } = useSession();

    const openSubscriptionCheckout = useCallback(
        (data: {
            keyId: string;
            orderId: string;
            amount: number;
            currency: string;
            planId: PlanId;
            interval: string;
            userName: string;
            userEmail: string;
            userMobile: string;
        }) => {
            const options: RazorpayOptions = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'NoPain Marketing',
                description: `${data.planId.charAt(0).toUpperCase() + data.planId.slice(1)} Plan — ${data.interval}`,
                order_id: data.orderId,
                prefill: {
                    name: data.userName,
                    email: data.userEmail,
                    contact: data.userMobile,
                },
                theme: { color: '#4f46e5' },
                handler: async (response: RazorpayResponse) => {
                    try {
                        const verifyRes = await fetch('/api/billing/verify', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                planId: data.planId,
                                interval: data.interval,
                            }),
                        });
                        const verifyResult = await verifyRes.json();

                        if (verifyRes.ok && verifyResult.success) {
                            router.push('/dashboard?upgraded=true');
                        } else {
                            alert(verifyResult?.error ?? 'Payment verification failed. Contact support.');
                        }
                    } catch {
                        alert('Payment verification failed. Please contact support.');
                    } finally {
                        setLoadingPlan(null);
                    }
                },
                modal: {
                    ondismiss: () => setLoadingPlan(null),
                },
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                alert('Payment failed. Please try again.');
                setLoadingPlan(null);
            });
            rzp.open();
        },
        [router],
    );

    const openCreditPackCheckout = useCallback(
        (data: {
            keyId: string;
            orderId: string;
            amount: number;
            currency: string;
            packId: string;
            images: number;
            userName: string;
            userEmail: string;
            userMobile: string;
        }) => {
            const options: RazorpayOptions = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: 'NoPain Marketing',
                description: `${data.images} AI image credits`,
                order_id: data.orderId,
                prefill: {
                    name: data.userName,
                    email: data.userEmail,
                    contact: data.userMobile,
                },
                theme: { color: '#4f46e5' },
                handler: async (response: RazorpayResponse) => {
                    try {
                        const verifyRes = await fetch('/api/billing/credits', {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                packId: data.packId,
                            }),
                        });
                        const verifyResult = await verifyRes.json();
                        if (verifyRes.ok && verifyResult.success) {
                            router.push('/dashboard?credits=added');
                        } else {
                            alert(verifyResult?.error ?? 'Payment verification failed. Contact support.');
                        }
                    } catch {
                        alert('Payment verification failed. Please contact support.');
                    } finally {
                        setLoadingPack(null);
                    }
                },
                modal: {
                    ondismiss: () => setLoadingPack(null),
                },
            };
            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', () => {
                alert('Payment failed. Please try again.');
                setLoadingPack(null);
            });
            rzp.open();
        },
        [router],
    );

    const handlePlanClick = async (planId: PlanId) => {
        const interval = yearly ? 'yearly' : 'monthly';

        if (status !== 'authenticated') {
            router.push(`/register?plan=${planId}&interval=${interval}`);
            return;
        }

        if (planId === 'free') {
            router.push('/dashboard');
            return;
        }

        if (!window.Razorpay) {
            alert('Payment SDK is loading. Please try again in a moment.');
            return;
        }

        setLoadingPlan(planId);

        try {
            const response = await fetch('/api/billing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId, interval }),
            });
            const result = await response.json();

            if (!response.ok || !result?.data?.orderId) {
                alert(result?.error ?? 'Unable to start checkout. Please try again.');
                setLoadingPlan(null);
                return;
            }

            openSubscriptionCheckout({
                keyId: result.data.keyId,
                orderId: result.data.orderId,
                amount: result.data.amount,
                currency: result.data.currency,
                planId,
                interval,
                userName: result.data.userName,
                userEmail: result.data.userEmail,
                userMobile: result.data.userMobile,
            });
        } catch {
            alert('Something went wrong. Please try again.');
            setLoadingPlan(null);
        }
    };

    const handleCreditPackClick = async (packId: string) => {
        if (status !== 'authenticated') {
            router.push(`/register?pack=${packId}`);
            return;
        }
        if (!window.Razorpay) {
            alert('Payment SDK is loading. Please try again in a moment.');
            return;
        }
        setLoadingPack(packId);
        try {
            const response = await fetch('/api/billing/credits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ packId }),
            });
            const result = await response.json();
            if (!response.ok || !result?.data?.orderId) {
                alert(result?.error ?? 'Unable to start checkout. Please try again.');
                setLoadingPack(null);
                return;
            }
            openCreditPackCheckout({
                keyId: result.data.keyId,
                orderId: result.data.orderId,
                amount: result.data.amount,
                currency: result.data.currency,
                packId,
                images: result.data.images,
                userName: result.data.userName,
                userEmail: result.data.userEmail,
                userMobile: result.data.userMobile,
            });
        } catch {
            alert('Something went wrong. Please try again.');
            setLoadingPack(null);
        }
    };

    return (
        <div className="relative min-h-screen pt-24 pb-20 px-4 lg:px-8">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

            <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
            <div className="absolute inset-0 bg-mesh-gradient" />

            <div className="relative max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-16"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-8">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm text-surface-300">Simple Pricing · USD</span>
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold tracking-tight text-white mb-6 leading-[1.1]">
                        Plans that{' '}
                        <span className="text-gradient-rainbow">scale</span>{' '}
                        with you
                    </h1>

                    <p className="text-xl text-surface-400 max-w-2xl mx-auto leading-relaxed mb-10">
                        Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
                    </p>

                    <div className="inline-flex items-center gap-4 p-1.5 rounded-xl bg-surface-800/80 border border-surface-700">
                        <button
                            onClick={() => setYearly(false)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${!yearly ? 'bg-indigo-600 text-white shadow-lg' : 'text-surface-400 hover:text-white'
                                }`}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setYearly(true)}
                            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${yearly ? 'bg-indigo-600 text-white shadow-lg' : 'text-surface-400 hover:text-white'
                                }`}
                        >
                            Yearly
                            <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
                                Save {Math.round(YEARLY_BILLING_DISCOUNT * 100)}%
                            </span>
                        </button>
                    </div>
                </motion.div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-24">
                    {PRICING_PLANS.map((plan, i) => {
                        const isLoading = loadingPlan === plan.id;
                        const price = resolvePlanPrice(plan, yearly ? 'yearly' : 'monthly');
                        return (
                            <motion.div
                                key={plan.id}
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.15 + i * 0.08 }}
                                className={`relative rounded-3xl ${plan.highlight
                                    ? 'bg-gradient-to-b from-indigo-500/10 to-surface-900/80 border-2 border-indigo-500/40 shadow-2xl shadow-indigo-500/10'
                                    : 'bg-surface-900/60 border border-surface-800'
                                    } backdrop-blur-sm overflow-hidden`}
                            >
                                {plan.badge && (
                                    <div className="absolute top-0 right-0 px-4 py-1.5 bg-indigo-600 rounded-bl-xl">
                                        <span className="text-xs font-semibold text-white flex items-center gap-1">
                                            <Star className="w-3 h-3" />
                                            {plan.badge}
                                        </span>
                                    </div>
                                )}

                                <div className="p-6 lg:p-8">
                                    <h3 className="text-xl font-display font-semibold text-white mb-2">{plan.name}</h3>
                                    <p className="text-sm text-surface-400 mb-6 min-h-[2.5rem]">{plan.description}</p>

                                    <div className="flex items-baseline gap-2 mb-2">
                                        <span className="text-5xl font-display font-bold text-white">
                                            ${price}
                                        </span>
                                        {plan.monthlyPriceUsd > 0 && (
                                            <span className="text-surface-500 text-sm">/mo</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-surface-500 mb-6 h-4">
                                        {yearly && plan.monthlyPriceUsd > 0
                                            ? `Billed $${price * 12}/year`
                                            : ''}
                                    </p>

                                    <button
                                        onClick={() => void handlePlanClick(plan.id)}
                                        disabled={isLoading}
                                        className={`w-full py-3.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 mb-8 disabled:opacity-60 ${plan.highlight
                                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25'
                                            : 'bg-surface-800 hover:bg-surface-700 text-white border border-surface-700'
                                            }`}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                {plan.monthlyPriceUsd === 0 ? 'Start Free' : 'Get Started'}
                                                <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>

                                    <ul className="space-y-3">
                                        {plan.features.map((feature) => (
                                            <li key={feature.text} className="flex items-start gap-3">
                                                {feature.included ? (
                                                    <Check className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                                                ) : (
                                                    <X className="w-4 h-4 text-surface-600 flex-shrink-0 mt-0.5" />
                                                )}
                                                <span className={`text-sm ${feature.included ? 'text-surface-300' : 'text-surface-600'}`}>
                                                    {feature.text}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="mb-20"
                >
                    <div className="text-center mb-10">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-morphism mb-4">
                            <Coins className="w-4 h-4 text-yellow-400" />
                            <span className="text-sm text-surface-300">Top-up credits</span>
                        </div>
                        <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-3">
                            Out of images? Grab a credit pack.
                        </h2>
                        <p className="text-surface-400 max-w-xl mx-auto">
                            One-time purchase, credits never expire. Works on any plan — including Free.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                        {CREDIT_PACKS.map((pack) => {
                            const isLoading = loadingPack === pack.id;
                            return (
                                <div
                                    key={pack.id}
                                    className={`relative rounded-2xl p-6 ${pack.highlight
                                        ? 'bg-gradient-to-b from-amber-500/10 to-surface-900/80 border-2 border-amber-500/40'
                                        : 'bg-surface-900/60 border border-surface-800'
                                        }`}
                                >
                                    {pack.savings && (
                                        <div className="absolute -top-3 left-6 px-3 py-1 rounded-full bg-amber-500 text-surface-950 text-xs font-bold">
                                            {pack.savings}
                                        </div>
                                    )}
                                    <h3 className="text-lg font-semibold text-white mb-1">{pack.name}</h3>
                                    <p className="text-sm text-surface-400 mb-4">{pack.images} AI images</p>
                                    <div className="flex items-baseline gap-1 mb-5">
                                        <span className="text-3xl font-bold text-white">${pack.priceUsd}</span>
                                        <span className="text-surface-500 text-sm">one-time</span>
                                    </div>
                                    <button
                                        onClick={() => void handleCreditPackClick(pack.id)}
                                        disabled={isLoading}
                                        className="w-full py-3 rounded-xl font-semibold text-sm bg-surface-800 hover:bg-surface-700 text-white border border-surface-700 flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Buy pack <ArrowRight className="w-4 h-4" />
                                            </>
                                        )}
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className="text-center"
                >
                    <p className="text-surface-400 mb-4">
                        Need a custom plan for your enterprise?{' '}
                        <a href="mailto:hello@nopainmarketing.com" className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4">
                            Contact us
                        </a>
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-6 text-surface-500 text-sm">
                        <span className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4" />
                            No credit card required for Free
                        </span>
                        <span className="w-1 h-1 rounded-full bg-surface-600" />
                        <span className="flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Cancel anytime
                        </span>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
