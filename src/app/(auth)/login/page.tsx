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
        <h1 className="text-3xl font-light tracking-tight text-foreground">Welcome back</h1>
        <p className="text-sm text-muted-foreground font-light">Sign in to your Serenity account</p>
      </div>

      <LoginForm error={error} />

      <div className="text-center text-sm font-light mt-8">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link href="/signup" className="text-primary font-medium hover:text-primary/80 transition-colors">
          Create one
        </Link>
      </div>
    </div>
  )
}
