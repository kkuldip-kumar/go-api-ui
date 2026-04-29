import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { authApi } from '@/api'
import { useAuthStore } from '@/store/authStore'
import { MessageSquare, ArrowRight, Eye, EyeOff, Loader2 } from 'lucide-react'
import clsx from 'clsx'

type AuthMode = 'login' | 'register'

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const { setAuth } = useAuthStore()

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }))
      setErrors((e2) => ({ ...e2, [key]: '' }))
    },
  })

  const loginMutation = useMutation({
    mutationFn: () => authApi.login({ email: form.email, password: form.password }),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data
      setAuth(user, tokens.access_token, tokens.refresh_token)
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Login failed'
      setErrors({ _form: msg })
    },
  })

  const registerMutation = useMutation({
    mutationFn: () =>
      authApi.register({ username: form.username, email: form.email, password: form.password }),
    onSuccess: (res) => {
      const { user, tokens } = res.data.data
      setAuth(user, tokens.access_token, tokens.refresh_token)
    },
    onError: (err: any) => {
      const details = err?.response?.data?.error?.details
      if (details) {
        setErrors(details)
      } else {
        setErrors({ _form: err?.response?.data?.error?.message ?? 'Registration failed' })
      }
    },
  })

  const isPending = loginMutation.isPending || registerMutation.isPending

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'register' && form.username.length < 3)
      {e.username = 'Username must be at least 3 characters'}
    if (!form.email.includes('@')) e.email = 'Invalid email address'
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    if (mode === 'login') loginMutation.mutate()
    else registerMutation.mutate()
  }

  return (
    <div className="min-h-screen bg-surface-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 right-1/4 w-80 h-80 bg-brand-800/15 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm relative z-10 animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-brand-500/15 border border-brand-500/30 mb-4">
            <MessageSquare className="w-7 h-7 text-brand-400" />
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight">GoChat</h1>
          <p className="text-surface-300/60 text-sm mt-1">Real-time messaging, built in Go</p>
        </div>

        {/* Card */}
        <div className="bg-surface-900/80 backdrop-blur-sm border border-surface-200/8 rounded-2xl p-6 shadow-modal">
          {/* Tab switcher */}
          <div className="flex bg-surface-800/50 rounded-xl p-1 mb-6 gap-1">
            {(['login', 'register'] as AuthMode[]).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}) }}
                className={clsx(
                  'flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 capitalize',
                  mode === m
                    ? 'bg-surface-0/90 text-surface-900 shadow-sm'
                    : 'text-surface-300/60 hover:text-surface-300',
                )}
              >
                {m}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-medium text-surface-300/70 mb-1.5">
                  Username
                </label>
                <input
                  {...field('username')}
                  className="input-base"
                  placeholder="kuldeep"
                  autoComplete="username"
                  disabled={isPending}
                />
                {errors.username && (
                  <p className="text-xs text-red-400 mt-1">{errors.username}</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-surface-300/70 mb-1.5">
                Email
              </label>
              <input
                {...field('email')}
                type="email"
                className="input-base"
                placeholder="you@example.com"
                autoComplete="email"
                disabled={isPending}
              />
              {errors.email && (
                <p className="text-xs text-red-400 mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-surface-300/70 mb-1.5">
                Password
              </label>
              <div className="relative">
                <input
                  {...field('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input-base pr-10"
                  placeholder="••••••••"
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  disabled={isPending}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-300/40 hover:text-surface-300/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-400 mt-1">{errors.password}</p>
              )}
            </div>

            {errors._form && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-400">{errors._form}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isPending}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign in' : 'Create account'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-surface-300/30 text-xs mt-6">
          GoChat — production-grade Go backend
        </p>
      </div>
    </div>
  )
}