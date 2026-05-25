'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const MESSAGES = [
  "Preparing your private space...",
  "Less noise. More meaning.",
  "Bringing your trusted world together...",
  "A quieter social experience awaits...",
  "Almost ready 🌿"
]

export function SplashLoader({ isVisible }: { isVisible: boolean }) {
  const [messageIndex, setMessageIndex] = useState(0)

  useEffect(() => {
    if (!isVisible) return

    // Rotate messages every 1.5 seconds
    const interval = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % MESSAGES.length)
    }, 1500)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="splash-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-3xl"
        >
          {/* Ambient Background Movement */}
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
              transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent mix-blend-screen"
            />
          </div>

          <div className="z-10 flex flex-col items-center space-y-12">
            
            {/* Animated Brand Mascot / Orb */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.95, 1.05, 0.95], opacity: [0.8, 1, 0.8] }}
              transition={{ 
                duration: 4, 
                ease: "easeInOut", 
                repeat: Infinity 
              }}
              className="relative flex items-center justify-center w-24 h-24"
            >
              {/* Outer soft glow */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl" />
              {/* Inner core */}
              <div className="w-12 h-12 bg-primary rounded-full shadow-[0_0_40px_rgba(var(--primary),0.8)]" />
              {/* Soft reflection */}
              <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-white/40 rounded-full blur-[2px]" />
            </motion.div>

            {/* Rotating Messaging */}
            <div className="h-8 flex items-center justify-center overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={messageIndex}
                  initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.8, ease: "easeInOut" }}
                  className="text-lg font-light text-muted-foreground tracking-wide text-center px-6"
                >
                  {MESSAGES[messageIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
            
            {/* Subtle Progress Indicator (Breathing Line) */}
            <motion.div 
              className="w-32 h-[1px] bg-border relative overflow-hidden"
            >
              <motion.div 
                className="absolute inset-0 bg-primary/50"
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
