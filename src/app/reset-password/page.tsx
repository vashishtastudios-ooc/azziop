'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Check,
  Zap,
  Layers,
  Target,
} from 'lucide-react'
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
        </div>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const resetPassword = api.user.resetPassword.useMutation({
    onSuccess: () => {
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    },
    onError: (err) => setError(err.message),
  })

  const passwordChecks = [
    { label: '6+ characters', valid: password.length >= 6 },
    { label: 'Has a number', valid: /\d/.test(password) },
    { label: 'Passwords match', valid: password.length > 0 && password === confirmPassword },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    resetPassword.mutate({ token, password })
  }

  return (
    <AuthPageLayout
      headline={
        <>
          Set a new
          <br />
          <span className="text-[#FAD400]">password</span>
        </>
      }
      subtitle="Choose a strong password to secure your account."
      features={[...AUTH_FEATURES]}
      footerNote="Trusted by 500+ brands worldwide"
    >
      <AuthFormCard>
        {!token ? (
          <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Invalid link
            </h2>
            <p className="text-neutral-600 font-light mb-8">
              This reset link is missing or malformed. Please request a new one.
            </p>
            <AuthFormLink href="/forgot-password">Request a new link</AuthFormLink>
          </div>
        ) : done ? (
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"
            >
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </motion.div>
            <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
              Password updated
            </h2>
            <p className="text-neutral-600 font-light mb-8">
              Your password has been changed. Redirecting you to sign in...
            </p>
            <AuthFormLink href="/login">Go to sign in</AuthFormLink>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">
                New password
              </h2>
              <p className="text-neutral-600 font-light">Enter and confirm your new password.</p>
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
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  New password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputWithIcon} pr-12`}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Confirm password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={inputWithIcon}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
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
                disabled={resetPassword.isPending}
                className={`${MKT_BTN_PRIMARY} w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
              >
                {resetPassword.isPending ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    Update password
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
