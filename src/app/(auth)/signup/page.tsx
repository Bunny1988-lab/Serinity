import { SignupForm } from './signup-form'
import Link from 'next/link'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-3 mb-8">
        <h1 className="font-display text-4xl font-bold tracking-tight text-primary italic">Join Serenity</h1>
        <p className="text-sm text-on-surface-variant font-medium">A calm, private space for intentional sharing.</p>
      </div>

      <SignupForm error={error} />

      <div className="text-center text-sm font-medium mt-10">
        <span className="text-on-surface-variant">Already have an account? </span>
        <Link href="/login" className="text-primary font-bold hover:text-secondary transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
