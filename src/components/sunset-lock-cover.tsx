'use client'

import { useState, useEffect } from 'react'

export function SunsetLockCover({ children, isLocked }: { children: React.ReactNode, isLocked: boolean }) {
  const [isSunset, setIsSunset] = useState(true) // Default to true during hydration to avoid flash
  const [mounted, setMounted] = useState(false)
  const [timeLeft, setTimeLeft] = useState('')

  useEffect(() => {
    setMounted(true)
    const checkSunset = () => {
      const now = new Date()
      const hour = now.getHours()
      
      // Sunset is between 18:00 (6:00 PM) and 06:00 (6:00 AM)
      const unlocked = hour >= 18 || hour < 6
      setIsSunset(unlocked)

      if (!unlocked) {
        // Calculate time until 18:00
        const sunsetTime = new Date()
        sunsetTime.setHours(18, 0, 0, 0)
        const diffMs = sunsetTime.getTime() - now.getTime()
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`${diffHrs}h ${diffMins}m`)
      }
    }
    checkSunset()
    const interval = setInterval(checkSunset, 60000) // check every minute
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="relative w-full h-[500px] bg-surface-container-low border-[0.5px] border-outline-variant/30 flex items-center justify-center rounded-2xl"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
  }

  if (isLocked && !isSunset) {
    return (
      <div className="relative group overflow-hidden rounded-2xl">
        {/* The deeply blurred actual content */}
        <div className="blur-2xl opacity-40 scale-105 pointer-events-none select-none">
          {children}
        </div>
        
        {/* The Lock Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-indigo-950/80 via-rose-950/40 to-transparent flex flex-col items-center justify-center text-center p-8 select-none">
          <div className="absolute inset-0 bg-radial from-amber-500/10 via-transparent to-transparent blur-3xl pointer-events-none" />
          
          <div className="relative z-10 backdrop-blur-2xl bg-white/5 border border-white/10 p-8 max-w-[280px] rounded-3xl shadow-2xl flex flex-col items-center gap-4 transition-transform duration-700 hover:scale-105">
            <span className="material-symbols-outlined text-[32px] text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" style={{ fontVariationSettings: "'FILL' 1" }}>
              wb_twilight
            </span>
            <div className="space-y-1">
              <h4 className="font-display text-xl text-white font-medium tracking-wide">Sunset Lock</h4>
              <p className="font-sans text-[9px] tracking-[0.25em] text-white/60 uppercase font-bold">
                Unlocks at 6:00 PM
              </p>
            </div>
            <div className="w-8 h-[0.5px] bg-white/20 my-1" />
            <p className="font-sans text-xs text-white/70 italic tabular-nums font-medium tracking-wider">
              {timeLeft} remaining
            </p>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
