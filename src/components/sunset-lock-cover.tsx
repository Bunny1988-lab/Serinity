'use client'

import { useState, useEffect } from 'react'

export function SunsetLockCover({ children, isLocked }: { children: React.ReactNode, isLocked: boolean }) {
  const [isSunset, setIsSunset] = useState(true) // Default to true during hydration to avoid flash
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const checkSunset = () => {
      const hour = new Date().getHours()
      const mins = new Date().getMinutes()
      const time = hour + mins / 60
      setIsSunset(time >= 17.0 && time <= 19.5) // 17:00 - 19:30
    }
    checkSunset()
    const interval = setInterval(checkSunset, 60000) // check every minute
    return () => clearInterval(interval)
  }, [])

  if (!mounted) {
    return <div className="relative w-full h-[500px] bg-surface-container-low border-[0.5px] border-outline-variant/30 flex items-center justify-center"><div className="w-6 h-6 rounded-full border-2 border-primary/20 border-t-primary animate-spin" /></div>
  }

  if (isLocked && !isSunset) {
    return (
      <div className="relative w-full h-[500px] overflow-hidden bg-gradient-to-tr from-amber-500/10 via-rose-500/10 to-indigo-950/20 border-[0.5px] border-outline-variant/30 flex flex-col items-center justify-center text-center p-8 select-none rounded-2xl">
        {/* Glowing twilight background glow */}
        <div className="absolute inset-0 bg-radial from-amber-500/15 via-transparent to-transparent blur-3xl pointer-events-none" />
        
        {/* Glassmorphism card overlay */}
        <div className="relative z-10 backdrop-blur-xl bg-white/10 dark:bg-black/20 border border-white/10 dark:border-white/5 p-8 max-w-sm rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-[36px] text-amber-500 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
            wb_twilight
          </span>
          <h4 className="font-display text-lg text-primary font-medium tracking-wide">Sunset Curation</h4>
          <p className="font-sans text-[10px] tracking-[0.2em] text-on-surface-variant uppercase font-bold">
            unveils only at twilight
          </p>
          <div className="w-8 h-[0.5px] bg-outline-variant my-1" />
          <p className="font-sans text-[11px] leading-relaxed text-on-surface-variant/70 italic">
            This card is currently dreaming. Return between 17:00 and 19:30 local time to reveal.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
