'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Ghost, ImagePlus, X, Trash2, ChevronDown, ArrowLeft, Check, CheckCheck } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markMessagesAsRead, deleteMessageForEveryone, deleteMessage, deleteChatWithUser } from '@/app/(main)/actions'
import Link from 'next/link'
import { OnlineDot, usePresence } from '@/components/presence'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function Avatar({ src, name, size = 9 }: { src?: string; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/20 shadow-2xs`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="font-light text-muted-foreground text-xs" style={{ fontSize: size * 1.5 }}>{name?.[0]?.toUpperCase()}</span>
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
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => setRevealed(true)}
        className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 cursor-pointer text-xs text-primary/80 select-none transition-all duration-300 font-light"
      >
        <Ghost size={13} className="shrink-0 animate-pulse text-primary" />
        <span className="tracking-wide">Reveal hidden whisper</span>
      </motion.div>
    )
  }

  return (
    <div className="relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed border border-rose-500/20 bg-rose-500/5 text-foreground/90 transition-all duration-300">
      <Ghost size={11} className="absolute top-2.5 right-2.5 opacity-30 text-rose-500" />
      <p className="pr-3 font-light break-words">{msg.content}</p>
      {!isMe && (
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-rose-500/40 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      )}
    </div>
  )
}

export function ChatInterface({ currentUserId, recipient, areFriends }: { currentUserId: string; recipient: any; areFriends?: boolean }) {
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isWhisper, setIsWhisper] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const recipientOnline = usePresence(recipient.id)

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

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this entire chat? This cannot be undone.')) {
      await deleteChatWithUser(recipient.id)
      setMessages([])
    }
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
    <div className="flex flex-col h-full min-h-0 bg-transparent relative w-full">
      {/* ── HEADER ───────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-border/10 bg-background/30 backdrop-blur-xl shrink-0 z-10">
        {/* Back button on mobile */}
        <Link href="/messages" className="md:hidden p-1.5 -ml-1 text-muted-foreground hover:text-foreground transition-all hover:scale-105">
          <ArrowLeft size={18} strokeWidth={1.5} />
        </Link>

        <div className="relative shrink-0">
          <Avatar src={recipient.avatar_url} name={recipient.display_name} size={9} />
          <OnlineDot userId={recipient.id} className="absolute bottom-0 right-0 w-2.5 h-2.5 border border-background shadow-xs" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-light text-sm tracking-tight text-foreground truncate">{recipient.display_name}</p>
          <p className="text-[10px] text-muted-foreground/60 font-light flex items-center gap-1.5 mt-0.5">
            <span className={`w-1 h-1 rounded-full inline-block ${recipientOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.4)] animate-pulse' : 'bg-muted-foreground/35'}`} />
            {recipientOnline ? 'Active now' : 'Offline'}
          </p>
        </div>

        <button
          onClick={handleDeleteChat}
          className="p-2 text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded-full transition-all shrink-0 cursor-pointer"
          title="Delete chat"
        >
          <Trash2 size={16} strokeWidth={1.5} />
        </button>
      </div>

      {/* ── MESSAGES ──────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-0.5 scroll-smooth relative z-10 scrollbar-none"
        style={{ overscrollBehavior: 'contain' }}
      >
        {grouped.map(({ date, msgs }) => (
          <div key={date}>
            {/* Date separator */}
            <div className="flex items-center justify-center my-6">
              <span className="text-[9px] font-light tracking-widest text-muted-foreground/40 uppercase">
                {date}
              </span>
            </div>

            {msgs.map((msg, i) => {
              const isMe = msg.sender_id === currentUserId
              const samePrev = isSameAuthorAsPrev(msgs, i)
              const sameNext = isSameAuthorAsNext(msgs, i)
              const isLastRead = msg.id === lastReadMsg?.id
              const isOpt = msg.is_optimistic

              // Gorgeous minimalist shape logic for grouped messages
              const bubbleRadius = isMe
                ? `rounded-3xl ${sameNext ? 'rounded-br-xs' : 'rounded-br-3xl'} ${samePrev ? 'rounded-tr-xs' : ''}`
                : `rounded-3xl ${sameNext ? 'rounded-bl-xs' : 'rounded-bl-3xl'} ${samePrev ? 'rounded-tl-xs' : ''}`

              return (
                <div key={msg.id} className={`${samePrev ? 'mt-0.5' : 'mt-4'}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                    onMouseEnter={() => setHoveredId(msg.id)}
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {/* Other user's avatar - only show on last message in group */}
                    {!isMe && (
                      <div className="w-7 shrink-0 flex justify-center">
                        {!sameNext && (
                          <Avatar src={recipient.avatar_url} name={recipient.display_name} size={6} />
                        )}
                      </div>
                    )}

                    {/* Delete action for my messages */}
                    {isMe && hoveredId === msg.id && !isOpt && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => handleDelete(msg.id)}
                        className="p-1.5 rounded-full text-muted-foreground/30 hover:text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                      >
                        <Trash2 size={12} strokeWidth={1.5} />
                      </motion.button>
                    )}

                    {/* Bubble */}
                    <div className={`max-w-[85%] md:max-w-[75%] min-w-0`}>
                      {msg.is_whisper ? (
                        <WhisperBubble msg={msg} isMe={isMe} />
                      ) : (
                        <div className={`
                          relative px-4 py-2.5 text-[13px] leading-relaxed select-text ${bubbleRadius} transition-all duration-200
                          ${isMe
                            ? 'bg-neutral-950 text-neutral-50 dark:bg-neutral-800 dark:text-neutral-100 border border-black/[0.05] dark:border-white/[0.04] shadow-2xs font-light'
                            : 'bg-white/40 dark:bg-white/[0.03] text-foreground/95 border border-black/[0.03] dark:border-white/[0.04] shadow-3xs font-light backdrop-blur-md'
                          }
                          ${isOpt ? 'opacity-50 animate-pulse' : ''}
                        `}>
                          {msg.image_url && (
                            <div className="rounded-2xl overflow-hidden mb-2 max-h-64 w-full bg-muted/20 border border-border/5">
                              <img
                                src={msg.image_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          {msg.content && <p className="break-words font-light tracking-wide">{msg.content}</p>}
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
                            <span className="text-[9px] text-muted-foreground/35">{formatTime(msg.created_at)}</span>
                            {isMe && (
                              msg.read_at
                                ? <CheckCheck size={10} className="text-primary/60" />
                                : <Check size={10} className="text-muted-foreground/25" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                  {/* Seen label below last read message */}
                  {isLastRead && !hoveredId && (
                    <p className="text-[9px] text-muted-foreground/35 text-right mt-1 pr-1 flex items-center justify-end gap-1 font-light uppercase tracking-wider select-none">
                      Seen
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-28 text-center bg-transparent">
            <Avatar src={recipient.avatar_url} name={recipient.display_name} size={12} />
            <div className="space-y-1">
              <p className="font-light text-sm text-foreground/80">{recipient.display_name}</p>
              <p className="text-xs text-muted-foreground/45 font-light">Start a secure, end-to-end private talk 🌿</p>
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
            className="absolute bottom-24 right-6 w-8 h-8 bg-background/80 border border-border/10 shadow-sm rounded-full flex items-center justify-center text-muted-foreground/75 hover:text-foreground transition-all duration-200 z-20 hover:scale-105 cursor-pointer backdrop-blur-md"
          >
            <ChevronDown size={14} />
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
            className="px-6 pt-2 shrink-0 bg-transparent"
          >
            <div className="relative inline-block bg-background/50 backdrop-blur-md p-1.5 rounded-2xl border border-border/15 shadow-sm">
              <img src={imagePreview} alt="preview" className="h-20 rounded-xl object-cover border border-border/10" />
              <button
                onClick={() => { setImageFile(null); setImagePreview(null) }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-background border border-border/15 shadow-sm rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer transition-all duration-150 hover:scale-105"
              >
                <X size={10} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── FLOATING INPUT BAR ───────────────────────────────────── */}
      <div className="shrink-0 px-4 md:px-8 pb-6 pt-2 bg-transparent z-20">
        <div className="max-w-4xl mx-auto">
          {isWhisper && (
            <motion.p
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[9px] text-center text-primary/80 font-light mb-3 flex items-center justify-center gap-1.5 uppercase tracking-widest"
            >
              <Ghost size={12} className="text-primary animate-pulse" />
              Whisper mode · self-destructs after 10s
            </motion.p>
          )}

          {areFriends === false ? (
            <div className="flex items-center justify-center py-3 px-4 bg-muted/20 border border-border/10 rounded-2xl">
              <p className="text-xs font-light text-muted-foreground">You should be friends before messaging.</p>
            </div>
          ) : (
            <form onSubmit={handleSend} className={`
              flex items-center gap-2 p-1.5 rounded-full border transition-all duration-300
              ${isWhisper
                ? 'border-primary/40 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]'
                : 'border-border/30 bg-background/60 backdrop-blur-2xl shadow-sm focus-within:border-border/60 focus-within:shadow-md'
              }
            `}>
              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

              {/* Image attach */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 flex items-center justify-center text-muted-foreground/60 hover:text-foreground hover:bg-muted/20 rounded-full transition-all shrink-0 cursor-pointer"
              >
                <ImagePlus size={16} strokeWidth={1.5} />
              </button>

              {/* Whisper toggle */}
              <button
                type="button"
                onClick={() => setIsWhisper(!isWhisper)}
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all shrink-0 cursor-pointer ${
                  isWhisper
                    ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                    : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted/20'
                }`}
              >
                <Ghost size={16} strokeWidth={1.5} />
              </button>

              {/* Text input */}
              <div className="flex-1 relative min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  placeholder={isWhisper ? 'Type a self-destructing whisper...' : 'Type a message...'}
                  className="w-full px-3 py-1.5 text-[13px] font-light bg-transparent border-0 outline-none focus:ring-0 placeholder:text-muted-foreground/35 text-foreground"
                />
              </div>

              {/* Send button */}
              <motion.button
                type="submit"
                disabled={(!newMessage.trim() && !imageFile) || isSending}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-9 h-9 bg-primary text-primary-foreground rounded-full flex items-center justify-center disabled:opacity-20 transition-all shrink-0 cursor-pointer shadow-xs hover:shadow-md hover:bg-primary/95"
              >
                <Send size={14} strokeWidth={1.5} />
              </motion.button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
