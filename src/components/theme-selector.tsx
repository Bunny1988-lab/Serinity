'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Check, Monitor } from 'lucide-react'
import { updateProfileSettings } from '@/app/(main)/actions'
import { useTheme } from 'next-themes'

const THEMES = [
  { id: 'system', name: 'System Auto', class: 'bg-background', type: 'all' },
  { id: 'ivory-mesh', name: 'Ivory Mesh', class: 'bg-[#faf9f6]', type: 'light' },
  { id: 'sage-mist', name: 'Sage Mist', class: 'bg-[#f7f9f8]', type: 'light' },
  { id: 'dusty-blue', name: 'Dusty Blue', class: 'bg-[#f0f4f8]', type: 'light' },
  { id: 'lavender-glow', name: 'Lavender Glow', class: 'bg-[#f5f3fa]', type: 'light' },
  { id: 'warm-beige', name: 'Warm Beige', class: 'bg-[#fdfbf7]', type: 'light' },
  
  { id: 'graphite-ambient', name: 'Graphite Ambient', class: 'bg-[#121214]', type: 'dark' },
  { id: 'charcoal-mist', name: 'Charcoal Mist', class: 'bg-[#18181b]', type: 'dark' },
  { id: 'midnight-blue', name: 'Midnight Blue', class: 'bg-[#0d0f14]', type: 'dark' },
  { id: 'deep-aurora', name: 'Deep Aurora', class: 'bg-[#0b0c10]', type: 'dark' },
  { id: 'smoky-glass', name: 'Smoky Glass', class: 'bg-[#1c1c1f]', type: 'dark' },
]

export function ThemeSelector({ currentTheme = 'system' }: { currentTheme?: string }) {
  const [selected, setSelected] = useState(currentTheme)
  const [isSaving, setIsSaving] = useState(false)
  const { resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  async function handleSelect(themeId: string) {
    if (themeId === selected) return
    setSelected(themeId)
    setIsSaving(true)
    
    // Live preview by updating body class directly before saving finishes
    document.body.className = document.body.className.replace(/theme-[a-z-]+/g, '')
    if (themeId !== 'system') {
      document.body.classList.add(`theme-${themeId}`)
    }

    const formData = new FormData()
    formData.append('wallpaper_theme', themeId)
    await updateProfileSettings(formData)
    
    setIsSaving(false)
  }

  return (
    <div className="space-y-4 w-full">
      <h3 className="text-sm font-medium uppercase tracking-widest text-muted-foreground/80 flex items-center gap-2">
        <Monitor size={16} />
        Atmosphere
      </h3>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 pt-2">
        {mounted && THEMES.filter(t => t.type === 'all' || t.type === resolvedTheme).map((theme) => {
          const isActive = selected === theme.id
          
          return (
            <button
              key={theme.id}
              onClick={() => handleSelect(theme.id)}
              className="relative flex flex-col items-center gap-2 group outline-none"
            >
              <div 
                className={`w-full aspect-[4/5] rounded-2xl border-2 transition-all overflow-hidden relative shadow-sm ${isActive ? 'border-primary shadow-md scale-105' : 'border-border/50 hover:border-primary/50 hover:shadow-md hover:-translate-y-1'}`}
              >
                <div className={`w-full h-full ${theme.id === 'system' ? 'bg-gradient-to-br from-muted to-background' : ''} ${theme.id !== 'system' ? `theme-${theme.id}` : ''}`} />
                
                {/* Active Indicator */}
                {isActive && (
                  <motion.div 
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute inset-0 flex items-center justify-center bg-background/20 backdrop-blur-[2px]"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                      <Check size={16} strokeWidth={3} />
                    </div>
                  </motion.div>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {theme.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
