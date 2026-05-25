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
        <h1 className="text-3xl font-light tracking-tight text-foreground">Join Serenity</h1>
        <p className="text-sm text-muted-foreground font-light">A calm, private space for intentional sharing</p>
      </div>

      <SignupForm error={error} />

      <div className="text-center text-sm font-light mt-8">
        <span className="text-muted-foreground">Already have an account? </span>
        <Link href="/login" className="text-primary font-medium hover:text-primary/80 transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  )
}
