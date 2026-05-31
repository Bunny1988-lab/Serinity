import { LoginForm } from './login-form'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="w-full space-y-8 select-none">
      
      {/* Brand Header */}
      <div className="text-center space-y-2 mb-10">
        <span className="font-label-caps text-[9px] font-bold text-amber-600 uppercase tracking-[0.3em]">
          welcome back
        </span>
        <h1 className="font-display text-4xl font-bold tracking-wide text-primary italic">
          Quiet.
        </h1>
        <p className="text-xs text-on-surface-variant/80 font-medium tracking-wide">
          Enter your private, slow-social journal space.
        </p>
      </div>

      {/* Login form element */}
      <LoginForm error={error} />

      {/* Footnote controls */}
      <div className="text-center text-xs font-semibold mt-10 space-y-3.5 border-t border-outline-variant/20 pt-8">
        <div className="text-[11px] tracking-wide">
          <span className="text-on-surface-variant/80">Don't have a curated account? </span>
          <Link href="/signup" className="text-primary font-bold hover:text-amber-700 transition-colors uppercase tracking-wider text-[10px]">
            Join Circle
          </Link>
        </div>
        <div>
          <Link href="#" className="text-[10px] text-outline hover:text-primary transition-colors uppercase tracking-widest font-bold">
            Recover Access Keys
          </Link>
        </div>
      </div>
    </div>
  )
}
