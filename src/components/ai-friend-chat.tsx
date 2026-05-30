'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Mic, Send } from 'lucide-react'
import Link from 'next/link'

export function AIFriendChat({ initialMessages }: { initialMessages: { role: string, content: string }[] }) {
  const [messages, setMessages] = useState<{ role: string, content: string }[]>(initialMessages)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = async (e?: React.FormEvent | string) => {
    if (typeof e !== 'string') e?.preventDefault()
    
    const messageContent = typeof e === 'string' ? e : input
    if (!messageContent.trim() || loading) return

    const userMsg = { role: 'user', content: messageContent }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/seren/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageContent })
      })

      if (!res.ok) throw new Error('Failed to send message')
      if (!res.body) return

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

  const SUGGESTIONS = [
    "The tight deadlines",
    "The lack of clarity",
    "My own expectations"
  ]

  return (
    <div className="min-h-[100dvh] flex flex-col bg-transparent text-foreground pb-20 md:pb-0">
      {/* Header */}
      <header className="px-4 pt-12 pb-4 flex items-center justify-between shrink-0 bg-transparent z-10">
        <Link href="/home" className="p-2 -ml-2 rounded-full hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} strokeWidth={2} className="text-foreground" />
        </Link>
        <h1 className="text-[17px] font-bold text-foreground tracking-tight">
          AI Companion
        </h1>
        <div className="p-2 -mr-2">
          <span className="text-xl">✨</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 hide-scrollbar relative">
        {messages.length === 0 && (
          <div className="space-y-4">
             <div className="bg-card shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-border/50 rounded-[32px] p-6 text-[15px] text-foreground font-medium leading-relaxed whitespace-pre-wrap relative max-w-[95%]">
               <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-3 text-lg border border-border/50">✨</div>
               It sounds like you're carrying a lot right now. Let's start with what feels most urgent. Which part of the project is taking up the most mental space?
             </div>
             
             {/* Suggestion Chips */}
             <div className="flex flex-col gap-2.5 items-end px-2">
               {SUGGESTIONS.map(s => (
                 <button 
                   key={s} 
                   onClick={() => handleSend(s)}
                   className="bg-card/40 border border-border/50 rounded-full px-5 py-3 text-[14px] font-bold text-foreground shadow-sm hover:bg-card/80 transition-all text-right max-w-full"
                 >
                   {s}
                 </button>
               ))}
             </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-card border border-border/50 shadow-[0_4px_12px_rgba(0,0,0,0.02)] rounded-[24px] rounded-br-sm px-5 py-3.5 text-[15px] font-medium leading-relaxed max-w-[85%] whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="bg-card border border-border/50 shadow-[0_4px_20px_rgba(0,0,0,0.02)] rounded-[32px] p-6 text-[15px] text-foreground font-medium leading-relaxed whitespace-pre-wrap relative max-w-[95%]">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center mb-3 text-lg border border-border/50">✨</div>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-4 pb-6 pt-2 shrink-0 bg-transparent relative z-20">
        <form onSubmit={handleSend} className="bg-card border border-border/50 rounded-full flex items-center pr-1.5 pl-4 py-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.03)] h-[52px]">
          <input 
            type="text"
            placeholder="Message Companion..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent px-2 text-[15px] font-medium placeholder:text-foreground/50 focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
          />
          {input.trim() ? (
            <button type="submit" disabled={loading} className="w-[38px] h-[38px] rounded-full bg-[#f4e8cc] text-[#c1684c] flex items-center justify-center shrink-0 shadow-sm border border-[#e8d5a7]">
              <Send size={18} strokeWidth={2.5} className="ml-0.5" />
            </button>
          ) : (
            <button type="button" className="p-2 text-foreground/40 hover:text-foreground transition-colors shrink-0 pr-3">
              <Mic size={22} strokeWidth={2} />
            </button>
          )}
        </form>
      </div>
    </div>
  )
}
