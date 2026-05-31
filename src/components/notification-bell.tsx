'use client'

import { Bell, Heart, MessageSquare, Check, CheckCheck, Sparkles } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getNotifications, markNotificationsRead, markNotificationRead } from '@/app/(main)/actions'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(dateString: string) {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

type NotifType = 'reaction' | 'comment' | string

function notifMeta(type: NotifType, sourceName: string, postContent?: string) {
  const post = postContent ? `"${postContent.slice(0, 40)}${postContent.length > 40 ? '…' : ''}"` : 'your post'
  switch (type) {
    case 'reaction':
      return {
        icon: <Heart size={13} className="text-rose-500 fill-rose-500" />,
        iconBg: 'bg-rose-500/10',
        text: `${sourceName} appreciated ${post}`,
        link: '/appreciation',
      }
    case 'comment':
      return {
        icon: <MessageSquare size={13} className="text-blue-500 fill-blue-400/20" />,
        iconBg: 'bg-blue-500/10',
        text: `${sourceName} commented on ${post}`,
        link: '/home',
      }
    default:
      return {
        icon: <Sparkles size={13} className="text-amber-500" />,
        iconBg: 'bg-amber-500/10',
        text: `New activity from ${sourceName}`,
        link: '/home',
      }
  }
}

// ── Skeleton ──────────────────────────────────────────────────────────────────
function SkeletonRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-surface-container-high shrink-0" />
      <div className="flex-1 space-y-1.5 pt-0.5">
        <div className="h-3 bg-surface-container-high rounded-full w-3/4" />
        <div className="h-2.5 bg-surface-container-high rounded-full w-1/3" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Parse raw DB notifications into display format
  const parse = (data: any[]) =>
    (data || []).map((n: any) => ({
      id: n.id,
      type: n.type as NotifType,
      isRead: n.read,
      time: n.created_at,
      sourceName: n.source_user?.display_name || 'Someone',
      sourceAvatar: n.source_user?.avatar_url || null,
      postContent: n.post?.content || null,
    }))

  // Initial load + realtime subscription
  useEffect(() => {
    setIsLoading(true)
    getNotifications().then(data => {
      setNotifications(parse(data))
      setIsLoading(false)
    })

    const supabase = createClient()
    const channel = supabase
      .channel('notif_bell')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        getNotifications().then(data => setNotifications(parse(data)))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [isOpen])

  const unreadCount = notifications.filter(n => !n.isRead).length

  // Mark individual notification as read + navigate
  async function handleNotifClick(n: (typeof notifications)[0], link: string) {
    setIsOpen(false)
    if (!n.isRead) {
      // Optimistic update
      setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, isRead: true } : x))
      await markNotificationRead(n.id)
    }
    router.push(link)
  }

  // Mark all as read
  async function handleMarkAllRead() {
    if (unreadCount === 0) return
    setIsMarkingAll(true)
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
    await markNotificationsRead()
    setIsMarkingAll(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(prev => !prev)}
        aria-label="Open notifications"
        className={`w-10 h-10 flex items-center justify-center relative rounded-full transition-all cursor-pointer
          ${isOpen
            ? 'bg-primary/10 text-primary'
            : 'text-foreground hover:bg-border-mint/30'
          }`}
      >
        <motion.div
          animate={unreadCount > 0 ? { rotate: [0, -15, 15, -10, 10, 0] } : {}}
          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 4 }}
        >
          <Bell size={20} strokeWidth={2} />
        </motion.div>

        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center leading-none border-2 border-background"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notification-panel"
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="absolute right-0 top-12 w-[360px] max-w-[calc(100vw-24px)] bg-card border border-border-mint rounded-[24px] shadow-[0_16px_48px_rgba(0,0,0,0.08)] overflow-hidden z-[100]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-border-mint/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-foreground text-[15px]">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-black">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/60 hover:text-foreground uppercase tracking-wider transition-colors disabled:opacity-40 cursor-pointer"
                >
                  {isMarkingAll ? (
                    <CheckCheck size={13} className="animate-pulse" />
                  ) : (
                    <Check size={13} />
                  )}
                  Mark all read
                </button>
              )}
            </div>

            {/* Content */}
            <div className="max-h-[420px] overflow-y-auto hide-scrollbar">
              {isLoading ? (
                <div className="py-2">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
                    <Bell size={22} strokeWidth={1.5} className="text-foreground/30" />
                  </div>
                  <div>
                    <p className="font-bold text-foreground text-[14px]">All caught up 🌿</p>
                    <p className="text-[12px] text-foreground/50 font-medium mt-0.5">No new notifications</p>
                  </div>
                </div>
              ) : (
                <div className="py-2 divide-y divide-border-mint/30">
                  {notifications.map(n => {
                    const meta = notifMeta(n.type, n.sourceName, n.postContent)
                    return (
                      <motion.button
                        key={n.id}
                        onClick={() => handleNotifClick(n, meta.link)}
                        whileHover={{ backgroundColor: 'rgba(188,227,216,0.15)' }}
                        whileTap={{ scale: 0.99 }}
                        className={`w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer relative ${
                          n.isRead ? 'opacity-70' : ''
                        }`}
                      >
                        {/* Unread dot */}
                        {!n.isRead && (
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-rose-500" />
                        )}

                        {/* Source User Avatar */}
                        <div className="relative shrink-0">
                          <div className="w-9 h-9 rounded-full bg-background border border-border-mint overflow-hidden flex items-center justify-center">
                            {n.sourceAvatar ? (
                              <img src={n.sourceAvatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[14px] font-bold text-foreground">
                                {n.sourceName[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          {/* Type icon badge */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full ${meta.iconBg} border-2 border-card flex items-center justify-center`}>
                            {meta.icon}
                          </div>
                        </div>

                        {/* Text */}
                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className={`text-[13px] leading-snug break-words ${n.isRead ? 'text-foreground/70 font-medium' : 'text-foreground font-semibold'}`}>
                            {meta.text}
                          </p>
                          <p className="text-[10px] text-foreground/40 font-bold uppercase tracking-wider mt-1">
                            {timeAgo(n.time)}
                          </p>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Footer: link to full page */}
            {notifications.length > 0 && (
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center py-3 border-t border-border-mint/50 text-[12px] font-bold uppercase tracking-widest text-foreground/50 hover:text-foreground hover:bg-border-mint/20 transition-colors"
              >
                Notification Settings →
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
