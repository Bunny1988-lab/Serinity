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
            className="bg-surface border-[0.5px] border-outline-variant shadow-lg w-[90vw] max-w-[360px] h-[70vh] max-h-[560px] sm:w-[450px] sm:h-[660px] md:w-[480px] md:h-[700px] flex flex-col overflow-hidden relative"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b-[0.5px] border-outline-variant bg-surface-container-low">
              <div className="flex items-center gap-3">
                <Sparkles size={20} className="text-secondary" />
                <span className="font-display text-2xl font-bold tracking-wide text-primary italic">Seren</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleForgetHistory}
                  className="p-2 text-on-surface-variant hover:text-secondary transition-colors rounded-full hover:bg-surface-container shadow-sm"
                  title="Forget History"
                >
                  <Trash2 size={18} strokeWidth={2} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-on-surface-variant hover:text-primary transition-colors rounded-full hover:bg-surface-container shadow-sm"
                >
                  <X size={20} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-outline bg-surface-container-low">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id + i} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`px-5 py-4 max-w-[85%] text-sm leading-relaxed font-medium ${
                    msg.role === 'user' 
                      ? 'bg-primary text-on-primary rounded-2xl rounded-br-sm shadow-sm' 
                      : 'bg-surface border-[0.5px] border-outline-variant text-primary rounded-2xl rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.content}
                    {msg.content === '' && isStreaming && <span className="animate-pulse">...</span>}
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-6 bg-surface border-t-[0.5px] border-outline-variant">
              <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Reflect with Seren..."
                  className="w-full h-14 bg-surface-container-lowest border-[0.5px] border-outline-variant rounded-full pl-6 pr-14 focus:outline-none focus:border-primary text-[15px] font-medium text-primary placeholder:text-on-surface-variant shadow-sm transition-all"
                  disabled={isStreaming}
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isStreaming}
                  className="absolute right-1 w-12 h-12 flex items-center justify-center bg-primary text-on-primary rounded-full disabled:opacity-50 transition-opacity hover:bg-primary/90 shadow-sm"
                >
                  <Send size={18} strokeWidth={2} />
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
        className="w-16 h-16 rounded-full border-[0.5px] border-outline-variant bg-surface flex items-center justify-center cursor-pointer shadow-lg relative overflow-hidden"
        title="Open Seren"
      >
        <motion.div 
          animate={{ opacity: shouldReduceMotion ? 0.5 : [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-surface-container opacity-50"
        />
        {!isOpen && <Sparkles size={24} className="text-secondary relative z-10" strokeWidth={2} />}
        {isOpen && <X size={24} className="text-primary relative z-10" strokeWidth={2} />}
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
