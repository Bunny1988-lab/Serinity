'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ZoomIn } from 'lucide-react'

export function ExpandableImage({ src, alt, className, layoutId }: { src: string, alt: string, className?: string, layoutId: string }) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Prevent scrolling when expanded
  useEffect(() => {
    if (isExpanded) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [isExpanded])

  // Simple dominant color trick: Use the image itself heavily blurred behind a dark overlay
  return (
    <>
      <motion.div 
        layoutId={`container-${layoutId}`}
        className={`relative group cursor-pointer ${className}`}
        onClick={() => setIsExpanded(true)}
      >
        <motion.img
          layoutId={`image-${layoutId}`}
          src={src}
          alt={alt}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
        />
        {/* Subtle expand hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <ZoomIn className="text-white/80 drop-shadow-md" size={32} strokeWidth={1.5} />
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[100] flex items-center justify-center"
            onClick={() => setIsExpanded(false)}
          >
            {/* Cinematic blurred background using the image itself */}
            <div className="absolute inset-0 bg-black/80">
              <img src={src} alt="" className="w-full h-full object-cover opacity-30 blur-3xl scale-110 saturate-200" />
            </div>

            <button 
              className="absolute top-8 right-8 z-50 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white/80 transition-all hover:scale-105 active:scale-95"
              onClick={(e) => { e.stopPropagation(); setIsExpanded(false) }}
            >
              <X size={24} />
            </button>

            <motion.div 
              layoutId={`container-${layoutId}`}
              className="relative z-10 max-w-[90vw] max-h-[90vh] overflow-hidden rounded-md shadow-[0_0_100px_rgba(0,0,0,0.5)]"
              onClick={(e) => e.stopPropagation()} // prevent closing when clicking the image
            >
              <motion.img
                layoutId={`image-${layoutId}`}
                src={src}
                alt={alt}
                className="w-full h-full max-h-[90vh] object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
