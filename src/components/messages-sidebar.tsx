'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, PenSquare, X, Trash2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { OnlineDot } from '@/components/presence'
import { searchFriendByEmail, deleteAllChats, deleteChatWithUser } from '@/app/(main)/actions'
import { createClient } from '@/lib/supabase/client'

interface Partner {
  id: string
  username: string | null
  display_name: string | null
  avatar_url: string | null
}

interface Conversation {
  partner: Partner
  lastMessage: {
    content: string | null
    image_url: string | null
    created_at: string
    sender_id: string
  } | null
  unreadCount: number
}

interface MessagesSidebarProps {
  conversations: Conversation[]
  friends: Partner[]          // all accepted connections (for compose)
  currentUserId: string
  selectedUserId?: string
  children?: React.ReactNode
}

function Avatar({ user, size = 12 }: { user: Partner; size?: number }) {
  const sz = `w-${size} h-${size}`
  return (
    <div className={`${sz} rounded-full overflow-hidden flex items-center justify-center bg-surface-container border-[0.5px] border-outline-variant shrink-0`}>
      {user.avatar_url ? (
        <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        <span className="text-sm font-bold text-primary">
          {user.display_name?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  )
}

function formatTime(d: string) {
  const date = new Date(d)
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  if (isToday) return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

export function MessagesSidebar({
  conversations,
  friends,
  currentUserId,
  selectedUserId,
  children,
}: MessagesSidebarProps) {
  const [query, setQuery] = useState('')
  const [showCompose, setShowCompose] = useState(false)
  const [emailSearchResult, setEmailSearchResult] = useState<Partner | null>(null)
  const [isDeletingAll, setIsDeletingAll] = useState(false)
  const router = useRouter()

  // Real-time updates for sidebar
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase.channel('sidebar-messages-changes')
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
      const msg = (payload.new || payload.old) as any
      if (msg && (msg.sender_id === currentUserId || msg.receiver_id === currentUserId)) {
        router.refresh()
      }
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [currentUserId, router])

  const handleDeleteAllChats = async () => {
    if (window.confirm("Are you sure you want to delete all chats? This will permanently remove all messages and cannot be undone.")) {
      setIsDeletingAll(true)
      try {
        const res = await deleteAllChats()
        if (res.success) {
          router.push('/messages')
          router.refresh()
        } else {
          alert(res.error || "Failed to delete chats.")
        }
      } catch (err) {
        console.error(err)
        alert("An unexpected error occurred.")
      } finally {
        setIsDeletingAll(false)
      }
    }
  }

  const handleDeleteSingleChat = async (partnerId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm("Delete this conversation? This cannot be undone.")) {
      await deleteChatWithUser(partnerId)
      router.refresh()
      if (selectedUserId === partnerId) {
        router.push('/messages')
      }
    }
  }

  // Filter existing conversations by search query
  const filteredConvos = useMemo(() => {
    if (!query.trim()) return conversations
    const q = query.toLowerCase()
    let list = conversations.filter(c =>
      c.partner.display_name?.toLowerCase().includes(q) ||
      c.partner.username?.toLowerCase().includes(q)
    )
    if (emailSearchResult) {
      const matchInConvo = conversations.find(c => c.partner.id === emailSearchResult.id)
      if (matchInConvo && !list.some(c => c.partner.id === emailSearchResult.id)) {
        list = [...list, matchInConvo]
      }
    }
    return list
  }, [conversations, query, emailSearchResult])

  // Filter friends for compose picker (exclude already-in-convos? No — show all)
  const filteredFriends = useMemo(() => {
    if (!query.trim()) return friends
    const q = query.toLowerCase()
    return friends.filter(f =>
      f.display_name?.toLowerCase().includes(q) ||
      f.username?.toLowerCase().includes(q)
    )
  }, [friends, query])

  const handleQueryChange = async (val: string) => {
    setQuery(val)
    if (val.includes('@') && val.includes('.')) {
      const match = await searchFriendByEmail(val.trim())
      setEmailSearchResult(match)
    } else {
      setEmailSearchResult(null)
    }
  }

  const resetQuery = () => {
    setQuery('')
    setEmailSearchResult(null)
  }

  function startChat(userId: string) {
    setShowCompose(false)
    resetQuery()
    router.push(`/messages?u=${userId}`)
  }

  // If query matches someone in friends but not in existing convos, show them in search
  const friendsNotInConvos = useMemo(() => {
    if (!query.trim()) return []
    const existingIds = new Set(conversations.map(c => c.partner.id))
    let list = filteredFriends.filter(f => !existingIds.has(f.id))
    if (emailSearchResult && !existingIds.has(emailSearchResult.id)) {
      if (!list.some(f => f.id === emailSearchResult.id)) {
        list = [...list, emailSearchResult]
      }
    }
    return list
  }, [query, filteredFriends, conversations, emailSearchResult])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-6 border-b-[0.5px] border-outline-variant shrink-0 bg-surface">
        <h2 className="font-headline-sm text-2xl text-primary">Conversations</h2>
        <div className="flex items-center gap-2">
          {conversations.length > 0 && (
            <button
              onClick={handleDeleteAllChats}
              disabled={isDeletingAll}
              title="Delete all chats"
              className="w-9 h-9 rounded-full flex items-center justify-center text-outline/60 hover:bg-error/10 hover:text-error transition-all cursor-pointer disabled:opacity-50"
            >
              <Trash2 size={16} strokeWidth={2} className={isDeletingAll ? 'animate-pulse' : ''} />
            </button>
          )}
          <button
            id="compose-new-message-btn"
            onClick={() => { setShowCompose(true); resetQuery() }}
            title="New conversation"
            className="w-9 h-9 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container hover:text-primary transition-all cursor-pointer"
          >
            <PenSquare size={18} strokeWidth={2} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto hide-scrollbar py-4 flex flex-col">
        {children}

        {/* Search Bar */}
        <div className="px-4 mb-4 shrink-0">
          <div className="relative">
            <Search size={15} strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline opacity-50" />
            <input
              id="message-search-input"
              value={query}
              onChange={e => handleQueryChange(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-xl pl-9 pr-8 py-2.5 text-[13px] font-medium placeholder:text-outline/50 focus:ring-0 focus:outline-none transition-all"
              placeholder="Search conversations..."
              type="text"
            />
            {query && (
              <button onClick={resetQuery} className="absolute right-3 top-1/2 -translate-y-1/2 text-outline hover:text-primary transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Horizontal Active/Connected Users Row */}
        {!query.trim() && friends.length > 0 && (
          <div className="px-4 mb-4 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2.5 px-1">Connected</p>
            <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-1.5 pt-0.5">
              {friends.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => startChat(friend.id)}
                  className="flex flex-col items-center gap-1.5 shrink-0 select-none cursor-pointer group"
                >
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-surface-container border-[0.5px] border-outline-variant group-hover:scale-105 transition-all">
                      {friend.avatar_url ? (
                        <img src={friend.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-primary">
                          {friend.display_name?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <OnlineDot userId={friend.id} className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-surface" />
                  </div>
                  <span className="text-[10px] font-semibold text-on-surface-variant/90 max-w-[56px] truncate group-hover:text-primary transition-colors text-center">
                    {friend.display_name?.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search: show matching friends not yet in convos */}
        {query.trim() && friendsNotInConvos.length > 0 && (
          <div className="px-4 mb-2 shrink-0">
            <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 px-1">Connections</p>
            <div className="space-y-1">
              {friendsNotInConvos.map(friend => (
                <button
                  key={friend.id}
                  onClick={() => startChat(friend.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-surface-container-low transition-all cursor-pointer text-left"
                >
                  <div className="relative">
                    <Avatar user={friend} size={11} />
                    <OnlineDot userId={friend.id} className="absolute bottom-0 right-0 w-2.5 h-2.5 border-2 border-surface" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-primary">{friend.display_name}</p>
                    <p className="text-[11px] text-on-surface-variant">@{friend.username}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Existing Conversations */}
        {filteredConvos.length > 0 && (
          <div className="space-y-0.5 px-3">
            {query.trim() && <p className="text-[10px] font-black uppercase tracking-widest text-outline mb-2 px-1">Recent</p>}
            {filteredConvos.map(conv => {
              const { partner, lastMessage, unreadCount } = conv
              const isActive = partner.id === selectedUserId
              const lastText = lastMessage
                ? (lastMessage.image_url && !lastMessage.content ? '📷 Photo' : lastMessage.content)
                : 'Start a quiet thread'
              const isFromMe = lastMessage?.sender_id === currentUserId

              return (
                <div key={partner.id} className="relative overflow-hidden rounded-2xl group">
                  {/* Background Delete Button */}
                  <div className="absolute inset-y-0 right-0 w-16 bg-error flex items-center justify-center rounded-2xl">
                    <button 
                      onClick={(e) => handleDeleteSingleChat(partner.id, e)}
                      className="text-white w-full h-full flex items-center justify-center cursor-pointer"
                      title="Delete chat"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Foreground Content */}
                  <motion.div
                    drag="x"
                    dragConstraints={{ left: -64, right: 0 }}
                    dragElastic={0.1}
                    className="relative z-10 bg-surface rounded-2xl"
                  >
                    <Link
                      href={`/messages?u=${partner.id}`}
                      className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 cursor-pointer
                        ${isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container-low'}`}
                    >
                      <div className="relative shrink-0">
                        <Avatar user={partner} size={11} />
                        <OnlineDot userId={partner.id} className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-surface" />
                      </div>

                      <div className="flex-1 min-w-0 pointer-events-none">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className={`text-[13px] font-semibold truncate ${isActive ? 'text-primary' : unreadCount > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {partner.display_name}
                          </span>
                          {lastMessage && (
                            <span className="text-[10px] text-outline font-medium shrink-0 ml-2">
                              {formatTime(lastMessage.created_at)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          <p className={`text-[12px] truncate flex-1 ${unreadCount > 0 ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                            {isFromMe && <span className="font-medium opacity-60">You: </span>}
                            {lastText}
                          </p>
                          {unreadCount > 0 && (
                            <span className="shrink-0 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-on-primary text-[10px] font-black flex items-center justify-center">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                </div>
              )
            })}
          </div>
        )}

        {/* Empty state */}
        {filteredConvos.length === 0 && !query.trim() && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4 py-12">
            <div className="w-14 h-14 rounded-full bg-surface-container flex items-center justify-center">
              <PenSquare size={22} strokeWidth={1.5} className="text-outline opacity-40" />
            </div>
            <div>
              <p className="font-semibold text-primary text-[14px]">No conversations yet</p>
              <p className="text-[12px] text-on-surface-variant mt-1">Tap the compose button above to start a quiet thread with a connection.</p>
            </div>
            <button
              onClick={() => setShowCompose(true)}
              className="mt-2 px-5 py-2.5 rounded-full bg-primary text-on-primary text-[12px] font-bold uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all cursor-pointer"
            >
              New Conversation
            </button>
          </div>
        )}

        {/* No search results */}
        {query.trim() && filteredConvos.length === 0 && friendsNotInConvos.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-10 px-6 text-center">
            <p className="text-[13px] font-semibold text-primary">No results for "{query}"</p>
            <p className="text-[11px] text-on-surface-variant">Try searching by name or username.</p>
          </div>
        )}
      </div>

      {/* ── COMPOSE MODAL ─────────────────────────────────── */}
      <AnimatePresence>
        {showCompose && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm"
              onClick={() => setShowCompose(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[60] w-[380px] max-w-[calc(100vw-32px)] bg-card border border-border-mint rounded-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.1)] overflow-hidden"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border-mint/50">
                <h3 className="font-bold text-foreground text-[16px]">New Conversation</h3>
                <button
                  onClick={() => setShowCompose(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-foreground/50 hover:bg-surface-container hover:text-foreground transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Search inside compose */}
              <div className="px-4 py-3 border-b border-border-mint/30">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-outline opacity-50" />
                  <input
                    id="compose-search-input"
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search connections..."
                    className="w-full bg-surface-container-low rounded-xl pl-9 pr-3 py-2.5 text-[13px] font-medium border-none focus:ring-0 focus:outline-none placeholder:text-outline/50"
                  />
                </div>
              </div>

              {/* Friends list */}
              <div className="max-h-[340px] overflow-y-auto hide-scrollbar py-2">
                {filteredFriends.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-[13px] font-semibold text-foreground/70">
                      {query ? `No connections matching "${query}"` : 'No connections yet'}
                    </p>
                    {!query && (
                      <p className="text-[11px] text-foreground/40 mt-1">Connect with people on the People page first.</p>
                    )}
                  </div>
                ) : (
                  filteredFriends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => startChat(friend.id)}
                      className="w-full flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors cursor-pointer text-left"
                    >
                      <div className="relative">
                        <Avatar user={friend} size={11} />
                        <OnlineDot userId={friend.id} className="absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-card" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-foreground truncate">{friend.display_name}</p>
                        <p className="text-[11px] text-foreground/50">@{friend.username}</p>
                      </div>
                      <span className="text-[11px] font-bold text-primary uppercase tracking-wider opacity-0 group-hover:opacity-100">
                        Message →
                      </span>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
