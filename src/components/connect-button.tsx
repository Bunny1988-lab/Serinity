'use client'

import { useState } from 'react'

export function ConnectButton({ targetUserId, initialStatus = 'Connect' }: { targetUserId: string, initialStatus?: string }) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    if (status !== 'Connect') return
    setLoading(true)
    try {
      // In a real app, we'd call a server action here to insert into 'friend_requests'
      // For now we'll simulate the success state
      await new Promise(r => setTimeout(r, 600))
      setStatus('Pending')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'Pending') {
    return (
      <button disabled className="w-full py-1.5 bg-teal-100/50 text-teal-800 text-[11px] font-semibold rounded-full shadow-sm transition-colors opacity-70">
        Pending
      </button>
    )
  }

  return (
    <button 
      onClick={handleConnect}
      disabled={loading}
      className="w-full py-1.5 bg-teal-800 text-white text-[11px] font-semibold rounded-full shadow-sm hover:bg-teal-700 transition-colors disabled:opacity-50"
    >
      {loading ? '...' : 'Connect'}
    </button>
  )
}
