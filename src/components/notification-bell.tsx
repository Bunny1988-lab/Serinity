'use client'
import { Bell } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications } from '@/app/(main)/actions'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const formatNotifications = (data: any[]) => {
    return (data || []).map((n: any) => {
      let text = ''
      let link = ''
      
      if (n.type === 'friend_request') {
        text = `${n.source_user?.display_name || 'Someone'} wants to connect.`
        link = '/discover'
      } else if (n.type === 'message') {
        text = `New message from ${n.source_user?.display_name || 'Someone'}.`
        link = '/messages'
      } else if (n.type === 'reaction') {
        text = `${n.source_user?.display_name || 'Someone'} reacted to your post.`
        link = '/appreciation'
      } else {
        text = `New activity from ${n.source_user?.display_name || 'Someone'}.`
        link = '/home'
      }

      return {
        id: n.id,
        text,
        time: n.created_at,
        isRead: n.read,
        link
      }
    })
  }

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      getNotifications().then(data => {
        setNotifications(formatNotifications(data))
        setIsLoading(false)
      })
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.isRead).length
  
  useEffect(() => {
    // Initial fetch
    getNotifications().then(data => {
      setNotifications(formatNotifications(data))
    })

    // Setup Supabase Realtime Subscription
    const supabase = createClient()
    const channel = supabase.channel('realtime_notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        getNotifications().then(data => {
          setNotifications(formatNotifications(data))
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 flex items-center justify-center relative text-foreground hover:bg-[#BCE3D8]/30 rounded-full transition-colors cursor-pointer"
      >
        <Bell size={20} strokeWidth={2} />
        {unreadCount > 0 && (
          <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-foreground rounded-full border-[2px] border-[#E4F2EF]"></span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 top-12 w-80 bg-card backdrop-blur-xl rounded-[24px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] border border-border-mint p-4 z-50"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <h3 className="font-bold text-foreground text-[15px]">Notifications</h3>
              </div>
              
              <div className="space-y-2 max-h-[350px] overflow-y-auto hide-scrollbar">
                {isLoading ? (
                  <div className="text-center py-6 text-foreground/50 text-[12px] font-bold uppercase tracking-widest">
                    Loading...
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="text-[24px] mb-2 block">🌿</span>
                    <p className="text-[13px] font-bold text-foreground">All caught up!</p>
                    <p className="text-[11px] font-medium text-foreground/60 mt-0.5">No new notifications</p>
                  </div>
                ) : (
                  notifications.map(n => (
                    <Link href={n.link} key={n.id} onClick={() => setIsOpen(false)}>
                      <div className="p-3 bg-background hover:bg-[#BCE3D8]/30 transition-colors rounded-[16px] border border-border-mint/50">
                        <p className="text-[13px] font-bold text-foreground">{n.text}</p>
                        <p className="text-[10px] font-bold text-foreground/50 mt-1 uppercase tracking-widest">{formatTimeAgo(n.time)}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
