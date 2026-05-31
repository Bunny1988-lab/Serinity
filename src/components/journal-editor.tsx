'use client'

import { useState } from 'react'
import { appendDailyJournal } from '@/app/(main)/actions'
import { Loader2, Send } from 'lucide-react'

interface JournalEditorProps {
  userId: string
  existingEntryId?: string
}

export function JournalEditor({ userId, existingEntryId }: JournalEditorProps) {
  const [content, setContent] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!content.trim() || isSaving) return
    setIsSaving(true)
    await appendDailyJournal(content)
    setContent('')
    setIsSaving(false)
  }

  async function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      await handleSave()
    }
  }

  return (
    <div className="fixed bottom-[84px] left-0 w-full px-6 z-40 max-w-[800px] mx-auto left-1/2 -translate-x-1/2">
      <div className="w-full bg-card border border-border-mint rounded-[24px] px-6 py-4 flex items-center gap-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] focus-within:ring-1 focus-within:ring-[#BCE3D8] transition-all">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Jot down a quick thought..."
          rows={1}
          className="flex-1 bg-transparent border-none outline-none resize-none text-[15px] font-medium text-foreground placeholder:text-foreground/40 leading-relaxed"
          style={{ minHeight: '24px', maxHeight: '120px', overflow: 'hidden' }}
          onInput={(e) => {
            const t = e.currentTarget
            t.style.height = 'auto'
            t.style.height = Math.min(t.scrollHeight, 120) + 'px'
          }}
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={!content.trim() || isSaving}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground text-white hover:bg-foreground/90 transition-all disabled:opacity-50 shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.04)]"
          title="Save entry (Enter)"
        >
          {isSaving
            ? <Loader2 size={16} strokeWidth={2.5} className="animate-spin" />
            : <Send size={16} strokeWidth={2.5} />
          }
        </button>
      </div>
    </div>
  )
}
