'use client'

import { useState, useEffect } from 'react'
import { updateDailyJournal } from '@/app/(main)/actions'
import { toast } from 'sonner'

interface Props {
  initialContent: string
  today: string
  title: string
}

export function DailyJournalCard({ initialContent, today, title }: Props) {
  const [content, setContent] = useState(initialContent)

  // Sync if external updates happen (like appending from the bottom bar)
  useEffect(() => {
    setContent(initialContent)
  }, [initialContent])

  async function handleBlur() {
    if (content !== initialContent) {
      await updateDailyJournal(content)
      toast.success('Journal auto-saved', {
        description: 'Your changes have been securely stored in your vault.',
        icon: '🌿'
      })
    }
  }

  return (
    <div className="bg-card border border-border-mint rounded-[32px] p-8 shadow-[0_4px_12px_rgba(0,0,0,0.02)] relative min-h-[500px] flex flex-col focus-within:ring-2 focus-within:ring-border-mint hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(29,59,53,0.08)] transition-all duration-300">
      <div className="text-[14px] leading-relaxed whitespace-pre-wrap shrink-0 mb-6 flex items-center justify-between">
        <span className="font-bold text-foreground/50 uppercase tracking-widest">{today}</span>
        <span className="font-bold text-foreground bg-background px-4 py-1.5 rounded-full border border-border-mint">{title}</span>
      </div>
      
      <textarea
        className="flex-1 w-full bg-transparent border-none outline-none resize-none text-[16px] font-medium text-foreground leading-[1.8] placeholder:text-foreground/30 hide-scrollbar"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={handleBlur}
        placeholder="A blank slate for your thoughts today. Start writing here..."
      />

      {/* Book emoji decoration */}
      <div className="absolute -bottom-4 -left-3 text-[42px] pointer-events-none drop-shadow-md origin-bottom-left rotate-[-10deg]">📖</div>
    </div>
  )
}
