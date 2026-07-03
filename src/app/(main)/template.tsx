'use client'

import { motion } from 'framer-motion'

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="w-full h-full"
      // NOTE: Do NOT add transform (y, scale, etc.) here.
      // CSS transforms create a new stacking context that traps position:fixed
      // children inside it, breaking the drawer and modal z-index hierarchy.
    >
      {children}
    </motion.div>
  )
}
