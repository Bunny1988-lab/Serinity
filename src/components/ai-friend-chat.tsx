'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Brain, Paperclip, Mic, Send } from 'lucide-react'
import Link from 'next/link'

export function AIFriendChat({ initialMessages }: { initialMessages: { role: string, content: string }[] }) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/seren/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      })

      if (!res.ok) throw new Error('Failed to send message')

      if (!res.body) return

      // Handle streaming response
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let assistantMsg = { role: 'assistant', content: '' }
      
      setMessages(prev => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        assistantMsg.content += text
        setMessages(prev => {
          const newMessages = [...prev]
          newMessages[newMessages.length - 1] = { ...assistantMsg }
          return newMessages
        })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-[#E0F2F1] overflow-hidden">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex flex-col items-center shrink-0 border-b border-teal-900/5 relative bg-[#E0F2F1]/80 backdrop-blur-md z-10">
        <Link href="/feed" className="absolute left-5 top-6 p-2 -ml-2 rounded-full hover:bg-teal-900/5 text-slate-700 transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        
        <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center shadow-lg border-2 border-amber-200/50 mb-2 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-600 via-teal-500 to-amber-300 opacity-80" />
          <Brain className="text-white relative z-10" size={28} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-lg font-bold text-slate-800 flex items-center gap-1">
          AI Friend <span className="text-amber-400">✨</span>
        </h1>
        
        <div className="mt-1.5 bg-white/70 backdrop-blur-sm border border-amber-200 shadow-sm px-3 py-1 rounded-full flex items-center gap-1.5">
          <Brain size={12} className="text-amber-500" />
          <span className="text-[11px] font-semibold text-slate-700">{loading ? 'Typing...' : 'Learning & Available'}</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-4 hide-scrollbar">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-[85%]'}`}>
            {msg.role === 'user' ? (
              <div className="bg-teal-800/10 border border-teal-900/10 shadow-sm rounded-2xl rounded-tr-sm px-4 py-3 text-[13.5px] text-slate-800 leading-relaxed max-w-[85%] whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="bg-white/80 border border-amber-200/50 shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-[13.5px] text-slate-700 leading-relaxed relative overflow-hidden whitespace-pre-wrap">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400"></div>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center text-slate-500 text-sm mt-10">
            Send a message to start chatting with your AI friend.
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-5 pb-6 pt-2 shrink-0 bg-[#E0F2F1]">
        <form onSubmit={handleSend} className="bg-white/70 backdrop-blur-md border border-white rounded-full flex items-center p-1 shadow-sm">
          <input 
            type="text" 
            placeholder="Message AI Friend..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent px-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
          />
          <button type="button" className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Paperclip size={18} strokeWidth={2} />
          </button>
          <button type="button" className="p-2.5 text-slate-400 hover:text-slate-600 transition-colors">
            <Mic size={18} strokeWidth={2} />
          </button>
          <button type="submit" disabled={!input.trim() || loading} className="w-10 h-10 ml-1 rounded-full bg-teal-800 text-white flex items-center justify-center shrink-0 hover:bg-teal-700 transition-colors shadow-sm disabled:opacity-50">
            <Send size={16} strokeWidth={2} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  )
}
