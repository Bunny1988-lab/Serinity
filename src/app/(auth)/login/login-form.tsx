'use client'

import { login } from '@/app/auth/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLoader } from '@/components/loader-context'
import { useState } from 'react'

export function LoginForm({ error }: { error?: string }) {
  const { triggerLoader } = useLoader()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    // We let the native form submission continue by not calling e.preventDefault()
    // unless we wanted to handle the fetch ourselves. Next.js server actions
    // hooked to `action` allow us to do onSubmit + action simultaneously.
    setIsLoading(true)
    triggerLoader(4000) // Trigger cinematic loader for transition
  }

  return (
    <form action={login} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 text-sm text-destructive-foreground bg-destructive/10 rounded-xl border border-destructive/20 font-light">
          {error}
        </div>
      )}
      
      <div className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80 pl-1">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl transition-all font-light px-4"
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password" className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/80 pl-1">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            className="h-12 bg-background/50 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/30 rounded-2xl transition-all font-light px-4"
            placeholder="••••••••"
          />
        </div>
      </div>

      <Button disabled={isLoading} type="submit" className="w-full h-12 font-medium rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all text-primary-foreground">
        {isLoading ? 'Signing In...' : 'Sign In'}
      </Button>
    </form>
  )
}
