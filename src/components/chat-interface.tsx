'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Ghost, ImagePlus, X, Trash2, ChevronDown, ArrowLeft, Check, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markMessagesAsRead, deleteMessageForEveryone, deleteMessage } from '@/app/(main)/actions'
import Link from 'next/link'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ src, name, size = 9 }: { src?: string; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="font-semibold text-primary/60" style={{ fontSize: size * 1.8 }}>{name?.[0]?.toUpperCase()}</span>
      }
    </div>
  )
}

function WhisperBubble({ msg, isMe }: { msg: any; isMe: boolean }) {
  const [revealed, setRevealed] = useState(isMe)
  const [timeLeft, setTimeLeft] = useState(10)

  useEffect(() => {
    if (!revealed || isMe) return
    if (timeLeft <= 0) { deleteMessage(msg.id); return }
    const t = setInterval(() => setTimeLeft(n => n - 1), 1000)
    return () => clearInterval(t)
  }, [revealed, timeLeft, isMe, msg.id])

  if (!revealed) {
    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setRevealed(true)}
        className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 cursor-pointer text-sm text-primary/70 select-none"
      >
        <Ghost size={15} className="shrink-0" />
        <span className="font-light">Tap to reveal whisper</span>
      </motion.div>
    )
  }

  return (
    <div className={`relative px-4 py-3 rounded-2xl overflow-hidden text-sm leading-relaxed ${
      isMe ? 'bg-primary text-primary-foreground' : 'bg-muted/80 text-foreground'
    }`}>
      <Ghost size={11} className="absolute top-2 right-2.5 opacity-20" />
      <p>{msg.content}</p>
      {!isMe && (
        <div
          className="absolute bottom-0 left-0 h-[3px] bg-destructive/50 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      )}
    </div>
  )
}

export function ChatInterface({ currentUserId, recipient }: { currentUserId: string; recipient: any }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isWhisper, setIsWhisper] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)

  const [supabase] = useState(() => createClient())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    fetchMessages()
    markMessagesAsRead(recipient.id)
    inputRef.current?.focus()

    const channel = supabase
      .channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
        const msg = payload.new
        if (
          (msg.sender_id === recipient.id && msg.receiver_id === currentUserId) ||
          (msg.sender_id === currentUserId && msg.receiver_id === recipient.id)
        ) {
          setMessages(prev => {
            const optIndex = prev.findIndex(m => m.id === msg.id && m.is_optimistic)
            if (optIndex !== -1) {
              const updated = [...prev]
              updated[optIndex] = msg
              return updated
            }

            // Prevent duplicates if already loaded
            if (prev.some(m => m.id === msg.id)) return prev

            return [...prev, msg]
          })
          if (msg.sender_id === recipient.id) markMessagesAsRead(recipient.id)
        }
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => prev.filter(m => m.id !== payload.old.id))
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, payload => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [recipient.id, supabase, currentUserId])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isNearBottom) scrollToBottom()
  }, [messages, scrollToBottom])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setTimeout(() => scrollToBottom('instant' as ScrollBehavior), 100)
  }

  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    setShowScrollBtn(el.scrollHeight - el.scrollTop - el.clientHeight > 150)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if ((!newMessage.trim() && !imageFile) || isSending) return

    setIsSending(true)
    const text = newMessage.trim()
    setNewMessage('')
    setIsWhisper(false)

    let image_url = ''
    if (imageFile) {
      const ext = imageFile.name.split('.').pop()
      const path = `messages/${currentUserId}/${Date.now()}.${ext}`
      const { error } = await supabase.storage.from('uploads').upload(path, imageFile)
      if (!error) {
        const { data } = supabase.storage.from('uploads').getPublicUrl(path)
        image_url = data.publicUrl
      }
      setImageFile(null)
      setImagePreview(null)
    }

    const messageId = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = Math.random() * 16 | 0
          return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
        })

    const msg = {
      id: messageId,
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content: text,
      is_whisper: isWhisper,
      ...(image_url ? { image_url } : {})
    }

    setMessages(prev => [...prev, { ...msg, is_optimistic: true, created_at: new Date().toISOString() }])
    await supabase.from('messages').insert(msg)
    setIsSending(false)
    inputRef.current?.focus()
  }

  async function handleDelete(msgId: string) {
    setMessages(prev => prev.filter(m => m.id !== msgId))
    await deleteMessageForEveryone(msgId)
  }

  // Group messages by date
  const grouped: { date: string; msgs: any[] }[] = []
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString(undefined, {
      weekday: 'long', month: 'short', day: 'numeric'
    })
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.msgs.push(msg)
    else grouped.push({ date, msgs: [msg] })
  })

  // Consecutive same-sender grouping
  const isSameAuthorAsPrev = (msgs: any[], i: number) =>
    i > 0 && msgs[i].sender_id === msgs[i - 1].sender_id
  const isSameAuthorAsNext = (msgs: any[], i: number) =>
    i < msgs.length - 1 && msgs[i].sender_id === msgs[i + 1].sender_id

  // Last read message
  const lastReadMsg = [...messages].reverse().find(m => m.sender_id === currentUserId && m.read_at)

  return (
    <div className="flex flex-col h-full min-h-0 bg-background">

      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/30 bg-background/80 backdrop-blur-xl shrink-0 z-10">
        {/* Back button on mobile */}
        <Link href="/messages" className="md:hidden p-1.5 -ml-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>

        <Avatar src={recipient.avatar_url} name={recipient.display_name} size={9} />

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm leading-tight text-foreground truncate">{recipient.display_name}</p>
          <p className="text-xs text-muted-foreground/60 font-light">@{recipient.username}</p>
        </div>
      </div>

      {/* ── MESSAGES ─────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-0.5 scroll-smooth"
        style={{ overscrollBehavior: 'contain' }}
      >
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border/40 to-transparent" />
              <span className="text-[10px] text-muted-foreground/40 font-medium tracking-wide uppercase">{date}</span>
              <div className="flex-1 h-px bg-gradient-to-l from-transparent via-border/40 to-transparent" />
            </div>

            {msgs.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const samePrev = isSameAuthorAsPrev(msgs, i)
              const sameNext = isSameAuthorAsNext(msgs, i)
              const isLastRead = msg.id === lastReadMsg?.id
              const isOpt = msg.is_optimistic

              // Bubble shape: grouped bubbles lose their "tail"
              const bubbleRadius = isMe
                ? `rounded-2xl ${sameNext ? 'rounded-br-md' : 'rounded-br-sm'} ${samePrev ? 'rounded-tr-md' : ''}`
                : `rounded-2xl ${sameNext ? 'rounded-bl-md' : 'rounded-bl-sm'} ${samePrev ? 'rounded-tl-md' : ''}`

              return (
                <div key={msg.id} className={`${samePrev ? 'mt-0.5' : 'mt-3'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.18, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
                    onMouseEnter={() => setHoveredId(msg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Other user's avatar - only show on last message in group */}
                    {!isMe && (
                      <div className="w-7 shrink-0">
                        {!sameNext && (
                          <Avatar src={recipient.avatar_url} name={recipient.display_name} size={7} />
                        )}
                      </div>
                    )}

                    {/* Delete action for my messages */}
                    {isMe && hoveredId === msg.id && !isOpt && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 rounded-full text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors"
                      >
                        <Trash2 size={13} />
                      </motion.button>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[70%] min-w-0`}>
                      {msg.is_whisper ? (
                        <WhisperBubble msg={msg} isMe={isMe} />
                      ) : (
                        <div className={`
                          relative px-3.5 py-2.5 text-sm leading-relaxed select-text ${bubbleRadius}
                          ${isMe
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted/70 text-foreground border border-border/20'
                          }
                          ${isOpt ? 'opacity-70' : ''}
                        `}>
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt=""
                              className="rounded-xl mb-2 max-h-64 w-full object-cover"
                            />
                          )}
                          {msg.content && <p className="break-words">{msg.content}</p>}
                        </div>
                      )}

                      {/* Timestamp + seen - show on hover */}
                      <AnimatePresence>
                        {hoveredId === msg.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className={`flex items-center gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}
                          >
                            <span className="text-[10px] text-muted-foreground/40">{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.read_at
                                ? <CheckCheck size={12} className="text-primary/50" />
                                : <Check size={12} className="text-muted-foreground/30" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Seen label below last read message */}
                  {isLastRead && !hoveredId && (
                    <p className="text-[10px] text-muted-foreground/40 text-right mt-1 pr-1 flex items-center justify-end gap-1">
                      <CheckCheck size={11} className="text-primary/40" /> Seen
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
            <Avatar src={recipient.avatar_url} name={recipient.display_name} size={14} />
            <div>
              <p className="font-semibold text-foreground/70 text-sm">{recipient.display_name}</p>
              <p className="text-xs text-muted-foreground/50 mt-1">Send a message to start the conversation 🌿</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} className="h-1" />
      </div>

      {/* Scroll to bottom FAB */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-24 right-5 w-9 h-9 bg-background/90 backdrop-blur-sm border border-border/50 shadow-lg rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors z-20"
          >
            <ChevronDown size={16} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── IMAGE PREVIEW ────────────────────────────────── */}
      <AnimatePresence>
        {imagePreview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pt-3 shrink-0 bg-background border-t border-border/20"
          >
            <div className="relative inline-block">
              <img src={imagePreview} alt="preview" className="h-24 rounded-xl object-cover border border-border/30" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute -top-2 -right-2 w-5 h-5 bg-background border border-border/50 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground"
              >
                <X size={11} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ─────────────────────────────────────── */}
      <div className="shrink-0 px-4 py-3 bg-background/80 backdrop-blur-xl border-t border-border/30">
        {isWhisper && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] text-center text-primary/60 font-medium mb-2 flex items-center justify-center gap-1.5"
          >
            <Ghost size={11} />
            Whisper mode · self-destructs after reading
          </motion.p>
        )}

        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

          {/* Image attach */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-9 h-9 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-full transition-colors shrink-0"
          >
            <ImagePlus size={18} strokeWidth={1.5} />
          </button>

          {/* Whisper toggle */}
          <button
            type="button"
            onClick={() => setIsWhisper(!isWhisper)}
            className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 ${
              isWhisper
                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            <Ghost size={18} strokeWidth={1.5} />
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={isWhisper ? 'Whisper a secret...' : 'Message...'}
              className={`
                w-full px-4 py-2.5 pr-10 text-sm font-light rounded-full outline-none transition-all
                bg-muted/40 border focus:bg-muted/60
                ${isWhisper
                  ? 'border-primary/30 focus:border-primary/50 placeholder:text-primary/40'
                  : 'border-border/30 focus:border-border/60 placeholder:text-muted-foreground/50'
                }
              `}
            />
          </div>

          {/* Send button */}
          <motion.button
            type="submit"
            disabled={(!newMessage.trim() && !imageFile) || isSending}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity shrink-0 shadow-sm"
          >
            <Send size={15} />
          </motion.button>
        </form>
      </div>
    </div>
  )
}
