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
  const scheduleRefresh = useCallback(() => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current)
    refreshTimerRef.current = setTimeout(() => {
      router.refresh()
    }, 300)
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
        // Debounced refresh — prevents mobile "page not found" crash
        // when bulk deletes trigger many events simultaneously.
        scheduleRefresh()
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
        // Debounced refresh
        scheduleRefresh()
      })
      .subscribe()

    // Listen for new posts globally (Home Feed Realtime updates)
    const postsChannel = supabase.channel('global_posts')
      .on('postgres_changes', {
        event: '*', // Listen to INSERT, UPDATE, DELETE
        schema: 'public',
        table: 'posts'
      }, () => {
        // Debounced refresh to seamlessly update the feed without reloading
        scheduleRefresh()
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
