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
        <h1 className="text-3xl font-semibold tracking-tight text-[#2F3E36]">Welcome back</h1>
        <p className="text-sm text-[#4A5D53] font-medium">Sign in to your Serenity account</p>
      </div>

      <LoginForm error={error} />

      <div className="text-center text-sm font-medium mt-8 space-y-4">
        <div>
          <span className="text-[#4A5D53]">Don't have an account? </span>
          <Link href="/signup" className="text-[#1A2922] font-bold hover:text-[#2F3E36] transition-colors">
            Create one
          </Link>
        </div>
        <div>
          <Link href="#" className="text-xs text-[#4A5D53]/70 hover:text-[#4A5D53] transition-colors">
            Forgot password?
          </Link>
        </div>
      </div>
    </div>
  )
}
