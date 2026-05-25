'use client'

import { motion, AnimatePresence } from 'framer-motion'

const EMOTIONAL_REACTIONS = [
  { id: 'blue_heart', emoji: '💙', label: 'Support' },
  { id: 'leaf', emoji: '🌿', label: 'Calm' },
  { id: 'sun', emoji: '☀️', label: 'Warmth' },
  { id: 'white_heart', emoji: '🤍', label: 'Care' },
  { id: 'sparkles', emoji: '✨', label: 'Appreciate' }
]

export function PostInteractions({ postId, initialReactions = [], initialComments = [], allowComments = true }: { postId: string, initialReactions?: any[], initialComments?: any[], allowComments?: boolean }) {
  const [showComments, setShowComments] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [isReacting, setIsReacting] = useState(false)
  const [showMoods, setShowMoods] = useState(false)

  // Optimistic UI state
  const [hasReacted, setHasReacted] = useState(initialReactions.length > 0)
  const [comments, setComments] = useState(initialComments)

  async function handleReact(type: string) {
    if (isReacting || hasReacted) return
    setIsReacting(true)
    setHasReacted(true)
    setShowMoods(false)
    
    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('type', type)
    
    await addReaction(formData)
    setIsReacting(false)
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentContent.trim()) return

    const newComment = { id: Date.now().toString(), content: commentContent, author: { display_name: 'You' } }
    setComments([...comments, newComment])
    setContent('')

    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('content', commentContent)
    
    await addComment(formData)
  }

  function setContent(v: string) {
    setCommentContent(v)
  }

  return (
    <div className="pt-2">
      <div className="flex items-center gap-6 text-muted-foreground relative">
        <div 
          className="relative"
          onMouseEnter={() => !hasReacted && setShowMoods(true)}
          onMouseLeave={() => setShowMoods(false)}
        >
          <motion.button 
            whileHover={{ scale: hasReacted ? 1 : 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => !hasReacted && setShowMoods(!showMoods)}
            disabled={hasReacted}
            className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors ${hasReacted ? 'text-foreground bg-primary/5 cursor-default' : 'hover:bg-primary/5 hover:text-foreground'}`}
          >
            {hasReacted ? <span className="text-lg">🌿</span> : <Heart size={18} strokeWidth={1.5} />}
            <span className="sr-only">React</span>
          </motion.button>
          
          <AnimatePresence>
            {showMoods && !hasReacted && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 5, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-10 left-0 flex gap-1 p-2 bg-background/90 backdrop-blur-xl border border-border/40 rounded-full shadow-lg z-20"
              >
                {EMOTIONAL_REACTIONS.map((reaction) => (
                  <motion.button 
                    key={reaction.id}
                    whileHover={{ scale: 1.2, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleReact(reaction.id)} 
                    className="w-8 h-8 flex items-center justify-center text-xl"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        {allowComments && (
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowComments(!showComments)}
            className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/5 transition-colors"
          >
            <MessageCircle size={18} strokeWidth={1.5} />
            <span className="sr-only">Comment</span>
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {allowComments && showComments && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 space-y-4 pt-4 border-t border-border/30">
              <form onSubmit={handleComment} className="flex gap-3">
                <input 
                  type="text" 
                  value={commentContent}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share a calm reflection..." 
                  className="flex-1 bg-background border border-border/50 shadow-sm rounded-full px-5 py-2 text-sm font-light outline-none focus:border-primary/50 transition-colors"
                />
                <button type="submit" disabled={!commentContent.trim()} className="text-primary disabled:opacity-30 p-2 hover:bg-primary/5 rounded-full transition-colors">
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </form>

              <div className="space-y-4 px-1">
                {comments.map((c: any) => (
                  <div key={c.id} className="text-sm">
                    <span className="font-medium mr-2">{c.author?.display_name || 'Anonymous'}</span>
                    <span className="text-foreground/80 font-light">{c.content}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
