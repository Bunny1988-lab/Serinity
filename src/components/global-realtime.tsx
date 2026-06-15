'use client'

import { useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { playNotificationSound } from '@/lib/sound'
import { useRouter } from 'next/navigation'

export function GlobalRealtime({ userId }: { userId: string }) {
  const router = useRouter()

  // Debounce router.refresh() so rapid-fire events (e.g. bulk deletes)
  // don't trigger multiple simultaneous refreshes that can crash mobile.
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null)
  const scheduleRefresh = useCallback((delay = 1500) => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      router.refresh()
    }, delay)
  }, [router])

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    
    // Listen for new and updated messages globally
    const msgChannel = supabase.channel('global_messages')
      .on('postgres_changes', { 
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        // Guard: payload.new is null/undefined for DELETE events
        const msg = payload.new as any
        if (payload.eventType === 'INSERT' && msg && msg.receiver_id === userId) {
          playNotificationSound()
        }
        // Debounced refresh — messages get 800ms delay (fast enough to feel real-time)
        scheduleRefresh(800)
      })
      .subscribe()

    // Listen for new and updated notifications globally
    const notifChannel = supabase.channel('global_notifications')
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        // Guard: payload.new is null/undefined for DELETE events
        const notif = payload.new as any
        if (payload.eventType === 'INSERT' && notif && notif.user_id === userId) {
          playNotificationSound()
        }
        // Debounced refresh — notifications get 800ms delay
        scheduleRefresh(800)
      })
      .subscribe()

    // Listen for new posts globally (Home Feed Realtime updates)
    const postsChannel = supabase.channel('global_posts')
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'posts'
      }, () => {
        // Posts get a longer 3000ms delay to batch multiple events together
        // and prevent excessive re-renders while user is scrolling the feed.
        scheduleRefresh(3000)
      })
      .subscribe()

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(notifChannel)
      supabase.removeChannel(postsChannel)
    }
  }, [userId, scheduleRefresh])

  return null
}
