'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'

const THEME_TYPES: Record<string, string> = {
  'ivory-mesh': 'light',
  'sage-mist': 'light',
  'dusty-blue': 'light',
  'lavender-glow': 'light',
  'warm-beige': 'light',
  'graphite-ambient': 'dark',
  'charcoal-mist': 'dark',
  'midnight-blue': 'dark',
  'deep-aurora': 'dark',
  'smoky-glass': 'dark',
}

export function WallpaperProvider({ 
  theme = 'system', 
  children 
}: { 
  theme?: string
  children: React.ReactNode 
}) {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()
  
  useEffect(() => {
    setMounted(true)
    // Remove any existing theme classes from body
    document.body.className = document.body.className.replace(/theme-[a-z-]+/g, '')
    
    // Only apply if it matches current resolved theme mode
    const isCompatible = theme === 'system' || THEME_TYPES[theme] === resolvedTheme
    
    if (theme && theme !== 'system' && isCompatible) {
      document.body.classList.add(`theme-${theme}`)
    }
  }, [theme, resolvedTheme])

  // Optional: subtle ambient motion if a premium theme is selected and compatible
  const isCustomTheme = theme && theme !== 'system' && THEME_TYPES[theme] === resolvedTheme

  return (
    <>
      {mounted && isCustomTheme && (
        <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
          {/* Static gradient — no transform/scale to avoid creating a stacking context */}
          <div className="absolute inset-0 opacity-50 bg-gradient-to-tr from-transparent via-background/10 to-transparent mix-blend-overlay" />
        </div>
      )}
      {children}
    </>
  )
}
