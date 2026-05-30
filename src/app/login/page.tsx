'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { GoogleSignInButton } from '~/components/GoogleSignInButton'
import {
  Phone,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ArrowRight,
  Loader2,
  Zap,
  Layers,
  Target,
} from 'lucide-react'

export default function LoginPage() {
  const [mobile, setMobile] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { status: sessionStatus } = useSession()

  // Redirect if already logged in
  useEffect(() => {
    if (sessionStatus === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [sessionStatus, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        mobile: mobile.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        // Handle different error types
        if (result.error === 'CredentialsSignin') {
          setError(
            'Invalid mobile number or password. If you signed up with Google, use Continue with Google.',
          )
        } else {
          setError('Login failed. Please try again.')
        }
        setLoading(false)
      } else if (result?.ok) {
        // Success - redirect to campaign page
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  // Don't render form while checking session
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-950">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--hero-blue)]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden">
      {/* Full-page background */}
      <div className="absolute inset-0 bg-gradient-to-br from-surface-950 via-surface-900 to-surface-950" />
      <div className="absolute inset-0 bg-mesh-gradient" />

      {/* Animated spotlight */}
      <motion.div
        animate={{
          background: [
            'radial-gradient(circle at 30% 40%, rgba(59, 94, 245, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 70% 60%, rgba(139, 92, 246, 0.15) 0%, transparent 50%)',
            'radial-gradient(circle at 50% 30%, rgba(59, 94, 245, 0.15) 0%, transparent 50%)',
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
                Welcome back to
                <br />
                <span className="text-gradient-blue">the future</span> of marketing
              </h1>
              <p className="text-lg text-surface-400 leading-relaxed">
                Pick up where you left off. Your AI-powered campaigns are waiting.
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
                  <Icon className="w-4 h-4 text-[var(--hero-blue)]" />
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
            Trusted by 500+ brands worldwide
          </motion.p>
        </div>
      </div>

      {/* Right Panel — Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
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
              <h2 className="text-2xl font-display font-bold text-white mb-2">Sign in</h2>
              <p className="text-surface-400">Enter your credentials to continue</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5">
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

              {/* Mobile */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Mobile Number
                </label>
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

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-surface-300 mb-2">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-[var(--hero-blue)] transition-colors" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-12 py-3.5 bg-surface-800/60 border border-surface-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--hero-blue)]/50 focus:border-[var(--hero-blue)] transition-all text-white placeholder:text-surface-500"
                    placeholder="Enter password"
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

              {/* Forgot */}
              <div className="flex justify-end">
                <a href="#" className="text-sm text-[var(--hero-blue)] hover:text-blue-400 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[var(--hero-blue)] hover:bg-[#4a6cf7] text-white py-3.5 rounded-xl font-semibold transition-all duration-200 shadow-lg shadow-[var(--hero-blue)]/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group relative overflow-hidden"
              >
                <div className="absolute inset-0 shimmer-effect opacity-0 group-hover:opacity-100" />
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin relative z-10" />
                    <span className="relative z-10">Signing in...</span>
                  </>
                ) : (
                  <>
                    <span className="relative z-10">Sign In</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-surface-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-surface-900/80 text-surface-500">or</span>
              </div>
            </div>

            <GoogleSignInButton callbackUrl="/dashboard" />

            {/* OTP */}
            <button
              type="button"
              className="w-full border border-surface-700 hover:border-[var(--hero-blue)]/50 hover:bg-[var(--hero-blue)]/5 text-surface-300 py-3.5 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-[var(--hero-blue)]" />
              Login with OTP
            </button>

            {/* Register Link */}
            <p className="mt-8 text-center text-sm text-surface-400">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="text-[var(--hero-blue)] font-semibold hover:text-blue-400 transition-colors"
              >
                Create one
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}