'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { addReaction, addComment, sharePostToChat } from '@/app/(main)/actions'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { getMoodInkwellStyle } from '@/lib/utils'

export function PostInteractions({ 
  postId, 
  initialReactions = [], 
  initialComments = [], 
  allowComments = true,
  mood
}: { 
  postId: string, 
  initialReactions?: any[], 
  initialComments?: any[], 
  allowComments?: boolean,
  mood?: string
}) {
  const [showComments, setShowComments] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [isReacting, setIsReacting] = useState(false)
  const [isCommenting, setIsCommenting] = useState(false)

  // Optimistic UI state
  const [hasReacted, setHasReacted] = useState(initialReactions.length > 0)
  const [reactionCount, setReactionCount] = useState(initialReactions.length)
  const [comments, setComments] = useState(initialComments)

  // Sharing popover states
  const [showShareMenu, setShowShareMenu] = useState(false)
  const [friends, setFriends] = useState<any[]>([])
  const [loadingFriends, setLoadingFriends] = useState(false)
  const [supabase] = useState(() => createClient())

  async function handleReact() {
    if (isReacting || hasReacted) return
    setIsReacting(true)
    setHasReacted(true)
    setReactionCount(prev => prev + 1)
    
    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('type', 'heart')
    
    await addReaction(formData)
    setIsReacting(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentContent.trim() || isCommenting) return

    setIsCommenting(true)
    const newComment = { id: Date.now().toString(), content: commentContent, author: { display_name: 'You' } }
    setComments([...comments, newComment])
    setCommentContent('')

    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('content', commentContent)
    
    await addComment(formData)
    setIsCommenting(false)
  }

  async function handleShareClick() {
    setShowShareMenu(!showShareMenu)
    if (friends.length > 0 || loadingFriends) return
    
    setLoadingFriends(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoadingFriends(false); return }

    // Fetch accepted friend requests
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

    // Fetch friend profiles
    const { data: profiles } = await supabase
      .from('users')
      .select('id, display_name, username, avatar_url')
      .in('id', friendIds)

    if (profiles) setFriends(profiles)
    setLoadingFriends(false)
  }

  async function handleShareToFriend(friendId: string, friendName: string) {
    const res = await sharePostToChat(postId, friendId)
    if (res.success) {
      toast.success(`Signal shared with ${friendName}`, { icon: '📦' })
    } else {
      toast.error('Failed to share signal')
    }
  }

  const [isSavingJournal, setIsSavingJournal] = useState(false)

  async function handleSaveToJournal() {
    if (isSavingJournal) return
    setIsSavingJournal(true)
    try {
      const { savePostToJournal } = await import('@/app/(main)/actions')
      await savePostToJournal(postId, 'Saved from feed.')
      toast.success('Saved to your Private Journal', { icon: '📝' })
    } catch (error) {
      toast.error('Failed to save to journal')
    }
    setIsSavingJournal(false)
  }

  return (
    <div className="pt-6 border-t-[0.5px] border-outline-variant/30">
      <div className="flex items-center space-x-8">
        <button 
          onClick={handleReact}
          disabled={hasReacted || isReacting}
          className={`flex items-center space-x-2 transition-colors ${hasReacted ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: hasReacted ? "'FILL' 1" : "'FILL' 0" }}>favorite</span>
          <span className="font-label-caps text-xs font-bold tracking-widest uppercase">{reactionCount > 0 ? reactionCount : 'Like'}</span>
        </button>
        
        {allowComments && (
          <button 
            onClick={() => setShowComments(!showComments)}
            className={`flex items-center space-x-2 transition-colors ${showComments ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: showComments ? "'FILL' 1" : "'FILL' 0" }}>chat_bubble_outline</span>
            <span className="font-label-caps text-xs font-bold tracking-widest uppercase">{comments.length > 0 ? comments.length : 'Comment'}</span>
          </button>
        )}
        
        <div className="relative ml-auto flex items-center space-x-6">
          {/* Save to Journal Button */}
          <button 
            onClick={handleSaveToJournal}
            disabled={isSavingJournal}
            className="flex items-center space-x-2 transition-colors text-on-surface-variant hover:text-primary disabled:opacity-50"
            title="Save to Private Journal"
          >
            <span className="material-symbols-outlined">bookmark</span>
          </button>

          {/* Share Button */}
          <button 
            onClick={handleShareClick}
            className={`flex items-center space-x-2 transition-colors ${showShareMenu ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
          >
            <span className="material-symbols-outlined">ios_share</span>
          </button>
          
          <AnimatePresence>
            {showShareMenu && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="absolute right-0 bottom-full mb-3 bg-surface border-[0.5px] border-outline-variant shadow-xl rounded-2xl p-3 z-50 min-w-[220px]"
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-[9px] uppercase tracking-wider font-bold text-outline mb-2 px-1">Share Signal with...</p>
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
      </div>

      <AnimatePresence>
        {allowComments && showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-6 space-y-6">
              <div className="space-y-4">
                {comments.map((c: any) => (
                  <div key={c.id} className="text-body-md text-on-surface-variant leading-relaxed">
                    <span className="font-ui-element text-sm font-medium tracking-wide text-primary mr-2">{c.author?.display_name || c.users?.display_name || 'Anonymous'}</span>
                    <span className={getMoodInkwellStyle(mood) || "opacity-80"}>{c.content}</span>
                  </div>
                ))}
              </div>

              <form onSubmit={handleComment} className="flex gap-4 items-center">
                <input 
                  type="text" 
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  disabled={isCommenting}
                  placeholder="Share a reflection..." 
                  className="flex-1 bg-transparent border-b-[0.5px] border-outline-variant py-2 text-body-md text-primary placeholder:text-on-surface-variant/40 outline-none focus:border-primary transition-colors"
                />
                <button 
                  type="submit" 
                  disabled={!commentContent.trim() || isCommenting} 
                  className="font-label-caps text-[10px] font-bold text-primary hover:text-primary/70 tracking-widest uppercase disabled:opacity-30 transition-colors"
                >
                  {isCommenting ? 'Sending' : 'Post'}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
