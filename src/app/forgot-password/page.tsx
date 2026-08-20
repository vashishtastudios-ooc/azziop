'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Loader2, ArrowLeft, CheckCircle2, Zap, Layers, Target } from 'lucide-react'
import {
  AuthFormCard,
  AuthFormLink,
  AuthPageLayout,
} from '~/components/marketing/AuthPageLayout'
import { MKT_BTN_PRIMARY } from '~/lib/marketingTheme'
import { api } from '~/trpc/react'

const AUTH_FEATURES = [
  { icon: Zap, label: '60s Campaigns' },
  { icon: Target, label: 'Brand DNA' },
  { icon: Layers, label: '6-Layer AI' },
] as const

const inputWithIcon = 'app-input pl-12 focus:ring-0'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const requestReset = api.user.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    requestReset.mutate({ email: email.trim() })
  }

  return (
    <AuthPageLayout
      headline={
        <>
          Forgot your
          <br />
          <span className="text-[#FAD400]">password?</span>
        </>
      }
      subtitle="No worries — we'll email you a secure link to set a new one."
      features={[...AUTH_FEATURES]}
      footerNote="Trusted by 500+ brands worldwide"
    >
      <AuthFormCard>
        {submitted ? (
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Check your email
            </h2>
            <p className="text-neutral-600 font-light mb-8">
              If an account exists for{' '}
              <span className="font-medium text-neutral-800">{email.trim()}</span>, we&apos;ve
              sent a link to reset your password. The link expires in 1 hour.
            </p>
            <AuthFormLink href="/login">
              <span className="inline-flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </span>
            </AuthFormLink>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                Reset password
              </h2>
              <p className="text-neutral-600 font-light">
                Enter the email linked to your account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">Email</label>
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

              <button
                type="submit"
                disabled={requestReset.isPending}
                className={`${MKT_BTN_PRIMARY} w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
              >
                {requestReset.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending link...
                  </>
                ) : (
                  <>
                    Send reset link
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-neutral-600 font-light">
              Remembered it?{' '}
              <AuthFormLink href="/login">Back to sign in</AuthFormLink>
            </p>
          </>
        )}
      </AuthFormCard>
    </AuthPageLayout>
  )
}
