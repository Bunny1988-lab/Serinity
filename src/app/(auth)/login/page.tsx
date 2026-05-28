import { LoginForm } from './login-form'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  return (
    <div className="w-full space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800">Welcome back</h1>
        <p className="text-sm text-slate-500 font-medium">Sign in to your Serenity account</p>
      </div>

      <LoginForm error={error} />

      <div className="text-center text-sm font-medium mt-8">
        <span className="text-slate-500">Don't have an account? </span>
        <Link href="/signup" className="text-teal-700 font-bold hover:text-teal-600 transition-colors">
          Create one
        </Link>
      </div>
    </div>
  )
}
