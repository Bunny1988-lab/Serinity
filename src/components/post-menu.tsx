'use client'

import { useState } from 'react'
import { MoreHorizontal, Trash2, MessageSquareOff, MessageSquare } from 'lucide-react'
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
        className={`w-10 h-10 flex items-center justify-center rounded-full transition-all border ${isOpen ? 'bg-background text-foreground border-border-mint' : 'text-foreground/40 hover:bg-background hover:text-foreground border-transparent hover:border-border-mint'}`}
      >
        <MoreHorizontal size={20} strokeWidth={2} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-56 bg-card border border-border-mint rounded-[20px] shadow-[0_8px_24px_rgba(0,0,0,0.06)] overflow-hidden z-20 py-1">
          <button 
            onClick={handleToggleComments}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px] font-bold text-foreground hover:bg-background transition-colors text-left"
          >
            {allowComments ? (
              <><MessageSquareOff size={16} strokeWidth={2.5} className="text-foreground/60" /> Disable Comments</>
            ) : (
              <><MessageSquare size={16} strokeWidth={2.5} className="text-foreground/60" /> Enable Comments</>
            )}
          </button>
          
          <div className="h-[1px] bg-[#BCE3D8]/50 mx-2" />

          <button 
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-[14px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
          >
            <Trash2 size={16} strokeWidth={2.5} />
            <span>{isDeleting ? 'Deleting...' : 'Delete Post'}</span>
          </button>
        </div>
      )}
    </div>
  )
}
