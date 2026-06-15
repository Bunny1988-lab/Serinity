'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, Ghost, ImagePlus, X, Trash2, ChevronLeft, ArrowLeft, Check, CheckCheck, Settings, Mic, Paperclip, Reply, Smile, Play, Square, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { markMessagesAsRead, deleteMessageForEveryone, deleteMessage, deleteChatWithUser, toggleMessageReaction, checkAndSendQuietReply } from '@/app/(main)/actions'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { OnlineDot, usePresence } from '@/components/presence'
import { toast } from 'sonner'

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function playResonanceSound(type: 'om' | 'love' | 'chime' | 'water') {
  if (typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AudioContextClass()
    const masterGain = ctx.createGain()
    masterGain.gain.setValueAtTime(0.35, ctx.currentTime)
    masterGain.connect(ctx.destination)

    const now = ctx.currentTime

    if (type === 'om') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(136.1, now)
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0.4, now)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.0)
      osc.connect(gainNode)
      gainNode.connect(masterGain)
      osc.start(now)
      osc.stop(now + 2.2)
      if (navigator.vibrate) navigator.vibrate([400])
    } else if (type === 'love') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(528.0, now)
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0.3, now)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8)
      osc.connect(gainNode)
      gainNode.connect(masterGain)
      osc.start(now)
      osc.stop(now + 2.0)
      if (navigator.vibrate) navigator.vibrate([100, 80, 100])
    } else if (type === 'chime') {
      const partials = [440, 880, 1200]
      const gains = [0.3, 0.15, 0.05]
      partials.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(f, now)
        const gainNode = ctx.createGain()
        gainNode.gain.setValueAtTime(gains[idx], now)
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.5)
        osc.connect(gainNode)
        gainNode.connect(masterGain)
        osc.start(now)
        osc.stop(now + 1.7)
      })
      if (navigator.vibrate) navigator.vibrate([150])
    } else if (type === 'water') {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(200, now)
      osc.frequency.exponentialRampToValueAtTime(800, now + 0.15)
      const gainNode = ctx.createGain()
      gainNode.gain.setValueAtTime(0.4, now)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.2)
      osc.connect(gainNode)
      gainNode.connect(masterGain)
      osc.start(now)
      osc.stop(now + 0.25)
      if (navigator.vibrate) navigator.vibrate([50, 40, 50])
    }
  } catch (e) {
    console.error('AudioContext resonance failed:', e)
  }
}


