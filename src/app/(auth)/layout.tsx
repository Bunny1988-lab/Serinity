'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden select-none">
      
      {/* Premium Sunset/Twilight Dynamic Backdrops & Floating Veils */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        
        {/* Soft Warm Radial Sunset Glow */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.08, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -right-1/4 w-[130%] h-[130%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-500/15 via-rose-500/8 to-transparent dark:from-amber-500/5 dark:via-rose-500/3 mix-blend-screen"
        />

        {/* Slow Fading Indigo Twilight Blob */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.25, 0.45, 0.25], scale: [1, 1.15, 1] }}
          transition={{ duration: 18, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1/4 -left-1/4 w-[110%] h-[110%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-800/15 via-rose-500/5 to-transparent dark:from-indigo-900/5 dark:via-transparent mix-blend-screen"
        />

        {/* Dynamic Slow Floating Dust Particle Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(#c7c6cb_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-10" />
      </div>

      <div className="w-full flex z-10 min-h-screen">
        {/* ── LEFT HERO SIDE (Cinematic split view, hidden on mobile) ──────────────── */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-20 relative border-r-[0.5px] border-outline-variant/20 bg-surface-container-lowest/30 backdrop-blur-xs">
          <div className="absolute inset-0 bg-radial from-amber-500/2 via-transparent to-transparent pointer-events-none" />

          {/* Elegant top logo header */}
          <div>
            <span className="font-label-caps text-[10px] font-bold text-outline tracking-[0.3em] uppercase">
              The Intentional Circle
            </span>
          </div>

          {/* Core Cinematic Branding */}
          <div className="space-y-6 max-w-lg mt-24">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
            >
              <h1 className="font-display text-[72px] font-bold tracking-tight text-primary leading-[1.1] italic">
                Quiet.
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 0.75, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
              className="space-y-3 font-display text-lg text-on-surface-variant font-medium leading-relaxed italic"
            >
              <p>A digital temple for slow sharing, private reflection, and deep focus connection.</p>
            </motion.div>
          </div>

          {/* Premium Bottom Glassmorphic companion card */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease: 'easeOut' }}
            className="flex items-center gap-4 bg-white/10 dark:bg-black/10 backdrop-blur-md border border-white/20 dark:border-white/5 p-5 w-fit rounded-[24px] shadow-sm select-none"
          >
            <div className="w-10 h-10 rounded-full bg-surface border-[0.5px] border-outline-variant flex items-center justify-center shadow-xs">
              <span className="text-[15px] animate-pulse">🍵</span>
            </div>
            <div className="text-left">
              <p className="text-[11px] font-bold text-primary uppercase tracking-widest leading-none mb-1">Cast a daily Vignette</p>
              <p className="text-[9px] font-semibold text-outline uppercase tracking-wider">Discovers sunsets at twilight...</p>
            </div>
          </motion.div>
        </div>

        {/* ── RIGHT AUTH CARD SIDE (Fully responsive for mobile) ───────────────── */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[420px] bg-white/40 dark:bg-black/20 backdrop-blur-xl border border-white/25 dark:border-white/5 shadow-2xl p-8 sm:p-12 rounded-[40px] text-center relative overflow-hidden"
          >
            {/* Soft decorative inner glow */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 w-full">
              {children}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
