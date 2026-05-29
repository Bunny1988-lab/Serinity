'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#FAFBF9] relative overflow-hidden">
      
      {/* Background ambient effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none hidden md:block">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -right-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#E8EFE9]/60 via-[#F0F4F1]/30 to-transparent mix-blend-multiply"
        />
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.2, 1] }}
          transition={{ duration: 15, delay: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-1/4 -left-1/4 w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#F4F7F5]/80 via-transparent to-transparent mix-blend-multiply"
        />
      </div>

      <div className="w-full flex">
        {/* Left Cinematic Hero Side */}
        <div className="hidden lg:flex flex-1 flex-col justify-between p-16 z-10 relative">
          <div className="space-y-6 max-w-xl mt-32">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <h1 className="text-5xl font-light tracking-tight text-[#2F3E36] leading-[1.1]">
                Welcome to <span className="font-semibold text-[#1A2922]">Serenity</span> 🌿
              </h1>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="space-y-2 text-xl font-light text-[#4A5D53]"
            >
              <p>Your calm digital space for growth, reflection, and meaningful connection.</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="flex items-center gap-4 bg-white/40 backdrop-blur-md border border-white/50 p-4 rounded-2xl w-fit"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#E8EFE9] to-[#CDE0D4] flex items-center justify-center shadow-inner">
              ✨
            </div>
            <div>
              <p className="text-sm font-medium text-[#2F3E36]">Meet Seren</p>
              <p className="text-xs text-[#4A5D53]">Your personal AI companion awaits</p>
            </div>
          </motion.div>
        </div>

        {/* Right Auth Side */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12 z-10">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full max-w-md bg-white/70 backdrop-blur-2xl border border-white/80 shadow-2xl shadow-[#CDE0D4]/20 rounded-[2rem] p-8 sm:p-12"
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
