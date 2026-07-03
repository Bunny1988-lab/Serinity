'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useTransition, Suspense } from 'react'
import Link from 'next/link'
import { resendVerification } from '@/app/auth/actions'
import { Loader2, Mail, CheckCircle2, AlertCircle } from 'lucide-react'

function SignupSuccessContent() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const reason = searchParams.get('reason') || ''
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleResend = () => {
    setStatus('idle')
    startTransition(async () => {
      const result = await resendVerification(email)
      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setErrorMessage(result.error || 'Failed to resend. Please try again.')
      }
    })
  }

  return (
    <div className="w-full space-y-8 select-none text-center">
      {/* Brand Header */}
      <div className="space-y-2 mb-6">
        <span className="font-label-caps text-[9px] font-bold text-amber-600 uppercase tracking-[0.3em]">
          step complete
        </span>
        <h1 className="font-display text-4xl font-bold tracking-wide text-primary italic">
          Quiet.
        </h1>
        <p className="text-xs text-on-surface-variant/80 font-medium tracking-wide">
          We sent a verification link to your email.
        </p>
      </div>

      {/* Unconfirmed-email warning */}
      {reason === 'unconfirmed' && (
        <div className="p-4 text-[11px] font-bold text-amber-700 bg-amber-500/5 border border-amber-500/25 rounded-2xl flex items-center gap-2 justify-center tracking-wide uppercase mb-4">
          <AlertCircle size={14} className="shrink-0" />
          <span>Your email hasn't been verified yet. Please check your inbox and click the verification link before logging in, or resend it below.</span>
        </div>
      )}

      {/* Email Indicator Card */}
      <div className="w-full bg-background/40 border border-outline-variant/30 p-5 rounded-[24px] flex items-center gap-4 text-left shadow-xs">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Mail size={16} />
        </div>
        <div className="min-w-0">
          <p className="text-[9px] font-bold text-outline uppercase tracking-widest leading-none mb-1.5">Registered Email</p>
          <p className="text-xs font-semibold text-primary truncate">{email || 'your email address'}</p>
        </div>
      </div>

      {/* Notification Statuses */}
      {status === 'success' && (
        <div className="p-4 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl flex items-center gap-2 justify-center tracking-wide uppercase">
          <CheckCircle2 size={14} className="shrink-0" />
          <span>New link sent! Check your inbox.</span>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 text-[11px] font-bold text-error bg-error/5 border border-error/25 rounded-2xl flex items-center gap-2 justify-center tracking-wide uppercase">
          <AlertCircle size={14} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Core Action Buttons */}
      <div className="space-y-4 pt-4">
        {/* Resend Button */}
        <button
          onClick={handleResend}
          disabled={isPending || !email}
          className="w-full h-14 flex items-center justify-center gap-2 font-label-caps text-[10px] font-bold uppercase tracking-[0.25em] bg-primary text-on-primary hover:bg-primary/95 transition-all rounded-full hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
        >
          {isPending ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              Resending Link...
            </>
          ) : (
            'Resend Verification Link'
          )}
        </button>

        {/* Footnote Controls */}
        <div className="flex flex-col items-center gap-4 pt-6 border-t border-outline-variant/20 text-xs font-semibold">
          <Link
            href={`/signup?email=${encodeURIComponent(email)}`}
            className="text-primary font-bold hover:text-amber-700 transition-colors uppercase tracking-wider text-[10px]"
          >
            Change Email Address
          </Link>
          <Link
            href="/login"
            className="text-[10px] text-outline hover:text-primary transition-colors uppercase tracking-widest font-bold"
          >
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SignupSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-48">
        <Loader2 className="animate-spin text-primary" size={24} />
      </div>
    }>
      <SignupSuccessContent />
    </Suspense>
  )
}
