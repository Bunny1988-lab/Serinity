'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

export default function Home() {
  return (
    <div className="flex min-h-screen bg-[#E0F2F1] relative overflow-hidden flex-col items-center justify-center p-6">
      
      {/* Background ambient effect */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-1/4 -left-1/4 w-[150%] h-[150%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/60 via-transparent to-transparent mix-blend-overlay"
        />
        
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: [0, 1, 0], y: -50 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          className="absolute bottom-1/4 right-1/4 w-32 h-32 bg-teal-300/20 rounded-full blur-3xl"
        />
      </div>

      <div className="z-10 w-full max-w-2xl flex flex-col items-center text-center space-y-12">
        
        <div className="space-y-6 relative">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            className="w-20 h-20 mx-auto bg-white/80 rounded-3xl shadow-xl flex items-center justify-center mb-8 border border-white/60 backdrop-blur-md"
          >
            <Sparkles className="text-teal-600" size={36} />
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-6xl font-bold tracking-tight text-slate-800 leading-[1.1]"
          >
            Welcome to <span className="text-teal-800">Serenity</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
            className="text-xl font-medium text-slate-600"
          >
            A private space for intentional connection. <br className="hidden sm:block" />
            Less noise. More meaning.
          </motion.p>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
        >
          <Link 
            href="/signup" 
            className="inline-flex h-14 items-center justify-center rounded-full bg-teal-800 px-8 text-base font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 gap-2"
          >
            Create your space
            <ArrowRight size={18} />
          </Link>
          <Link 
            href="/login" 
            className="inline-flex h-14 items-center justify-center rounded-full border border-teal-200 bg-white/70 backdrop-blur-md px-10 text-base font-semibold text-teal-900 shadow-sm transition-transform hover:scale-105 active:scale-95 hover:bg-white"
          >
            Sign in
          </Link>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="text-sm text-slate-500 font-medium"
        >
          Your thoughts deserve a safe place.
        </motion.p>

      </div>
    </div>
  )
}
