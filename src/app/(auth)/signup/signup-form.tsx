'use client'

import { signup } from '@/app/auth/actions'
import { useLoader } from '@/components/loader-context'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export function SignupForm({ error, initialEmail }: { error?: string; initialEmail?: string }) {
  const { triggerLoader } = useLoader()
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true)
    triggerLoader(4000)
  }

  return (
    <form action={signup} onSubmit={handleSubmit} className="space-y-6 text-left select-none">
      {error && (
        <div className="p-4 text-[11px] font-bold text-error bg-error/5 border border-error/25 rounded-2xl tracking-wide uppercase">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <label htmlFor="email" className="text-[9px] font-bold uppercase tracking-[0.25em] text-outline pl-1">
            Email Key
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            disabled={isLoading}
            defaultValue={initialEmail || ''}
            className="w-full h-14 bg-background/50 border border-outline-variant/40 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/3 rounded-2xl transition-all text-xs font-semibold text-primary px-5 outline-none placeholder:text-outline/50 shadow-xs"
            placeholder="curator@quiet.network"
          />
        </div>
        
        {/* Username and Display Name Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <label htmlFor="username" className="text-[9px] font-bold uppercase tracking-[0.25em] text-outline pl-1">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              disabled={isLoading}
              className="w-full h-14 bg-background/50 border border-outline-variant/40 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/3 rounded-2xl transition-all text-xs font-semibold text-primary px-5 outline-none placeholder:text-outline/50 shadow-xs"
              placeholder="johndoe"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="display_name" className="text-[9px] font-bold uppercase tracking-[0.25em] text-outline pl-1">
              Display Name
            </label>
            <input
              id="display_name"
              name="display_name"
              type="text"
              required
              disabled={isLoading}
              className="w-full h-14 bg-background/50 border border-outline-variant/40 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/3 rounded-2xl transition-all text-xs font-semibold text-primary px-5 outline-none placeholder:text-outline/50 shadow-xs"
              placeholder="John Doe"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label htmlFor="password" className="text-[9px] font-bold uppercase tracking-[0.25em] text-outline pl-1">
            Access Passcode
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            disabled={isLoading}
            className="w-full h-14 bg-background/50 border border-outline-variant/40 focus:border-amber-500/40 focus:ring-4 focus:ring-amber-500/3 rounded-2xl transition-all text-xs font-semibold text-primary px-5 outline-none placeholder:text-outline/50 shadow-xs"
            placeholder="••••••••"
          />
        </div>
      </div>

      {/* Submit Button */}
      <button 
        disabled={isLoading} 
        type="submit" 
        className="w-full h-14 mt-6 flex items-center justify-center gap-2 font-label-caps text-[10px] font-bold uppercase tracking-[0.25em] bg-primary text-on-primary hover:bg-primary/95 transition-all rounded-full hover:scale-[1.01] active:scale-[0.98] cursor-pointer shadow-sm disabled:opacity-50"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Creating Space...
          </>
        ) : (
          'Curate Profile'
        )}
      </button>
    </form>
  )
}
