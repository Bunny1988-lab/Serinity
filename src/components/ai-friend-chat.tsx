'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, Mic, Send } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

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
    "I'm feeling a bit overwhelmed.",
    "Can you help me plan my day?",
    "I just want to reflect."
  ]

  return (
    <div className="flex flex-col h-full min-h-0 relative w-full overflow-hidden">
      
      {/* ── HEADER (Mobile Only) ───────────────────────────────────────── */}
      <header className="md:hidden w-full flex items-center h-16 px-6 bg-surface/40 backdrop-blur-md sticky top-0 z-50 border-b-[0.5px] border-outline-variant">
        <Link href="/home" className="p-2 -ml-2 text-on-surface-variant hover:text-primary transition-colors">
          <ChevronLeft size={28} strokeWidth={2} />
        </Link>
        <span className="text-[18px] text-primary font-bold ml-2">Zen Assistant</span>
      </header>

      {/* ── MESSAGES ──────────────────────────────────────────── */}
      <section className="flex-1 max-w-4xl mx-auto w-full px-6 md:px-16 flex flex-col py-12 relative z-10">
        
        {messages.length === 0 && (
          <div className="flex flex-col items-center mb-16 text-center mt-8">
            <h2 className="font-display text-display italic text-primary leading-tight">Zen Assistant</h2>
            <p className="text-on-surface-variant font-label-md mt-2 tracking-[0.3em] uppercase opacity-60">The sound of focus</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto hide-scrollbar space-y-10 pb-48" style={{ overscrollBehavior: 'contain' }}>
          
          {messages.length === 0 && (
            <div className="flex flex-col gap-4 mt-8">
              <div className="flex justify-start max-w-2xl mx-auto w-full">
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container text-on-surface p-8 rounded-2xl rounded-tl-none border-[0.5px] border-outline-variant/30 shadow-sm w-full">
                  <p className="font-display text-2xl italic mb-4 text-primary leading-relaxed">"True silence is the rest of the mind, and is to the spirit what sleep is to the body, nourishment and refreshment."</p>
                  <p className="font-body-md leading-relaxed text-[16px]">Good day. I'm here to support your mindful space. What is on your mind?</p>
                </motion.div>
              </div>
              
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {SUGGESTIONS.map((s, i) => (
                  <motion.button 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + (i * 0.1) }}
                    key={s} 
                    onClick={() => handleSend(s)}
                    className="px-6 py-2 bg-surface border-[0.5px] border-outline-variant text-label-sm text-primary uppercase tracking-widest rounded-full hover:bg-primary hover:text-on-primary transition-all shadow-sm"
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => {
            const isMe = msg.role === 'user';
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
                className={`flex ${isMe ? 'justify-end ml-auto' : 'justify-start'} max-w-2xl mx-auto w-full`}
              >
                {isMe ? (
                  <div className="bg-primary text-on-primary p-6 md:p-8 rounded-2xl rounded-tr-none shadow-xl">
                    <p className="font-body-md leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                ) : (
                  <div className="bg-surface-container text-on-surface p-6 md:p-8 rounded-2xl rounded-tl-none border-[0.5px] border-outline-variant/30 shadow-sm w-full">
                    <p className="font-body-md leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <div className="mt-6 flex gap-4 text-label-sm text-on-surface-variant opacity-60">
                      <span className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>content_copy</span> Copy
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
          
          {loading && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start max-w-2xl mx-auto w-full">
                <div className="bg-surface-container text-on-surface p-6 rounded-2xl rounded-tl-none border-[0.5px] border-outline-variant/30 shadow-sm">
                  <div className="flex gap-2 items-center justify-center py-2 h-6">
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0 }} className="w-2 h-2 bg-on-surface-variant/50 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }} className="w-2 h-2 bg-on-surface-variant/50 rounded-full" />
                    <motion.div animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }} className="w-2 h-2 bg-on-surface-variant/50 rounded-full" />
                  </div>
                </div>
             </motion.div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </section>

      {/* ── FLOATING INPUT BAR ───────────────────────────────────── */}
      <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-background/40 backdrop-blur-md pt-4 pb-8 md:pb-12 px-6 z-40">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-4 bg-surface/80 p-3 rounded-2xl transition-all border-[0.5px] border-outline-variant/50 shadow-sm focus-within:border-primary/40 focus-within:shadow-md">
          
          <button type="button" className="p-3 text-on-surface-variant hover:text-primary transition-colors shrink-0 mb-1" disabled={loading}>
            <span className="material-symbols-outlined">attach_file</span>
          </button>

          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e as any);
              }
            }}
            placeholder="Deep dive into a thought..."
            className="flex-1 bg-transparent border-none focus:ring-0 text-body-md resize-none py-3 placeholder:text-on-surface-variant/40 outline-none max-h-32 hide-scrollbar disabled:opacity-50"
            rows={1}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "";
              target.style.height = target.scrollHeight + "px";
            }}
          />

          <div className="flex items-center gap-3 shrink-0 mb-1">
            <button type="button" className="p-3 text-on-surface-variant hover:text-primary transition-colors shrink-0" disabled={loading}>
              <span className="material-symbols-outlined">mic</span>
            </button>
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-12 h-12 bg-primary text-on-primary rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </div>
        </form>
        <div className="max-w-4xl mx-auto mt-4 flex justify-center hidden md:flex">
          <p className="text-[10px] font-label-caps text-on-surface-variant/40 uppercase tracking-[0.2em]">Zen AI is tuned for high-signal mindful workflows.</p>
        </div>
      </div>
    </div>
  )
}
