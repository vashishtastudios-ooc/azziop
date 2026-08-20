'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { signIn, useSession } from 'next-auth/react'
import { motion } from 'framer-motion'
import { GoogleSignInButton } from '~/components/GoogleSignInButton'
import {
  AuthFormCard,
  AuthFormLink,
  AuthPageLayout,
} from '~/components/marketing/AuthPageLayout'
import { MKT_BTN_PRIMARY } from '~/lib/marketingTheme'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Zap,
  Layers,
  Target,
} from 'lucide-react'

const AUTH_FEATURES = [
  { icon: Zap, label: '60s Campaigns' },
  { icon: Target, label: 'Brand DNA' },
  { icon: Layers, label: '6-Layer AI' },
] as const

const inputWithIcon =
  'app-input pl-12 focus:ring-0'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { status: sessionStatus } = useSession()

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
        email: email.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'CredentialsSignin') {
          setError(
            'Invalid email or password. If you signed up with Google, use Continue with Google.',
          )
        } else {
          setError('Login failed. Please try again.')
        }
        setLoading(false)
      } else if (result?.ok) {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 animate-spin text-[#FAD400]" />
      </div>
    )
  }

  return (
    <AuthPageLayout
      headline={
        <>
          Welcome back to
          <br />
          <span className="text-[#FAD400]">the future</span> of marketing
        </>
      }
      subtitle="Pick up where you left off. Your AI-powered campaigns are waiting."
      features={[...AUTH_FEATURES]}
      footerNote="Trusted by 500+ brands worldwide"
    >
      <AuthFormCard>
        <div className="mb-8">
          <h2 className="text-2xl font-display font-bold text-neutral-900 mb-2">Sign in</h2>
          <p className="text-neutral-600 font-light">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
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
            <label className="block text-sm font-medium text-neutral-700 mb-2">Password</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400 group-focus-within:text-[#FAD400] transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputWithIcon} pr-12`}
                placeholder="Enter password"
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

          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-neutral-700 hover:text-[#FAD400] font-medium transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${MKT_BTN_PRIMARY} w-full disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                Sign In
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

        <GoogleSignInButton callbackUrl="/dashboard" />

        <p className="mt-8 text-center text-sm text-neutral-600 font-light">
          Don&apos;t have an account?{' '}
          <AuthFormLink href="/register">Create one</AuthFormLink>
        </p>
      </AuthFormCard>
    </AuthPageLayout>
  )
}
