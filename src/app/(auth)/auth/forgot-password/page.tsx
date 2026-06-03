'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { requestPasswordReset } from '@/app/auth/actions'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('idle')
    startTransition(async () => {
      // Pass the current window location origin so Supabase redirects back correctly
      const origin = window.location.origin
      const result = await requestPasswordReset(email, origin)
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to send recovery link. Please try again.')
      }
    })
  }

  return (
    <div className="w-full space-y-8 select-none text-center">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-10">
        <span className="font-label-caps text-[9px] font-bold text-amber-600 uppercase tracking-[0.3em]">
          access recovery
        </span>
        <h1 className="font-display text-4xl font-bold tracking-wide text-primary italic">
          Quiet.
        </h1>
        <p className="text-xs text-on-surface-variant/80 font-medium tracking-wide">
          Enter your email to receive a secure recovery link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-left">
        {status === 'success' && (
          <div className="p-4 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-2 justify-center tracking-wide uppercase">
            <CheckCircle2 size={14} className="shrink-0" />
            <span>Recovery link sent! Check your inbox.</span>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 text-[11px] font-bold text-error bg-error/5 border border-error/25 rounded-2xl flex items-center gap-2 justify-center tracking-wide uppercase">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-[9px] font-bold uppercase tracking-[0.25em] text-outline pl-1">
              Registered Email
            </label>
            <input
              id="email"
              type="email"
              required
              disabled={isPending || status === 'success'}
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full h-14 bg-background/50 border border-outline-variant/40 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/3 rounded-2xl transition-all text-xs font-semibold text-primary px-5 outline-none placeholder:text-outline/50 shadow-xs"
              placeholder="curator@quiet.network"
            />
          </div>
        </div>

        <button
          disabled={isPending || status === 'success' || !email}
          type="submit"
          className="w-full h-14 mt-6 flex items-center justify-center gap-2 font-label-caps text-[10px] font-bold uppercase tracking-[0.25em] bg-primary text-on-primary hover:bg-primary/95 transition-all rounded-full hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Sending Link...
            </>
          ) : (
            'Send Recovery Link'
          )}
        </button>
      </form>

      {/* Footer controls */}
      <div className="text-center text-xs font-semibold mt-10 space-y-3.5 border-t border-outline-variant/20 pt-8">
        <div>
          <Link href="/login" className="text-[10px] text-outline hover:text-primary transition-colors uppercase tracking-widest font-bold">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}
