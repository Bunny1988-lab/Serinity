'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, User } from 'lucide-react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { FriendRequestButton } from '@/components/friend-request-button'
import { OnlineDot, usePresence } from '@/components/presence'

interface Author {
  id: string
  display_name: string | null
  avatar_url: string | null
}

interface Props {
  author: Author
  initialStatus: string | null
  requestId?: string
  children: React.ReactNode
  lightText?: boolean
}

export function AuthorProfileTrigger({ author, initialStatus, requestId, children, lightText = false }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const isOnline = usePresence(author.id)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative inline-block">
      {/* Trigger element (Avatar or Name) */}
      <div 
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
        className="cursor-pointer hover:opacity-85 active:scale-98 transition-all"
      >
        {children}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 mt-3 w-72 bg-surface border-[0.5px] border-outline-variant shadow-xl rounded-3xl p-6 z-50 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header info */}
            <div className="flex justify-between items-start mb-6">
              <div className="relative w-14 h-14 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border-[0.5px] border-outline-variant">
                {author.avatar_url ? (
                  <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-bold text-primary text-lg">{author.display_name?.[0]?.toUpperCase()}</span>
                )}
                <OnlineDot userId={author.id} className="absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-surface" />
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 bg-surface-container-low border-[0.5px] border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"
              >
                <X size={12} />
              </button>
            </div>

            {/* User Meta */}
            <div className="space-y-1 mb-6">
              <h4 className="font-headline-sm text-lg text-primary">{author.display_name || 'Anonymous'}</h4>
              <p className="text-[9px] text-outline uppercase tracking-[2px] font-semibold">
                {isOnline ? 'Connected Now' : 'Offline'}
              </p>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-col gap-2.5 pt-2 border-t-[0.5px] border-outline-variant/30">
              <div className="w-full flex">
                <FriendRequestButton 
                  targetUserId={author.id} 
                  initialStatus={initialStatus} 
                  requestId={requestId}
                />
              </div>
              
              <Link 
                href={`/messages?u=${author.id}`}
                className="w-full py-2.5 px-4 bg-surface-container border-[0.5px] border-outline-variant hover:bg-surface-container-high rounded-none text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary flex items-center justify-center gap-2 transition-all active:scale-98"
              >
                <MessageSquare size={12} />
                Send Message
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
