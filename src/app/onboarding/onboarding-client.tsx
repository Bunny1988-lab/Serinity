'use client'

import { motion } from 'framer-motion'
import { ThemeSelector } from '@/components/theme-selector'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function OnboardingClient({ displayName }: { displayName: string }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-transparent">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-2xl bg-background/80 backdrop-blur-3xl border border-border/50 shadow-2xl rounded-[2.5rem] p-8 sm:p-16 flex flex-col items-center"
      >
        <div className="text-center space-y-4 mb-12">
          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-3xl sm:text-4xl font-light tracking-tight text-foreground"
          >
            Welcome, {displayName}.
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-muted-foreground font-light text-lg"
          >
            Choose the atmosphere for your space.
          </motion.p>
        </div>

        <div className="w-full mb-12">
          <ThemeSelector currentTheme="system" />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.8 }}
        >
          <Button 
            onClick={() => router.push('/feed')}
            className="rounded-full h-12 px-8 font-medium shadow-md transition-all group"
          >
            Enter Serenity
            <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  )
}
