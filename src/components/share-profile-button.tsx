'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { shareProfileToChat } from '@/app/(main)/actions'
import { Loader2, Share2 } from 'lucide-react'
import { toast } from 'sonner'

export function ShareProfileButton({ targetProfileId }: { targetProfileId: string }) {
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [supabase] = useState(() => createClient())

  async function handleShareClick() {
    setShowShareMenu(!showShareMenu)
    if (friends.length > 0 || loadingFriends) return
    
    setLoadingFriends(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingFriends(false); return }

    // Fetch accepted connections
    const { data: requests } = await supabase
      .from('friend_requests')
      .select('sender_id, receiver_id')
      .eq('status', 'accepted')
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)

    if (!requests || requests.length === 0) {
      setLoadingFriends(false)
      return
    }

    const friendIds = requests.map(r => r.sender_id === user.id ? r.receiver_id : r.sender_id)

    // Fetch details
    const { data: profiles } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url')
      .in('id', friendIds)

    if (profiles) setFriends(profiles)
    setLoadingFriends(false)
  }

  async function handleShareToFriend(friendId: string, friendName: string) {
    const res = await shareProfileToChat(targetProfileId, friendId)
    if (res.success) {
      toast.success(`Profile shared with ${friendName}`, { icon: '👤' })
    } else {
      toast.error('Failed to share profile')
    }
  }

  return (
    <div className="relative">
      <button 
        type="button"
        onClick={handleShareClick}
        className={`py-2.5 px-6 bg-surface-container border-[0.5px] border-outline-variant hover:bg-surface-container-high text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary flex items-center justify-center gap-2 transition-all active:scale-98 ${showShareMenu ? 'bg-surface-container-high' : ''}`}
      >
        <Share2 size={12} />
        Share Profile
      </button>
      
      <AnimatePresence>
        {showShareMenu && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute left-0 top-full mt-2 bg-surface border-[0.5px] border-outline-variant shadow-xl rounded-2xl p-3 z-[60] min-w-[220px]"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[9px] uppercase tracking-wider font-bold text-outline mb-2 px-1">Share Profile with...</p>
            {loadingFriends ? (
              <div className="flex justify-center py-4">
                <Loader2 size={16} className="animate-spin text-primary/40" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-xs text-outline italic py-2 px-1">No connections connected.</p>
            ) : (
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
                {friends.map(friend => (
                  <button
                    key={friend.id}
                    type="button"
                    onClick={() => { handleShareToFriend(friend.id, friend.display_name); setShowShareMenu(false); }}
                    className="w-full text-left p-2 hover:bg-surface-container-low rounded-lg transition-colors flex items-center gap-2.5"
                  >
                    <div className="w-6.5 h-6.5 rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/30">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold text-primary">{friend.display_name?.[0]?.toUpperCase()}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-primary truncate leading-none mb-0.5">{friend.display_name}</p>
                      <p className="text-[8px] text-outline uppercase tracking-wider truncate">@{friend.username}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
