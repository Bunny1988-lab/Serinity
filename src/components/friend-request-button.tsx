'use client'

import { useState } from 'react'
import { UserPlus, Clock, UserCheck, X, Check, Loader2 } from 'lucide-react'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
} from '@/app/(main)/actions'

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined'

interface Props {
  targetUserId: string
  initialStatus: FriendStatus
  requestId?: string
}

export function FriendRequestButton({ targetUserId, initialStatus, requestId: initReqId }: Props) {
  const [status, setStatus] = useState<FriendStatus>(initialStatus)
  const [requestId, setRequestId] = useState<string | undefined>(initReqId)
  const [loading, setLoading] = useState(false)

  async function handleSend() {
    setLoading(true)
    const result = await sendFriendRequest(targetUserId)
    if (result?.success) {
      setStatus('pending_sent')
      if (result.requestId) setRequestId(result.requestId)
    }
    setLoading(false)
  }

  async function handleAccept() {
    if (!requestId) return
    setLoading(true)
    await acceptFriendRequest(requestId)
    setStatus('accepted')
    setLoading(false)
  }

  async function handleDecline() {
    if (!requestId) return
    setLoading(true)
    await declineFriendRequest(requestId)
    setStatus('declined')
    setLoading(false)
  }

  if (status === 'accepted') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 select-none">
        <UserCheck size={12} strokeWidth={2} />
        Friends
      </span>
    )
  }

  if (status === 'pending_sent') {
    return (
      <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground bg-muted/40 border border-border/40 select-none">
        <Clock size={12} strokeWidth={1.5} />
        Pending
      </span>
    )
  }

  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} strokeWidth={2.5} />}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[11px] font-medium text-muted-foreground hover:bg-muted/40 border border-border/40 disabled:opacity-50 transition-all cursor-pointer"
        >
          <X size={11} strokeWidth={2} />
        </button>
      </div>
    )
  }

  if (status === 'declined') {
    return (
      <button
        onClick={handleSend}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 disabled:opacity-50 transition-all cursor-pointer"
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={12} strokeWidth={1.75} />}
        Add Friend
      </button>
    )
  }

  // status === 'none'
  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 disabled:opacity-50 transition-all cursor-pointer"
    >
      {loading ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={12} strokeWidth={1.75} />}
      {loading ? 'Sending…' : 'Add Friend'}
    </button>
  )
}
