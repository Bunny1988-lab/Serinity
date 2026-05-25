'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background relative overflow-hidden">
      
      {/* Background ambient effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-background to-background mix-blend-screen"
        />
      </div>

      <div className="w-full flex">
        {/* Left Cinematic Hero Side */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-12 z-10 relative">
          <div className="space-y-6 max-w-xl mt-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="text-5xl font-light tracking-tight text-foreground leading-[1.1]">
                Welcome to <span className="font-normal opacity-90">Serenity</span> 🌿
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-2 text-xl font-light text-muted-foreground"
            >
              <p>A private space for intentional connection.</p>
              <p>Less noise. More meaning.</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="text-sm text-muted-foreground/50 font-light"
          >
            Your thoughts deserve a safe place.
          </motion.div>
        </div>

        {/* Right Auth Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md bg-background/60 backdrop-blur-2xl border border-border/50 shadow-2xl rounded-3xl p-8 sm:p-12"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
