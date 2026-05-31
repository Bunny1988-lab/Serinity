'use client'

import { signup } from '@/app/auth/actions'
import { useLoader } from '@/components/loader-context'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function SignupForm({ error }: { error?: string }) {
  const { triggerLoader } = useLoader()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true)
    triggerLoader(4000)
  }

  return (
    <form action={signup} onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 text-[13px] font-bold text-red-600 bg-red-50 rounded-[16px] border border-red-100">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="email" className="text-xs font-bold uppercase tracking-widest text-secondary pl-1">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full h-14 bg-surface-container-lowest border-[0.5px] border-outline-variant focus:border-primary focus:ring-0 rounded-none transition-colors text-sm font-medium text-primary px-4 outline-none placeholder:text-on-surface-variant shadow-sm"
            placeholder="you@example.com"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="username" className="text-xs font-bold uppercase tracking-widest text-secondary pl-1">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="w-full h-14 bg-surface-container-lowest border-[0.5px] border-outline-variant focus:border-primary focus:ring-0 rounded-none transition-colors text-sm font-medium text-primary px-4 outline-none placeholder:text-on-surface-variant shadow-sm"
              placeholder="johndoe"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="display_name" className="text-xs font-bold uppercase tracking-widest text-secondary pl-1">Display Name</label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              className="w-full h-14 bg-surface-container-lowest border-[0.5px] border-outline-variant focus:border-primary focus:ring-0 rounded-none transition-colors text-sm font-medium text-primary px-4 outline-none placeholder:text-on-surface-variant shadow-sm"
              placeholder="John Doe"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-xs font-bold uppercase tracking-widest text-secondary pl-1">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full h-14 bg-surface-container-lowest border-[0.5px] border-outline-variant focus:border-primary focus:ring-0 rounded-none transition-colors text-sm font-medium text-primary px-4 outline-none placeholder:text-on-surface-variant shadow-sm"
            placeholder="••••••••"
          />
        </div>
      </div>

      <button 
        disabled={isLoading} 
        type="submit" 
        className="w-full h-14 mt-4 flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-[0.2em] shadow-sm bg-primary hover:bg-secondary transition-colors text-on-primary disabled:opacity-50 cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Creating Space...
          </>
        ) : (
          'Create Account'
        )}
      </button>
    </form>
  )
}
