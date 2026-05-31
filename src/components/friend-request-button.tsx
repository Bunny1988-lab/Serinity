'use client'

import { useState } from 'react'
import { UserCheck, Clock, Check, X, Loader2 } from 'lucide-react'
import {
  sendFriendRequest,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
} from '@/app/(main)/actions'

export type FriendStatus = 'none' | 'pending_sent' | 'pending_received' | 'accepted' | 'declined'

interface Props {
  targetUserId: string
  initialStatus: string | null
  requestId?: string
  compact?: boolean
}

export function FriendRequestButton({ targetUserId, initialStatus, requestId: initReqId, compact }: Props) {
  const [status, setStatus] = useState<FriendStatus>((initialStatus as FriendStatus) || 'none')
  const [requestId, setRequestId] = useState<string | undefined>(initReqId)
  const [loading, setLoading] = useState(false)
  const [showCancel, setShowCancel] = useState(false)

  async function handleSend() {
    setLoading(true)
    const result = await sendFriendRequest(targetUserId)
    if (result?.success) {
      setStatus('pending_sent')
      if (result.requestId) setRequestId(result.requestId)
    } else {
      alert(`Failed to send request: ${result?.error || 'Unknown error'}`)
    }
    setLoading(false)
  }

  async function handleCancel() {
    if (!requestId) return
    setLoading(true)
    await cancelFriendRequest(requestId)
    setStatus('none')
    setRequestId(undefined)
    setShowCancel(false)
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

  // Already friends
  if (status === 'accepted') {
    return (
      <span className="flex items-center justify-center gap-1.5 px-6 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary bg-surface-container-low border-[0.5px] border-outline-variant select-none">
        <UserCheck size={12} strokeWidth={2.5} />
        Connected
      </span>
    )
  }

  // Request sent — show grayed "Connect" + "Cancel" button
  if (status === 'pending_sent') {
    return (
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-on-surface-variant bg-transparent border-[0.5px] border-outline-variant select-none cursor-not-allowed opacity-60">
          Pending
        </span>
        <button
          onClick={handleCancel}
          disabled={loading}
          className="flex items-center justify-center gap-1 px-4 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-error bg-transparent border-[0.5px] border-error hover:bg-error hover:text-white disabled:opacity-50 transition-all cursor-pointer"
          title="Cancel request"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <X size={12} strokeWidth={2.5} />}
          Cancel
        </button>
      </div>
    )
  }

  // Received a request — accept or decline
  if (status === 'pending_received') {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          disabled={loading}
          className="flex items-center gap-1.5 px-6 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-white bg-primary hover:opacity-90 disabled:opacity-50 transition-all cursor-pointer"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={2.5} />}
          Accept
        </button>
        <button
          onClick={handleDecline}
          disabled={loading}
          className="flex items-center justify-center px-4 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-on-surface-variant bg-transparent border-[0.5px] border-outline-variant hover:text-primary transition-all cursor-pointer disabled:opacity-50"
        >
          <X size={12} strokeWidth={2.5} />
        </button>
      </div>
    )
  }

  // Default: status === 'none' or 'declined'
  return (
    <button
      onClick={handleSend}
      disabled={loading}
      className="flex items-center justify-center px-6 py-2.5 text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary bg-transparent border-[0.5px] border-primary hover:bg-primary hover:text-white disabled:opacity-50 transition-all cursor-pointer"
    >
      {loading ? <Loader2 size={12} className="animate-spin" /> : 'Connect'}
    </button>
  )
}
