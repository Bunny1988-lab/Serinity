'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { playNotificationSound } from '@/lib/sound'
import { useRouter } from 'next/navigation'

export function GlobalRealtime({ userId }: { userId: string }) {
  const router = useRouter()

  useEffect(() => {
    if (!userId) return
    const supabase = createClient()
    
    // Listen for new and updated messages globally
    const msgChannel = supabase.channel('global_messages')
      .on('postgres_changes', { 
        event: '*', // Listen to both INSERT and UPDATE
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playNotificationSound()
        }
        // Refresh the page data (updates unread counter in layout)
        router.refresh()
      })
      .subscribe()

    // Listen for new and updated notifications globally
    const notifChannel = supabase.channel('global_notifications')
      .on('postgres_changes', {
        event: '*', // Listen to both INSERT and UPDATE
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          playNotificationSound()
        }
        // Refresh the page data (updates unread counter in layout)
        router.refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(msgChannel)
      supabase.removeChannel(notifChannel)
    }
  }, [userId, router])

  return null
}
