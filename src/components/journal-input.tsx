'use client'

import { useState } from 'react'
import { PenLine } from 'lucide-react'
import { appendDailyJournal } from '@/app/(main)/actions'

export function JournalInput() {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    setLoading(true)
    try {
      await appendDailyJournal(input)
      setInput('')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSend} className="bg-white/90 backdrop-blur-md border border-white shadow-sm rounded-full flex items-center px-4 py-2">
      <input 
        type="text" 
        value={input}
        onChange={e => setInput(e.target.value)}
        disabled={loading}
        placeholder="Keep writing your thoughts..." 
        className="flex-1 bg-transparent py-1 text-[13px] font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none"
      />
      <button type="submit" disabled={!input.trim() || loading} className="p-2 ml-2 rounded-full hover:bg-teal-50 text-amber-600 transition-colors disabled:opacity-50">
        <PenLine size={18} strokeWidth={2} />
      </button>
    </form>
  )
}
