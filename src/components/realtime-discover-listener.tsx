'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function RealtimeDiscoverListener() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('discover-changes')
    
    // Listen for new posts
    channel.on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, () => {
      router.refresh()
    }).subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [router])

  return null
}
