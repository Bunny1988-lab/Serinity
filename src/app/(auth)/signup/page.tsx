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
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Join Serenity</h1>
        <p className="text-sm text-slate-500 font-medium">A calm, private space for intentional sharing</p>
      </div>

      <SignupForm error={error} />

      <div className="text-center text-sm font-medium mt-8">
        <span className="text-slate-500">Already have an account? </span>
        <Link href="/login" className="text-teal-700 font-bold hover:text-teal-600 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
