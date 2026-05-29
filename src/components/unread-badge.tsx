'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  initialCount: number
  userId: string
}

export function UnreadBadge({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel('unread_badge')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any
        if (msg.receiver_id === userId) {
          setCount(c => c + 1)
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
      }, (payload) => {
        const msg = payload.new as any
        const old = payload.old as any
        // When read_at is set (message was read), decrement
        if (msg.receiver_id === userId && !old.read_at && msg.read_at) {
          setCount(c => Math.max(0, c - 1))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (count <= 0) return null

  return (
    <span className="ml-auto min-w-[16px] h-[16px] bg-secondary border border-border/50 text-muted-foreground text-[9px] font-medium rounded-full flex items-center justify-center px-1 opacity-80">
      {count > 9 ? '9+' : count}
    </span>
  )
}

// Mobile version of the badge
export function UnreadBadgeMobile({ initialCount, userId }: Props) {
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase.channel('unread_badge_mobile')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any
        if (msg.receiver_id === userId) setCount(c => c + 1)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new as any
        const old = payload.old as any
        if (msg.receiver_id === userId && !old.read_at && msg.read_at) {
          setCount(c => Math.max(0, c - 1))
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  if (count <= 0) return null

  return (
    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary/60 border border-background rounded-full">
    </span>
  )
}
