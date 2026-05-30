'use client'

import { Suspense, useState, useCallback } from 'react'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GoogleSignInButton } from '~/components/GoogleSignInButton'
import { api } from '~/trpc/react'
import {
    User,
    Phone,
    Mail,
    Lock,
    Eye,
    EyeOff,
    Sparkles,
    ArrowRight,
    Loader2,
    Check,
    Zap,
    Layers,
    Target,
} from 'lucide-react'

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-surface-950">
                    <Loader2 className="w-8 h-8 animate-spin text-[var(--hero-blue)]" />
                </div>
            }
        >
            <RegisterPageContent />
        </Suspense>
    )
}

function RegisterPageContent() {
    const [name, setName] = useState('')
    const [mobile, setMobile] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()
    const searchParams = useSearchParams()
    const selectedPlan = (searchParams.get('plan') ?? 'free').toLowerCase()
    const selectedInterval = (searchParams.get('interval') ?? 'monthly').toLowerCase()

    const registerMutation = api.user.register.useMutation({
        onError: (err) => {
            setError(err.message)
        },
    })

    const passwordChecks = [
        { label: '6+ characters', valid: password.length >= 6 },
        { label: 'Has a number', valid: /\d/.test(password) },
        { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword },
    ]

    const loading = registerMutation.isPending

    const openRazorpayCheckout = useCallback(
        (data: {
            keyId: string;
            subscriptionId: string;
            planId: string;
            interval: string;
            userName: string;
            userEmail: string;
            userMobile: string;
        }) => {
            const rzp = new window.Razorpay({
                key: data.keyId,
                name: 'Azziop',
                description: `${data.planId.charAt(0).toUpperCase() + data.planId.slice(1)} Plan — ${data.interval}`,
                subscription_id: data.subscriptionId,
                prefill: {
                    name: data.userName,
                    email: data.userEmail,
                    contact: data.userMobile,
                },
                theme: { color: '#4f46e5' },
                handler: async (response: { razorpay_subscription_id?: string; razorpay_payment_id: string; razorpay_signature: string }) => {
                    const verifyRes = await fetch('/api/billing/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            razorpay_subscription_id: response.razorpay_subscription_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            planId: data.planId,
                            interval: data.interval,
                        }),
                    })
                    if (verifyRes.ok) {
                        router.push('/dashboard?upgraded=true')
                    } else {
                        router.push('/dashboard')
                    }
                },
                modal: {
                    ondismiss: () => {
                        router.push('/dashboard')
                    },
                },
            })
            rzp.open()
        },
        [router],
    )

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (password !== confirmPassword) {
            setError('Passwords do not match')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        try {
            await registerMutation.mutateAsync({
                name: name.trim(),
                mobile: mobile.trim(),
                email: email.trim() || undefined,
                password,
            })

            const signInResult = await signIn('credentials', {
                mobile: mobile.trim(),
                password,
                redirect: false,
            })

            if (signInResult?.error) {
                router.push('/login')
            } else {
                if (
                    (selectedPlan === 'starter' ||
                        selectedPlan === 'pro' ||
                        selectedPlan === 'agency') &&
                    window.Razorpay
                ) {
                    const subscribeResponse = await fetch('/api/billing/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            planId: selectedPlan,
                            interval: selectedInterval === 'yearly' ? 'yearly' : 'monthly',
                        }),
                    })
                    const subscribeResult = await subscribeResponse.json()
                    if (subscribeResponse.ok && subscribeResult?.data?.subscriptionId) {
                        openRazorpayCheckout({
                            keyId: subscribeResult.data.keyId,
                            subscriptionId: subscribeResult.data.subscriptionId,
                            planId: selectedPlan,
                            interval: selectedInterval === 'yearly' ? 'yearly' : 'monthly',
                            userName: name.trim(),
                            userEmail: email.trim(),
                            userMobile: mobile.trim(),
                        })
                        return
                    }
                }

                router.push('/dashboard')
                router.refresh()
            }
        } catch {
            // Error already handled by onError callback
        }
    }

    return (
        <div className="min-h-screen flex relative overflow-hidden">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            {/* Full-page background */}
            <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
            <div className="absolute inset-0 bg-mesh-gradient" />

            {/* Animated spotlight */}
            <motion.div
                animate={{
                    background: [
                        'radial-gradient(circle at 70% 40%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 30% 60%, rgba(59, 94, 245, 0.15) 0%, transparent 50%)',
                        'radial-gradient(circle at 50% 30%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
                    ]
                }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute inset-0"
            />

            {/* Grid pattern */}
            <div className="absolute inset-0 bg-grid-pattern opacity-40" />

            {/* Left Panel — Branding */}
            <div className="hidden lg:flex lg:w-[48%] relative z-10">
                <div className="flex flex-col justify-between p-12 xl:p-16 w-full">
                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="flex items-center gap-3 group">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--hero-blue)] to-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-display font-semibold text-white text-lg">Azziop</span>
                        </Link>
                    </motion.div>

                    {/* Center */}
                    <div className="flex-1 flex flex-col justify-center max-w-lg">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                        >
                            <h1 className="text-4xl xl:text-5xl font-display font-bold text-white leading-tight mb-6">
                                Start creating
                                <br />
                                <span className="text-gradient-purple">magic</span> today
                            </h1>
                            <p className="text-lg text-surface-400 leading-relaxed">
                                Join thousands of marketers generating AI-powered campaigns at the speed of thought.
                            </p>
                        </motion.div>

                        {/* Feature chips */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.4 }}
                            className="flex flex-wrap gap-3 mt-10"
                        >
                            {[
                                { icon: Zap, label: '60s Campaigns' },
                                { icon: Target, label: 'Brand DNA' },
                                { icon: Layers, label: '6-Layer AI' },
                            ].map(({ icon: Icon, label }) => (
                                <div
                                    key={label}
                                    className="flex items-center gap-2 px-4 py-2.5 glass-morphism rounded-full"
                                >
                                    <Icon className="w-4 h-4 text-purple-400" />
                                    <span className="text-surface-300 text-sm font-medium">{label}</span>
                                </div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Bottom */}
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="text-surface-600 text-sm"
                    >
                        No credit card required • 5 free campaigns
                    </motion.p>
                </div>
            </div>

            {/* Right Panel — Register Form */}
            <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10 overflow-y-auto">
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md py-8"
                >
                    {/* Mobile Logo */}
                    <div className="lg:hidden text-center mb-10">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--hero-blue)] to-indigo-600 flex items-center justify-center shadow-lg shadow-[var(--hero-blue)]/25">
                                <Sparkles className="w-6 h-6 text-white" />
                            </div>
                            <span className="font-display font-bold text-white text-2xl">Azziop</span>
                        </Link>
                    </div>

                    {/* Card */}
                    <div className="p-8 sm:p-10 rounded-3xl glass-morphism border border-surface-700/50">
                        {/* Header */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-display font-bold text-white mb-2">Create account</h2>
                            <p className="text-surface-400">Get started with your free account</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Error */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                                >
                                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                    {error}
                                </motion.div>
                            )}

                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Full Name</label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                                        placeholder="Enter your full name"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Mobile */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Mobile Number</label>
                                <div className="relative group">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                                    <input
                                        type="tel"
                                        value={mobile}
                                        onChange={(e) => setMobile(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                                        placeholder="Enter mobile number"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Email (optional) */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">
                                    Email <span className="text-surface-600 font-normal">(optional)</span>
                                </label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                                        placeholder="Enter email address"
                                    />
                                </div>
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                                        placeholder="Create a password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-surface-500 hover:text-surface-300 transition-colors"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div>
                                <label className="block text-sm font-medium text-surface-300 mb-2">Confirm Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-4 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                                        placeholder="Confirm your password"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Password validation */}
                            {password.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="flex flex-wrap gap-x-4 gap-y-1.5"
                                >
                                    {passwordChecks.map((check) => (
                                        <div
                                            key={check.label}
                                            className={`flex items-center gap-1.5 text-xs ${check.valid ? 'text-emerald-400' : 'text-surface-500'
                                                }`}
                                        >
                                            <Check className={`w-3.5 h-3.5 ${check.valid ? 'text-emerald-400' : 'text-surface-600'}`} />
                                            {check.label}
                                        </div>
                                    ))}
                                </motion.div>
                            )}

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[var(--hero-blue)] hover:bg-[#4a6cf7] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[var(--hero-blue)]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2 group relative overflow-hidden"
                            >
                                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                                        <span className="relative z-10">Creating account...</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="relative z-10">Create Account</span>
                                        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-surface-700" />
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-surface-900/80 text-surface-500">or</span>
                            </div>
                        </div>

                        <GoogleSignInButton
                            callbackUrl="/dashboard"
                            label="Sign up with Google"
                        />

                        {/* Login Link */}
                        <p className="mt-8 text-center text-sm text-surface-400">
                            Already have an account?{' '}
                            <Link
                                href="/login"
                                className="text-[var(--hero-blue)] font-semibold hover:text-blue-400 transition-colors"
                            >
                                Sign in
                            </Link>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
