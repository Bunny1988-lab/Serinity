'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { X, Send, Sparkles, Trash2 } from 'lucide-react'
import { ConfirmDialog } from '@/components/ui/dialog'

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
}

export function Companion({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [showForgetDialog, setShowForgetDialog] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const shouldReduceMotion = useReducedMotion()
  const supabase = createClient()

  // Load history on open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      loadHistory()
    }
  }, [isOpen])

  // Scroll to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function loadHistory() {
    const { data } = await supabase
      .from('companion_messages')
      .select('id, role, content')
      .eq('user_id', userId)
      .neq('role', 'system')
      .order('created_at', { ascending: true })
    
    if (data && data.length > 0) {
      setMessages(data as Message[])
    } else {
      // Empty state
      setMessages([
        { id: 'initial', role: 'assistant', content: "Hello. I'm Seren. How are you feeling today?" }
      ])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || isStreaming) return

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsStreaming(true)

    try {
      const res = await fetch('/api/seren/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content })
      })

      if (!res.ok) {
        const errText = await res.text()
        setMessages(prev => [...prev, { 
          id: 'err-' + Date.now(), 
          role: 'assistant', 
          content: `⚠️ ${errText || 'Something went wrong. Please try again.'}` 
        }])
        return
      }
      if (!res.body) throw new Error('Failed to fetch')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      
      let assistantContent = ''
      const assistantId = 'ast-' + Date.now()

      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value, { stream: true })
        assistantContent += chunk
        
        setMessages(prev => prev.map(m => 
          m.id === assistantId ? { ...m, content: assistantContent } : m
        ))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleForgetHistory() {
    setShowForgetDialog(true)
  }

  async function executeForgetHistory() {
    setShowForgetDialog(false)
    await supabase.from('companion_messages').delete().eq('user_id', userId)
    setMessages([{ id: 'initial', role: 'assistant', content: "My memory has been cleared. What's on your mind?" }])
  }

  if (isDismissed) return null

  return (
    <div className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-50 flex flex-col items-end gap-4">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="bg-background/80 backdrop-blur-2xl border border-border/50 rounded-3xl shadow-2xl w-[340px] h-[480px] sm:w-[380px] sm:h-[550px] flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/30 bg-primary/5">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-primary" />
                <span className="font-light tracking-wide text-sm">Seren</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleForgetHistory}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-full hover:bg-muted/50"
                  title="Forget History"
                >
                  <Trash2 size={14} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-full hover:bg-muted/50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-border">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id + i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-4 py-3 max-w-[85%] rounded-2xl text-[14px] leading-relaxed font-light ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-br-none' 
                      : 'bg-muted/50 text-foreground rounded-bl-none border border-border/50'
                  }`}>
                    {msg.content}
                    {msg.content === '' && isStreaming && <span className="animate-pulse">...</span>}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-background">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Reflect with Seren..."
                  className="w-full h-12 bg-muted/30 border border-border/50 rounded-full pl-5 pr-12 focus:outline-none focus:border-primary/50 text-sm font-light text-foreground"
                  disabled={isStreaming}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 transition-opacity"
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        animate={{ 
          scale: shouldReduceMotion ? 1 : [1, 1.05, 1], 
          y: shouldReduceMotion ? 0 : [0, -5, 0],
          transition: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
        className="w-14 h-14 rounded-full backdrop-blur-md border border-primary/20 bg-primary/10 flex items-center justify-center cursor-pointer shadow-[0_0_30px_10px_rgba(var(--primary),0.05)] relative overflow-hidden"
        title="Open Seren"
      >
        <motion.div 
          animate={{ opacity: shouldReduceMotion ? 0.5 : [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="w-6 h-6 rounded-full bg-primary/40 blur-md"
        />
        {!isOpen && <Sparkles size={16} className="text-primary/70 absolute" />}
      </motion.button>

      <ConfirmDialog
        isOpen={showForgetDialog}
        title="Clear Seren's memory?"
        message="Seren will forget everything you've shared. Your conversation history will be permanently deleted."
        confirmLabel="Forget everything"
        cancelLabel="Keep memories"
        variant="danger"
        onConfirm={executeForgetHistory}
        onCancel={() => setShowForgetDialog(false)}
      />
    </div>
  )
}
