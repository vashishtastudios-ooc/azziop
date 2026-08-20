'use client'

import { Suspense, useState, useCallback } from 'react'
import Script from 'next/script'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { motion } from 'framer-motion'
import { GoogleSignInButton } from '~/components/GoogleSignInButton'
import {
    AuthFormCard,
    AuthFormLink,
    AuthPageLayout,
} from '~/components/marketing/AuthPageLayout'
import { MKT_BTN_PRIMARY } from '~/lib/marketingTheme'
import { api } from '~/trpc/react'
import {
    User,
    Phone,
    Mail,
    Lock,
    Eye,
    EyeOff,
    ArrowRight,
    Loader2,
    Check,
    Zap,
    Layers,
    Target,
} from 'lucide-react'

const AUTH_FEATURES = [
    { icon: Zap, label: '60s Campaigns' },
    { icon: Target, label: 'Brand DNA' },
    { icon: Layers, label: '6-Layer AI' },
] as const

const inputWithIcon = 'app-input pl-12 focus:ring-0'

export default function RegisterPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-white">
                    <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
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
                theme: { color: '#FAD400' },
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

        if (!email.trim()) {
            setError('Email is required')
            return
        }

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
                email: email.trim(),
                mobile: mobile.trim() || undefined,
                password,
            })

            const signInResult = await signIn('credentials', {
                email: email.trim(),
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
        <>
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <AuthPageLayout
                headline={
                    <>
                        Start creating
                        <br />
                        <span className="text-[#FAD400]">magic</span> today
                    </>
                }
                subtitle="Join thousands of marketers generating AI-powered campaigns at the speed of thought."
                features={[...AUTH_FEATURES]}
                footerNote="No credit card required • 5 free campaigns"
            >
                <AuthFormCard>
                    <div className="mb-8">
                        <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                            Create account
                        </h2>
                        <p className="text-neutral-600 font-light">Get started with your free account</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2"
                            >
                                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" />
                                {error}
                            </motion.div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className={inputWithIcon}
                                    placeholder="Enter your full name"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Email
                            </label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className={inputWithIcon}
                                    placeholder="Enter email address"
                                    autoComplete="email"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Mobile Number{' '}
                                <span className="text-neutral-400 font-normal">(optional)</span>
                            </label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                                <input
                                    type="tel"
                                    value={mobile}
                                    onChange={(e) => setMobile(e.target.value)}
                                    className={inputWithIcon}
                                    placeholder="Enter mobile number"
                                    autoComplete="tel"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className={`${inputWithIcon} pr-12`}
                                    placeholder="Create a password"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="w-5 h-5" />
                                    ) : (
                                        <Eye className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Confirm Password
                            </label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className={inputWithIcon}
                                    placeholder="Confirm your password"
                                    required
                                />
                            </div>
                        </div>

                        {password.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="flex flex-wrap gap-x-4 gap-y-1.5"
                            >
                                {passwordChecks.map((check) => (
                                    <div
                                        key={check.label}
                                        className={`flex items-center gap-1.5 text-xs ${
                                            check.valid ? 'text-emerald-600' : 'text-neutral-500'
                                        }`}
                                    >
                                        <Check
                                            className={`w-3.5 h-3.5 ${
                                                check.valid ? 'text-emerald-600' : 'text-neutral-400'
                                            }`}
                                        />
                                        {check.label}
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={`${MKT_BTN_PRIMARY} w-full mt-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Creating account...
                                </>
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-neutral-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white text-neutral-500 font-light">or</span>
                        </div>
                    </div>

                    <GoogleSignInButton callbackUrl="/dashboard" label="Sign up with Google" />

                    <p className="mt-8 text-center text-sm text-neutral-600 font-light">
                        Already have an account?{' '}
                        <AuthFormLink href="/login">Sign in</AuthFormLink>
                    </p>
                </AuthFormCard>
            </AuthPageLayout>
        </>
    )
}
