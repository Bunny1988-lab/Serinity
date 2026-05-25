'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, MessageSquareOff } from 'lucide-react'
import { deletePost, toggleComments } from '@/app/(main)/actions'

export function PostMenu({ postId, authorId, currentUserId, allowComments }: { postId: string, authorId: string, currentUserId: string, allowComments: boolean }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  if (authorId !== currentUserId) return null

  async function handleDelete() {
    setIsDeleting(true)
    const formData = new FormData()
    formData.append('postId', postId)
    await deletePost(formData)
    setIsOpen(false)
  }

  async function handleToggleComments() {
    const formData = new FormData()
    formData.append('postId', postId)
    formData.append('allowComments', (!allowComments).toString())
    await toggleComments(formData)
    setIsOpen(false)
  }

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-muted-foreground hover:bg-muted/50 rounded-full transition-colors"
      >
        <MoreHorizontal size={18} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-10 w-48 bg-background border border-border/50 rounded-xl shadow-lg overflow-hidden z-20">
          <button 
            onClick={handleToggleComments}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-muted/50 transition-colors text-left"
          >
            <MessageSquareOff size={16} className="text-muted-foreground" />
            <span>{allowComments ? 'Disable Comments' : 'Enable Comments'}</span>
          </button>
          
          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm hover:bg-destructive/10 text-destructive transition-colors text-left border-t border-border/50"
          >
            <Trash2 size={16} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