function Avatar({ src, name, size = 10 }: { src?: string; name: string; size?: number }) {
  const sizeClass = `w-${size} h-${size}`
  return (
    <div className={`${sizeClass} rounded-full overflow-hidden bg-surface-container flex items-center justify-center shrink-0 border border-outline-variant/50`}>
      {src
        ? <img src={src} alt={name} className="w-full h-full object-cover" />
        : <span className="font-semibold text-primary" style={{ fontSize: size * 1.5 }}>{name?.[0]?.toUpperCase()}</span>
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
        className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-primary/20 bg-primary/5 cursor-pointer text-xs text-primary/80 select-none transition-all duration-300 font-medium"
      >
        <Ghost size={13} className="shrink-0 animate-pulse text-primary" />
        <span className="tracking-wide">Reveal hidden whisper</span>
      </motion.div>
    )
  }

  return (
    <div className="relative px-4 py-3 rounded-2xl text-[14px] leading-relaxed border border-border/40 bg-secondary/30 text-foreground/90 transition-all duration-300">
      <Ghost size={11} className="absolute top-2.5 right-2.5 opacity-30 text-muted-foreground" />
      <p className="pr-3 font-medium break-words">{msg.content}</p>
      {!isMe && (
        <div
          className="absolute bottom-0 left-0 h-[2px] bg-primary/20 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      )}
    </div>
  )
}

function VoiceMessagePlayer({ audioUrl, isMe }: { audioUrl: string; isMe: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
  }

  const handleTimeUpdate = () => {
    if (!audioRef.current) return
    setCurrentTime(audioRef.current.currentTime)
  }

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return
    setDuration(audioRef.current.duration)
  }

  const handleEnded = () => {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  const formatAudioTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="flex items-center gap-3 w-56 mb-1" onClick={(e) => e.stopPropagation()}>
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        preload="metadata"
      />
      <button
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 active:scale-95 ${
          isMe ? 'bg-white/20 hover:bg-white/30 text-on-primary' : 'bg-primary/10 hover:bg-primary/20 text-primary'
        }`}
      >
        {isPlaying ? (
          <Square size={12} fill="currentColor" className="text-current" />
        ) : (
          <Play size={14} fill="currentColor" className="ml-0.5 text-current" />
        )}
      </button>
      <div className="flex-1 flex flex-col gap-1">
        <div className="h-1 bg-outline-variant/30 rounded-full relative overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full transition-all duration-100 ease-linear ${
              isMe ? 'bg-white' : 'bg-primary'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[9px] font-medium opacity-70">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration || 0)}</span>
        </div>
      </div>
    </div>
  )
}


function ViewOnceCuration({ msg, isMe }: { msg: any; isMe: boolean }) {
  const [revealed, setRevealed] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)

  useEffect(() => {
    if (!revealed) return
    if (timeLeft <= 0) {
      deleteMessageForEveryone(msg.id)
      return
    }
    const timer = setInterval(() => setTimeLeft(n => n - 1), 1000)
    return () => clearInterval(timer)
  }, [revealed, timeLeft, msg.id])

  if (!revealed && !isMe) {
    return (
      <div 
        onClick={(e) => { e.stopPropagation(); setRevealed(true) }}
        className="bg-primary/5 hover:bg-primary/10 p-6 border-[0.5px] border-outline-variant/30 rounded-2xl flex flex-col items-center gap-3 text-center cursor-pointer transition-all select-none max-w-xs"
      >
        <span className="material-symbols-outlined text-3xl text-primary animate-pulse">lock_open</span>
        <div className="space-y-0.5">
          <p className="text-[11px] uppercase tracking-widest font-bold text-primary">Ephemeral Curation</p>
          <p className="text-[9px] text-outline uppercase tracking-wider font-semibold">Tap to reveal (10s limit)</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border-[0.5px] border-outline-variant max-h-64 w-full bg-surface-container animate-fade-in">
      <img src={msg.image_url} alt="" className="w-full h-full object-cover" />
      {!isMe && (
        <div className="absolute bottom-0 left-0 w-full p-2.5 bg-black/40 backdrop-blur-md flex flex-col gap-1.5 z-20">
          <div className="flex justify-between items-center text-[9px] font-bold uppercase tracking-wider text-white">
            <span>Disappearing in</span>
            <span>{timeLeft}s</span>
          </div>
          <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white transition-all duration-1000 ease-linear" style={{ width: `${(timeLeft / 10) * 100}%` }} />
          </div>
        </div>
      )}
      {isMe && (
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white select-none z-20">
          View Once Sent
        </div>
      )}
    </div>
  )
}

function SharedPostCard({ postId }: { postId: string }) {
  const [post, setPost] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('posts')
      .select('content, image_url, users!posts_author_id_fkey(display_name, username, avatar_url)')
      .eq('id', postId)
      .single()
      .then(({ data }) => {
        if (data) setPost(data)
        setLoading(false)
      })
  }, [postId, supabase])

  if (loading) {
    return (
      <div className="p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low flex items-center justify-center h-20 w-64 animate-pulse">
        <Loader2 size={16} className="animate-spin text-primary/40" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low text-xs text-outline italic w-64">
        Signal no longer available
      </div>
    )
  }

  return (
    <div className="border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low overflow-hidden w-64 text-primary hover:bg-surface-container transition-colors shadow-xs">
      {post.image_url && (
        <div className="h-32 w-full overflow-hidden bg-surface">
          <img src={post.image_url} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border border-outline-variant">
            {post.users?.avatar_url ? (
              <img src={post.users.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold">{post.users?.display_name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider">{post.users?.display_name}</span>
        </div>
        <p className="text-[13px] leading-relaxed line-clamp-2 text-primary/95 font-medium">{post.content}</p>
      </div>
    </div>
  )
}

function SharedProfileCard({ profileId }: { profileId: string }) {
  const [profile, setProfile] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase
      .from('users')
      .select('id, username, display_name, avatar_url, bio')
      .eq('id', profileId)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
        setLoading(false)
      })
  }, [profileId, supabase])

  if (loading) {
    return (
      <div className="p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low flex items-center justify-center h-20 w-64 animate-pulse">
        <Loader2 size={16} className="animate-spin text-primary/40" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-4 border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low text-xs text-outline italic w-64">
        Profile no longer exists
      </div>
    )
  }

  return (
    <Link href={`/discover?profile=${profile.id}`} className="block border-[0.5px] border-outline-variant/30 rounded-2xl bg-surface-container-low p-4 space-y-3 w-64 hover:bg-surface-container transition-colors shadow-xs text-left">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-surface-container flex items-center justify-center border-[0.5px] border-outline-variant">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="font-bold text-primary">{profile.display_name?.[0]?.toUpperCase()}</span>
          )}
        </div>
        <div>
          <h4 className="text-[14px] font-bold text-primary">{profile.display_name}</h4>
          <p className="text-[9px] text-outline font-semibold uppercase tracking-wider">@{profile.username}</p>
        </div>
      </div>
      {profile.bio && (
        <p className="text-[11px] text-on-surface-variant line-clamp-2 leading-relaxed font-medium italic">
          "{profile.bio}"
        </p>
      )}
      <div className="pt-2 text-[10px] uppercase font-bold text-primary text-center tracking-widest border-t-[0.5px] border-outline-variant/20">
        View Profile
      </div>
    </Link>
  )
}

// ── Vanish-mode colour palette ────────────────────────────────────────────────
const vanishStyles = {
  container: 'bg-[#0b0b0d] text-white [background-image:radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1325] via-[#0b0b0d] to-[#050507]',
  header: 'bg-[#0b0b0d]/80 border-[#221c30]/50',
  headerText: 'text-purple-200',
  headerSub: 'text-purple-400/70',
  bubbleSent: 'bg-[#6d28d9] text-white border-[0.5px] border-[#8b5cf6]/30',
  bubbleReceived: 'bg-[#18181b] text-zinc-100 border-[0.5px] border-zinc-800',
  inputForm: 'bg-[#121214] border-[#2d2d30] focus-within:border-[#6d28d9] text-white',
  inputText: 'text-white placeholder:text-zinc-500',
  buttonIcon: 'text-zinc-400 hover:text-[#a78bfa]',
  dateSep: 'bg-[#1a1426] text-purple-300',
}

// ── Normal palette — light grey background, white input bar ─────────────────
// Uses Tailwind arbitrary values to ensure light grey rendering regardless of global dark mode
const normalStyles = {
  container: 'bg-[#eeeff4] text-[#1a1a2e]',
  header: 'bg-[#eeeff4]/90 backdrop-blur-md border-[#dddee6]',
  headerText: 'text-[#1a1a2e]',
  headerSub: 'text-[#8a8a9a]',
  bubbleSent: 'bg-[#1a1a2e] text-white border-[0.5px] border-[#1a1a2e]/80 shadow-sm',
  bubbleReceived: 'bg-white text-[#1a1a2e] border-[0.5px] border-[#dddee6] shadow-sm',
  inputForm: 'bg-[#ffffff] border-[#dddee6] shadow-md focus-within:border-[#dddee6] outline-none',
  inputText: 'text-[#1a1a2e] placeholder:text-[#9b9bad] outline-none',
  buttonIcon: 'text-[#9b9bad] hover:text-[#1a1a2e]',
  dateSep: 'bg-[#e2e3ea] text-[#8a8a9a]',
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
  
  const [replyingTo, setReplyingTo] = useState<any | null>(null)
  const [isTyping, setIsTyping] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null)
  
  const [isVanishMode, setIsVanishMode] = useState(false)
  const [sendAsViewOnce, setSendAsViewOnce] = useState(false)
  
  const [isRecording, setIsRecording] = useState(false)
  const [audioChunks, setAudioChunks] = useState<Blob[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const recipientOnline = usePresence(recipient.id)
  const [supabase] = useState(() => createClient())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  const EMOJIS = ['❤️', '😂', '😮', '😢', '🙏', '🔥']

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }, [])

  useEffect(() => {
    fetchMessages()
    markMessagesAsRead(recipient.id)
    inputRef.current?.focus()

    const channel = supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`)
    
    channel.on('broadcast', { event: 'typing' }, (payload) => {
      if (payload.payload.userId === recipient.id) {
        setIsTyping(payload.payload.isTyping)
      }
    })

    channel.on('broadcast', { event: 'new_message' }, (payload) => {
      const msg = payload.payload.message
      if (msg.sender_id === recipient.id) {
        setMessages(prev => {
          if (prev.some(m => m.id === msg.id)) return prev
          return [...prev, msg]
        })
        markMessagesAsRead(recipient.id)
        setTimeout(() => scrollToBottom('smooth' as ScrollBehavior), 100)
      }
    })

    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
      if (payload.eventType === 'INSERT') {
        const msg = payload.new
        if (
          (msg.sender_id === recipient.id && msg.receiver_id === currentUserId) ||
          (msg.sender_id === currentUserId && msg.receiver_id === recipient.id)
        ) {
          setMessages(prev => {
            const optIndex = prev.findIndex(m => m.id === msg.id && m.is_optimistic)
            if (optIndex !== -1) {
              const updated = [...prev]
              updated[optIndex] = { ...updated[optIndex], ...msg }
              return updated
            }
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, { ...msg, message_reactions: [] }]
          })
          if (msg.sender_id === recipient.id) markMessagesAsRead(recipient.id)
        }
      } else if (payload.eventType === 'DELETE') {
        const oldMsg = payload.old as any
        if (oldMsg?.id) setMessages(prev => prev.filter(m => m.id !== oldMsg.id))
      } else if (payload.eventType === 'UPDATE') {
        const newMsg = payload.new as any
        if (newMsg?.id) setMessages(prev => prev.map(m => m.id === newMsg.id ? { ...m, ...newMsg } : m))
      }
    })
    
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, payload => {
      if (payload.eventType === 'INSERT') {
        const newReaction = payload.new as any
        setMessages(prev => prev.map(m => {
          if (m.id === newReaction?.message_id) {
            const reacts = m.message_reactions || []
            if (!reacts.some((r: any) => r.id === newReaction.id)) {
              return { ...m, message_reactions: [...reacts, newReaction] }
            }
          }
          return m
        }))
      } else if (payload.eventType === 'DELETE') {
        const oldReaction = payload.old as any
        setMessages(prev => prev.map(m => ({
          ...m,
          message_reactions: (m.message_reactions || []).filter((r: any) => r.id !== oldReaction?.id)
        })))
      } else if (payload.eventType === 'UPDATE') {
        const updReaction = payload.new as any
        setMessages(prev => prev.map(m => ({
          ...m,
          message_reactions: (m.message_reactions || []).map((r: any) => r.id === updReaction?.id ? updReaction : r)
        })))
      }
    })

    channel.subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [recipient.id, supabase, currentUserId])

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80
    if (isNearBottom) scrollToBottom()
  }, [messages, scrollToBottom, isTyping])

  async function fetchMessages() {
    const { data } = await supabase
      .from('messages')
      .select('*, message_reactions(id, emoji, user_id, resonance_type)')
      .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${currentUserId})`)
      .order('created_at', { ascending: true })
    if (data) setMessages(data)
    setTimeout(() => scrollToBottom('instant' as ScrollBehavior), 100)
  }

  useEffect(() => {
    if (!isVanishMode) {
      supabase.from('messages')
        .delete()
        .eq('is_vanish', true)
        .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${recipient.id}),and(sender_id.eq.${recipient.id},receiver_id.eq.${currentUserId})`)
        .then(() => {
          fetchMessages()
        })
    }
  }, [isVanishMode, recipient.id, currentUserId, supabase])

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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      const chunks: Blob[] = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' })
        sendAudioMessage(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      setAudioChunks([])
      setIsRecording(true)
      setRecordingTime(0)
      mediaRecorder.start(200)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (err) {
      toast.error('Microphone access denied or unavailable.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      setIsRecording(false)
      setAudioChunks([])
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current)
    }
  }

  const sendAudioMessage = async (audioBlob: Blob) => {
    setIsSending(true)
    const path = `messages/${currentUserId}/audio_${Date.now()}.webm`
    const { error } = await supabase.storage.from('uploads').upload(path, audioBlob)
    
    if (error) {
      toast.error('Failed to send voice message')
      setIsSending(false)
      return
    }
    
    const { data } = supabase.storage.from('uploads').getPublicUrl(path)
    
    const messageId = crypto.randomUUID()
    const msg = {
      id: messageId,
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content: '🎤 Voice message',
      is_whisper: false,
      is_vanish: isVanishMode,
      audio_url: data.publicUrl,
      reply_to_id: replyingTo?.id || null,
    }

    setMessages(prev => [...prev, { ...msg, message_reactions: [], is_optimistic: true, created_at: new Date().toISOString() }])
    
    // Broadcast instantly to bypass Postgres realtime config
    supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`).send({
      type: 'broadcast',
      event: 'new_message',
      payload: { message: { ...msg, message_reactions: [], is_optimistic: false, created_at: new Date().toISOString() } }
    })

    await supabase.from('messages').insert(msg)
    await checkAndSendQuietReply(recipient.id)

    setIsSending(false)
    setReplyingTo(null)
  }

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)
    
    supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: true }
    })
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUserId, isTyping: false }
      })
    }, 2000)
  }

  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if ((!newMessage.trim() && !imageFile) || isSending) return

    setIsSending(true)
    const text = newMessage.trim()
    setNewMessage('')
    setIsWhisper(false)
    
    supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUserId, isTyping: false }
    })

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

    const messageId = crypto.randomUUID()
    const msg = {
      id: messageId,
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content: text,
      is_whisper: isWhisper,
      is_vanish: isVanishMode,
      is_view_once: sendAsViewOnce,
      reply_to_id: replyingTo?.id || null,
      ...(image_url ? { image_url } : {})
    }

    // Only send columns that exist in the database schema
    const dbPayload = {
      id: messageId,
      sender_id: currentUserId,
      receiver_id: recipient.id,
      content: text,
      is_whisper: isWhisper,
      reply_to_id: replyingTo?.id || null,
      ...(image_url ? { image_url } : {})
    }

    setMessages(prev => [...prev, { ...msg, message_reactions: [], is_optimistic: true, created_at: new Date().toISOString() }])
    
    // Broadcast instantly to bypass Postgres realtime config
    supabase.channel(`dm_${[currentUserId, recipient.id].sort().join('_')}`).send({
      type: 'broadcast',
      event: 'new_message',
      payload: { message: { ...msg, message_reactions: [], is_optimistic: false, created_at: new Date().toISOString() } }
    })

    const { error: insertError } = await supabase.from('messages').insert(dbPayload)
    
    if (insertError) {
      console.error('Failed to send message:', insertError)
      toast.error('Failed to send message. Please try again.')
      // Revert optimistic update
      setMessages(prev => prev.filter(m => m.id !== messageId))
      setIsSending(false)
      return
    }

    await checkAndSendQuietReply(recipient.id)

    setIsSending(false)
    setReplyingTo(null)
    setSendAsViewOnce(false)
    inputRef.current?.focus()
  }

  async function handleDelete(msgId: string) {
    setActiveMenuId(null)
    setMessages(prev => prev.filter(m => m.id !== msgId))
    await deleteMessageForEveryone(msgId)
  }

  async function handleReact(msgId: string, emoji: string) {
    setActiveMenuId(null)
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const reacts = m.message_reactions || []
        const existing = reacts.find((r: any) => r.user_id === currentUserId)
        let newReacts = [...reacts]
        
        if (existing) {
          if (existing.emoji === emoji) {
            newReacts = newReacts.filter((r: any) => r.user_id !== currentUserId)
          } else {
            existing.emoji = emoji
          }
        } else {
          newReacts.push({ id: 'temp', emoji, user_id: currentUserId })
        }
        return { ...m, message_reactions: newReacts }
      }
      return m
    }))
    
    await toggleMessageReaction(msgId, emoji)
  }

  const router = useRouter()

  const handleDeleteChat = async () => {
    if (confirm('Are you sure you want to delete this entire chat? This cannot be undone.')) {
      await deleteChatWithUser(recipient.id)
      toast.success('Chat securely deleted', { icon: '🗑️' })
      router.refresh()
      router.push('/messages')
    }
  }

  // Group messages by date
  const displayedMessages = messages.filter(msg => !!msg.is_vanish === isVanishMode)
  const grouped: { date: string; msgs: any[] }[] = []
  displayedMessages.forEach(msg => {
    const date = new Date(msg.created_at).toLocaleDateString(undefined, {
      weekday: 'long', month: 'short', day: 'numeric'
    }).toUpperCase()
    const last = grouped[grouped.length - 1]
    if (last?.date === date) last.msgs.push(msg)
    else grouped.push({ date, msgs: [msg] })
  })

  const formatRecTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0')
    const s = (secs % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  const st = isVanishMode ? vanishStyles : normalStyles

  return (
    <div
      className={`flex flex-col h-full overflow-hidden relative w-full transition-all duration-500 ${st.container}`}
      onClick={() => setActiveMenuId(null)}
    >
      {/* ── HEADER ─ fixed height, never scrolls ─────────────────────────── */}
      <header
        className={`h-[64px] shrink-0 flex justify-between items-center px-4 md:px-8 border-b-[0.5px] z-20 transition-all duration-500 ${st.header}`}
      >
        <div className="flex items-center gap-4">
          {/* Back arrow — mobile only */}
          <Link href="/messages" className="md:hidden -ml-2 p-1.5 rounded-full hover:bg-surface-container transition-colors">
            <ChevronLeft size={22} className={st.headerText} />
          </Link>

          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-surface-container border-[0.5px] border-outline-variant">
              {recipient.avatar_url ? (
                <img src={recipient.avatar_url} alt={recipient.display_name} className="w-full h-full object-cover" />
              ) : (
                <span className={`font-bold ${st.headerText}`}>{recipient.display_name?.[0]?.toUpperCase()}</span>
              )}
            </div>
            <OnlineDot userId={recipient.id} className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-surface" />
          </div>

          {/* Name + status */}
          <div>
            <h3 className={`font-headline-sm text-[20px] transition-colors duration-300 ${st.headerText}`}>
              {recipient.display_name}
            </h3>
            <p className={`text-[10px] uppercase tracking-[2px] font-semibold transition-colors duration-300 ${st.headerSub}`}>
              {recipientOnline ? 'Active Now' : 'Offline'}
              {recipient.username ? ` — @${recipient.username}` : ''}
            </p>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Vanish toggle */}
          <button
            type="button"
            onClick={() => setIsVanishMode(!isVanishMode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-[0.5px] transition-all text-[10px] font-bold uppercase tracking-wider ${
              isVanishMode
                ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                : 'border-outline-variant/40 bg-surface-container/60 hover:bg-surface-container text-outline hover:text-primary'
            }`}
            title="Toggle Vanish Mode"
          >
            <Ghost size={12} className={isVanishMode ? 'animate-pulse' : 'opacity-70'} />
            <span>Vanish</span>
          </button>

          <button
            className={`material-symbols-outlined transition-colors ${st.headerSub} hover:${st.headerText}`}
            onClick={() => {}}
          >
            call
          </button>
          <button
            className={`material-symbols-outlined transition-colors ${st.headerSub} hover:${st.headerText}`}
            onClick={() => {}}
          >
            videocam
          </button>
          <button
            className={`material-symbols-outlined transition-colors ${st.headerSub} hover:text-error`}
            onClick={handleDeleteChat}
            title="Delete Chat"
          >
            more_vert
          </button>
        </div>
      </header>

      {/* ── MESSAGES AREA ─────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto px-6 md:px-16 py-10 scroll-smooth relative z-10 hide-scrollbar"
        id="chat-scroller"
        style={{ overscrollBehavior: 'contain' }}
      >
        <div className="max-w-2xl mx-auto w-full space-y-5">

          {/* Vanish mode banner */}
          {isVanishMode && (
            <div className="flex flex-col items-center gap-2 p-5 rounded-3xl border-[0.5px] border-purple-500/20 bg-purple-500/5 text-center text-xs text-purple-300 font-medium tracking-wide animate-fade-in max-w-md mx-auto">
              <Ghost size={18} className="text-purple-400 animate-pulse" />
              <div className="space-y-0.5">
                <p className="uppercase tracking-widest font-bold text-purple-200" style={{ fontSize: '10px' }}>Vanish Mode Active</p>
                <p className="text-[10px] text-purple-400/70 font-normal leading-relaxed">Seen messages will disappear when you close this secure chat space.</p>
              </div>
            </div>
          )}

          {/* Date-grouped messages */}
          {grouped.map(({ date, msgs }) => (
            <div key={date} className="space-y-6">
              {/* Date separator pill */}
              <div className="flex items-center justify-center">
                <span className={`px-4 py-1 rounded-full text-[10px] font-label-caps uppercase tracking-widest font-semibold ${st.dateSep}`}>
                  {date}
                </span>
              </div>

              {msgs.map((msg) => {
                const isMe = msg.sender_id === currentUserId
                const isOpt = msg.is_optimistic

                let repliedMsg = null
                if (msg.reply_to_id) {
                  repliedMsg = messages.find(m => m.id === msg.reply_to_id)
                }

                const reactionCounts: Record<string, number> = {}
                const myReaction = msg.message_reactions?.find((r: any) => r.user_id === currentUserId)
                msg.message_reactions?.forEach((r: any) => {
                  reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1
                })

                const showContextMenu = activeMenuId === msg.id

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[80%] md:max-w-[70%] group relative ${isMe ? 'flex-row-reverse ml-auto' : ''}`}
                  >
                    {/* Recipient avatar — shown only for received messages */}
                    {!isMe && (
                      <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 mt-auto overflow-hidden border border-outline-variant/30 self-end">
                        {recipient.avatar_url ? (
                          <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">
                            {recipient.display_name?.[0]?.toUpperCase()}
                          </span>
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col relative ${isMe ? 'items-end' : 'items-start'}`}>

                      {/* Reply preview */}
                      {repliedMsg && (
                        <div className={`text-[11px] text-on-surface-variant flex items-center gap-1.5 mb-1 opacity-60 ${isMe ? 'flex-row-reverse' : ''}`}>
                          <Reply size={10} className={isMe ? 'rotate-180' : ''} />
                          <span className="truncate max-w-[200px] italic">
                            {repliedMsg.sender_id === currentUserId ? 'You' : recipient.display_name}: {repliedMsg.content}
                          </span>
                        </div>
                      )}

                      {/* Bubble */}
                      <div
                        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setActiveMenuId(msg.id) }}
                        onClick={(e) => { e.stopPropagation(); setActiveMenuId(activeMenuId === msg.id ? null : msg.id) }}
                        className={`relative cursor-pointer transition-all duration-200 ${isOpt ? 'opacity-50 animate-pulse' : ''} ${
                          isMe
                            ? `${st.bubbleSent} p-4 rounded-2xl rounded-tr-none`
                            : `${st.bubbleReceived} p-4 rounded-2xl rounded-tl-none`
                        }`}
                      >
                        {/* View-once image */}
                        {msg.is_view_once && msg.image_url ? (
                          <ViewOnceCuration msg={msg} isMe={isMe} />
                        ) : msg.image_url ? (
                          <div className="rounded-xl overflow-hidden mb-2 max-h-64 w-full bg-surface-container border-[0.5px] border-outline-variant/20 group/img cursor-zoom-in">
                            <img
                              src={msg.image_url}
                              alt=""
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                            />
                          </div>
                        ) : null}

                        {/* Audio */}
                        {msg.audio_url && <VoiceMessagePlayer audioUrl={msg.audio_url} isMe={isMe} />}

                        {/* Text */}
                        {msg.is_whisper ? (
                          <WhisperBubble msg={msg} isMe={isMe} />
                        ) : (
                          <div className="space-y-2">
                            {msg.content && (
                              <p className="text-[15px] leading-relaxed break-words font-medium">
                                {msg.content}
                              </p>
                            )}
                            {msg.shared_post_id && <SharedPostCard postId={msg.shared_post_id} />}
                            {msg.shared_profile_id && <SharedProfileCard profileId={msg.shared_profile_id} />}
                          </div>
                        )}

                        {/* Reaction badges */}
                        {msg.message_reactions?.length > 0 && (
                          <div className={`absolute -bottom-3.5 ${isMe ? 'right-3' : 'left-3'} bg-surface border-[0.5px] border-outline-variant/60 rounded-full px-2.5 py-1 flex items-center gap-1.5 shadow-sm z-10 select-none`}>
                            {msg.message_reactions.map((react: any) => {
                              const isResonance = !!react.resonance_type
                              return (
                                <button
                                  key={react.id}
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    if (react.resonance_type) playResonanceSound(react.resonance_type)
                                  }}
                                  className={`text-[12px] hover:scale-110 active:scale-95 transition-transform flex items-center gap-0.5 ${
                                    isResonance ? 'animate-pulse text-amber-600' : ''
                                  }`}
                                >
                                  {react.resonance_type === 'om' ? '🕉️' :
                                   react.resonance_type === 'love' ? '💚' :
                                   react.resonance_type === 'chime' ? '🔔' :
                                   react.resonance_type === 'water' ? '💧' : react.emoji}
                                </button>
                              )
                            })}
                          </div>
                        )}
                      </div>

                      {/* Hover timestamp + read receipt */}
                      <div className={`flex items-center gap-1.5 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'flex-row-reverse mr-1' : 'ml-1'}`}>
                        <span className="text-[10px] text-outline uppercase font-semibold">{formatTime(msg.created_at)}</span>
                        {isMe && (
                          <span className="material-symbols-outlined text-[14px] text-outline" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {msg.read_at ? 'done_all' : 'check_circle'}
                          </span>
                        )}
                      </div>

                      {/* Context menu */}
                      <AnimatePresence>
                        {showContextMenu && !isOpt && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: 8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: 8 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                            className={`absolute top-full mt-2 ${isMe ? 'right-0' : 'left-0'} bg-surface border-[0.5px] border-outline-variant shadow-xl rounded-2xl p-2.5 z-50 min-w-[200px]`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Standard emoji reactions */}
                            <div className="flex justify-between p-2 mb-2 bg-surface-container-low rounded-xl">
                              {EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReact(msg.id, emoji)}
                                  className={`text-lg hover:scale-125 transition-transform ${myReaction?.emoji === emoji ? 'bg-primary/10 rounded-md scale-110' : ''}`}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>

                            {/* Zen resonance reactions */}
                            <div className="flex justify-between p-2 mb-2 bg-amber-500/5 rounded-xl border border-amber-500/10">
                              {[
                                { key: 'om', label: '🕉️', name: 'om' },
                                { key: 'love', label: '💚', name: 'love' },
                                { key: 'chime', label: '🔔', name: 'chime' },
                                { key: 'water', label: '💧', name: 'water' }
                              ].map(res => (
                                <button
                                  key={res.key}
                                  type="button"
                                  onClick={async () => {
                                    setActiveMenuId(null)
                                    playResonanceSound(res.key as any)
                                    const { reactWithResonance } = await import('@/app/(main)/actions-zen')
                                    const resDB = await reactWithResonance(msg.id, res.key as any)
                                    if (resDB.success) {
                                      toast.success(`Resonance sent: ${res.key}`, { icon: '🔔' })
                                      fetchMessages()
                                    }
                                  }}
                                  className="text-lg hover:scale-125 transition-transform"
                                  title={`Zen ${res.name}`}
                                >
                                  {res.label}
                                </button>
                              ))}
                            </div>

                            <button
                              onClick={() => { setReplyingTo(msg); setActiveMenuId(null); inputRef.current?.focus() }}
                              className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-primary hover:bg-surface-container-low rounded-lg flex items-center gap-3"
                            >
                              <Reply size={14} /> Reply
                            </button>

                            {isMe && (
                              <button
                                onClick={() => handleDelete(msg.id)}
                                className="w-full text-left px-4 py-2.5 text-[13px] font-medium text-error hover:bg-error/10 rounded-lg flex items-center gap-3"
                              >
                                <Trash2 size={14} /> Unsend
                              </button>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}

          {/* Empty state */}
          {displayedMessages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-8 py-32 text-center">
              {/* Avatar — large, warm, editorial */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-[#e8e2d9] shadow-[0_4px_24px_rgba(0,0,0,0.06)] bg-[#eee9e2]">
                  {recipient.avatar_url ? (
                    <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="w-full h-full flex items-center justify-center font-display text-4xl font-semibold text-[#6b5f52]">
                      {recipient.display_name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                {/* Subtle ring around avatar */}
                <div className="absolute inset-0 rounded-full ring-[3px] ring-[#eeeff4] ring-offset-[3px] ring-offset-transparent" />
              </div>

              {/* Name + tagline */}
              <div className="space-y-2">
                <p className="font-display text-[32px] font-medium italic tracking-tight text-[#1a1a2e] leading-none">
                  {recipient.display_name}
                </p>
                <div className="w-8 h-[0.5px] bg-[#c8c9d4] mx-auto my-3" />
                <p className="text-[12px] text-[#8a8a9a] font-medium uppercase tracking-[0.2em]">
                  Start a mindful, quiet conversation.
                </p>
              </div>

              {/* E2E notice */}
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#e2e3ea] border border-[#dddee6]">
                <span className="material-symbols-outlined text-[14px] text-[#8a8a9a]">lock</span>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8a8a9a]">End-to-end encrypted</span>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 max-w-[70%] items-end">
              <div className="w-8 h-8 rounded-full bg-surface-container flex-shrink-0 overflow-hidden border border-outline-variant/30">
                {recipient.avatar_url ? (
                  <img src={recipient.avatar_url} alt="" className="w-full h-full object-cover grayscale opacity-70" />
                ) : (
                  <span className="w-full h-full flex items-center justify-center font-bold text-xs text-primary">
                    {recipient.display_name?.[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div className={`${normalStyles.bubbleReceived} px-5 py-4 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-[50px]`}>
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-outline rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} className="h-1" />
        </div>
      </div>

      {/* Scroll-to-bottom button */}
      <AnimatePresence>
        {showScrollBtn && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => scrollToBottom()}
            className="absolute bottom-28 right-6 z-30 w-9 h-9 rounded-full bg-primary text-on-primary shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all"
          >
            <ChevronLeft size={18} className="rotate-[-90deg]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── REPLY / IMAGE PREVIEW BAR ──────────────────────────────────── */}
      <AnimatePresence>
        {(imagePreview || replyingTo) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="px-6 md:px-16 pb-2 z-20"
          >
            <div className={`max-w-3xl mx-auto flex items-center justify-between p-3.5 px-5 rounded-2xl border-[0.5px] shadow-sm ${isVanishMode ? 'bg-[#121214] border-purple-500/20 text-white' : 'bg-surface border-outline-variant'}`}>
              {replyingTo && (
                <div className="flex flex-col">
                  <span className="text-[10px] font-label-caps uppercase tracking-widest text-primary font-bold mb-0.5 flex items-center gap-1.5">
                    <Reply size={10} /> Replying to {replyingTo.sender_id === currentUserId ? 'yourself' : recipient.display_name}
                  </span>
                  <span className="text-[12px] text-on-surface-variant italic truncate max-w-[280px]">
                    {replyingTo.content || 'Attachment'}
                  </span>
                </div>
              )}
              {imagePreview && (
                <div className="flex items-center gap-4">
                  <img src={imagePreview} alt="preview" className="h-12 w-12 rounded-xl object-cover border-[0.5px] border-outline-variant/30" />
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sendAsViewOnce}
                      onChange={(e) => setSendAsViewOnce(e.target.checked)}
                      className="rounded border-outline-variant text-primary focus:ring-primary h-3.5 w-3.5 bg-transparent"
                    />
                    <span className="text-[10px] uppercase tracking-wider font-bold text-primary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">lock</span> View Once
                    </span>
                  </label>
                </div>
              )}
              <button
                onClick={() => { setImageFile(null); setImagePreview(null); setReplyingTo(null); setSendAsViewOnce(false) }}
                className="w-7 h-7 bg-surface-container border-[0.5px] border-outline-variant rounded-full flex items-center justify-center text-outline hover:text-error transition-all ml-4"
              >
                <X size={13} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── INPUT BAR ──────────────────────────────────────────────────── */}
      <footer 
        className={`px-6 md:px-16 pb-6 pt-3 sticky bottom-0 w-full z-30 bg-[#eeeff4]`}
      >
        {areFriends === false ? (
          <div className="max-w-3xl mx-auto flex items-center justify-center py-4 px-6 bg-surface rounded-full border-[0.5px] border-outline-variant">
            <p className="text-[13px] font-semibold text-on-surface-variant">You must be connected to send messages.</p>
          </div>
        ) : (
          <>
            <form
              onSubmit={handleSend}
              className={`flex items-center gap-2 rounded-full border-[0.5px] p-1.5 pl-4 pr-1.5 transition-colors duration-300 relative overflow-hidden ${st.inputForm}`}
            >
              {/* Recording overlay */}
              <AnimatePresence>
                {isRecording && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-primary/10 flex items-center justify-between px-6 z-10 rounded-full"
                  >
                    <div className="flex items-center gap-3 text-error font-medium animate-pulse">
                      <div className="w-2.5 h-2.5 bg-error rounded-full" />
                      <span className="text-sm font-ui-element">{formatRecTime(recordingTime)}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="button" onClick={cancelRecording} className="text-sm font-bold text-on-surface-variant hover:text-error">Cancel</button>
                      <button type="button" onClick={stopRecording} className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center hover:opacity-90 active:scale-95 transition-all">
                        <Send size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <input type="file" accept="image/*" ref={fileInputRef} onChange={handleImageChange} className="hidden" />

              {/* Attach icon */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`transition-colors rounded-full hover:bg-surface-container p-1 mt-1 ${st.buttonIcon}`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add</span>
              </button>

              {/* Text input */}
              <input
                ref={inputRef}
                type="text"
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                placeholder={isWhisper ? 'Self-destructing whisper...' : 'Type a message...'}
                className={`flex-1 bg-transparent border-none focus:ring-0 font-body-md py-2 text-[15px] ${st.inputText}`}
              />

              {/* Right icons */}
              <div className="flex items-center gap-1.5">
                {!newMessage.trim() && !imageFile && (
                  <button
                    type="button"
                    onClick={startRecording}
                    className={`p-1.5 transition-colors rounded-full hover:bg-surface-container mt-1 ${st.buttonIcon}`}
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>mood</span>
                  </button>
                )}

                {/* Send button — always visible */}
                <button
                  type="submit"
                  disabled={isSending || (!newMessage.trim() && !imageFile)}
                  className="w-10 h-10 bg-primary text-on-primary rounded-full flex items-center justify-center hover:opacity-90 active:scale-95 transition-all disabled:opacity-30 shadow-sm"
                >
                  {isSending
                    ? <Loader2 size={16} className="animate-spin" />
                    : <span className="material-symbols-outlined" style={{ fontSize: '18px', fontVariationSettings: "'wght' 600" }}>arrow_upward</span>
                  }
                </button>
              </div>
            </form>

            {/* E2E footer text */}
            <p className="text-center text-[10px] text-outline mt-2 uppercase tracking-widest opacity-40 font-label-caps">
              End-to-End Encrypted
            </p>
          </>
        )}
      </footer>
    </div>
  )
}
