'use client'

import { useState } from 'react'
import { Share2 } from 'lucide-react'
import { CrossPlatformInvite } from '@/components/cross-platform-invite'

export function InviteTrigger({ displayName }: { displayName?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-700 font-bold text-[12px] uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
        title="Invite people to Quiet"
      >
        <Share2 size={14} className="text-amber-600" />
        Invite
      </button>

      <CrossPlatformInvite
        isOpen={open}
        onClose={() => setOpen(false)}
        displayName={displayName}
      />
    </>
  )
}
