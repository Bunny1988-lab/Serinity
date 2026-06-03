import { SignupForm } from './signup-form'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; email?: string }>
}) {
  const { error, email } = await searchParams

  return (
    <div className="w-full space-y-8 select-none">
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-10">
        <span className="font-label-caps text-[9px] font-bold text-amber-600 uppercase tracking-[0.3em]">
          curate profile
        </span>
        <h1 className="font-display text-4xl font-bold tracking-wide text-primary italic">
          Quiet.
        </h1>
        <p className="text-xs text-on-surface-variant/80 font-medium tracking-wide">
          A calm, private space for intentional sharing.
        </p>
      </div>

      <SignupForm error={error} initialEmail={email} />

      {/* Footnote controls */}
      <div className="text-center text-xs font-semibold mt-10 border-t border-outline-variant/20 pt-8">
        <div className="text-[11px] tracking-wide">
          <span className="text-on-surface-variant/80">Already have an account? </span>
          <Link href="/login" className="text-primary font-bold hover:text-amber-700 transition-colors uppercase tracking-wider text-[10px]">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
