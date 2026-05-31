'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Global presence state shared across the app
type PresenceState = Record<string, boolean> // userId -> isOnline

let globalPresence: PresenceState = {}
const listeners = new Set<(p: PresenceState) => void>()

function notifyListeners() {
  const snapshot = { ...globalPresence }
  listeners.forEach(fn => fn(snapshot))
}

let presenceChannel: ReturnType<ReturnType<typeof createClient>['channel']> | null = null
let presenceInitialized = false

export function initPresence(userId: string) {
  if (presenceInitialized) return
  presenceInitialized = true

  const supabase = createClient()
  presenceChannel = supabase.channel('global_presence', {
    config: { presence: { key: userId } }
  })

  presenceChannel
    .on('presence', { event: 'sync' }, () => {
      const state = presenceChannel!.presenceState()
      const online: PresenceState = {}
      Object.keys(state).forEach(key => {
        online[key] = true
      })
      globalPresence = online
      notifyListeners()
    })
    .on('presence', { event: 'join' }, ({ key }) => {
      globalPresence = { ...globalPresence, [key]: true }
      notifyListeners()
    })
    .on('presence', { event: 'leave' }, ({ key }) => {
      const next = { ...globalPresence }
      delete next[key]
      globalPresence = next
      notifyListeners()
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await presenceChannel!.track({ online_at: new Date().toISOString() })
      }
    })
}

// Hook to subscribe to presence updates
export function usePresence(targetUserId?: string): boolean | null {
  const [isOnline, setIsOnline] = useState<boolean | null>(null)

  useEffect(() => {
    if (!targetUserId) return

    // Set initial state
    setIsOnline(globalPresence[targetUserId] ?? false)

    const handler = (p: PresenceState) => {
      setIsOnline(p[targetUserId] ?? false)
    }
    listeners.add(handler)
    return () => { listeners.delete(handler) }
  }, [targetUserId])

  return isOnline
}

// Component that bootstraps presence for the current user
export function PresenceProvider({ userId }: { userId: string }) {
  useEffect(() => {
    initPresence(userId)
  }, [userId])

  return null
}

// Small status dot component
export function OnlineDot({ userId, className = '' }: { userId: string; className?: string }) {
  const isOnline = usePresence(userId)

  return (
    <span
      className={`block rounded-full transition-colors duration-500 border-2 ${
        isOnline ? 'bg-foreground border-white' : 'bg-background border-border-mint'
      } ${className}`}
    />
  )
}
