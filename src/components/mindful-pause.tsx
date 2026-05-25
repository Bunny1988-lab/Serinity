'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function MindfulPause() {
  const [show, setShow] = useState(false)
  const [phase, setPhase] = useState<'inhale' | 'exhale' | 'done'>('inhale')

  useEffect(() => {
    // Check if we've already shown this session
    const hasPaused = sessionStorage.getItem('mindful_pause')
    if (!hasPaused) {
      setShow(true)
      sessionStorage.setItem('mindful_pause', 'true')
      
      // Sequence
      setTimeout(() => setPhase('exhale'), 1500)
      setTimeout(() => {
        setPhase('done')
        setShow(false)
      }, 3500)
    }
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center"
        >
          <div className="relative flex items-center justify-center">
            {/* Outer expanding ring */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: phase === 'inhale' ? 1.5 : 0.8,
                opacity: phase === 'done' ? 0 : 0.5 
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute w-40 h-40 rounded-full border border-primary"
            />
            
            {/* Inner solid ring */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ 
                scale: phase === 'inhale' ? 1.2 : 0.9,
                opacity: phase === 'done' ? 0 : 1
              }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center backdrop-blur-sm"
            >
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: phase === 'done' ? 0 : 1 }}
                className="text-primary font-medium tracking-widest text-sm uppercase"
              >
                {phase === 'inhale' ? 'Inhale' : 'Exhale'}
              </motion.span>
            </motion.div>
          </div>
          
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 text-muted-foreground font-light"
          >
            Take a moment before you enter.
          </motion.p>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
