'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Brain, Paperclip, Mic, Send, Sparkles, Lightbulb } from 'lucide-react'
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

  return (
    <div className="h-[100dvh] flex flex-col bg-transparent overflow-hidden text-foreground">
      {/* Header */}
      <header className="px-5 pt-6 pb-4 flex flex-col items-center shrink-0 border-b border-border/40 relative bg-background/60 backdrop-blur-xl z-10">
        <Link href="/home" className="absolute left-5 top-6 p-2 -ml-2 rounded-full hover:bg-secondary text-muted-foreground transition-colors">
          <ChevronLeft size={24} strokeWidth={1.5} />
        </Link>
        
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#E8EFE9] to-[#CDE0D4] flex items-center justify-center shadow-inner text-3xl mb-3">
          ✨
        </div>
        
        <h1 className="text-xl font-medium tracking-wide">
          Seren
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Your reflection companion</p>
        
        <div className="mt-3 bg-secondary/80 border border-border/50 px-4 py-1.5 rounded-full flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
          </span>
          <span className="text-xs font-medium text-muted-foreground">{loading ? 'Reflecting...' : 'Listening'}</span>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6 hide-scrollbar relative">
        {messages.length === 0 && (
          <div className="space-y-6">
            <div className="bg-card/40 backdrop-blur-md rounded-3xl p-5 shadow-sm border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb size={18} className="text-primary" />
                <h3 className="font-medium text-sm">Recent Insight</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You've been reflecting a lot on work-life balance lately. Maybe today we can focus on simple gratitude?
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-widest pl-2">Quick Prompts</h3>
              <div className="grid grid-cols-1 gap-2">
                <button onClick={() => handleSend("How are you feeling today?")} className="text-left p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/40 transition-colors text-sm font-medium">
                  How are you feeling today?
                </button>
                <button onClick={() => handleSend("What's been on your mind?")} className="text-left p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/40 transition-colors text-sm font-medium">
                  What's been on your mind?
                </button>
                <button onClick={() => handleSend("Need help breaking down a goal?")} className="text-left p-4 rounded-2xl bg-secondary/50 hover:bg-secondary border border-border/40 transition-colors text-sm font-medium">
                  Need help breaking down a goal?
                </button>
              </div>
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start max-w-[85%]'}`}>
            {msg.role === 'user' ? (
              <div className="bg-primary text-primary-foreground shadow-sm rounded-2xl rounded-tr-sm px-5 py-3.5 text-[15px] font-light leading-relaxed max-w-[85%] whitespace-pre-wrap">
                {msg.content}
              </div>
            ) : (
              <div className="bg-card/80 border border-border/50 shadow-sm rounded-2xl rounded-tl-sm px-5 py-3.5 text-[15px] text-foreground font-light leading-relaxed whitespace-pre-wrap relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/40"></div>
                {msg.content}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-5 pb-6 pt-4 shrink-0 bg-background/80 backdrop-blur-xl border-t border-border/40">
        <form onSubmit={handleSend} className="bg-card/50 border border-border/50 rounded-[2rem] flex items-end p-1.5 shadow-sm focus-within:ring-1 focus-within:ring-primary/30 transition-all">
          <button type="button" className="p-3 text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <Paperclip size={20} strokeWidth={1.5} />
          </button>
          <textarea 
            placeholder="Share your thoughts..." 
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            className="flex-1 bg-transparent px-2 py-3 text-[15px] font-light placeholder:text-muted-foreground focus:outline-none min-h-[44px] max-h-32 resize-none"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as unknown as React.FormEvent);
              }
            }}
          />
          <button type="submit" disabled={!input.trim() || loading} className="w-11 h-11 mb-0.5 mr-0.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50">
            <Send size={18} strokeWidth={1.5} className="ml-1" />
          </button>
        </form>
      </div>
    </div>
  )
}
