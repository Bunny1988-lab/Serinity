import { createClient } from '@/lib/supabase/server'
import { MessageSquare, UserCircle, PenSquare } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { redirect } from 'next/navigation'
import { OnlineDot } from '@/components/presence'

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u: recipientId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: sentTo } = await supabase.from('messages').select('receiver_id').eq('sender_id', user.id)
  const { data: receivedFrom } = await supabase.from('messages').select('sender_id').eq('receiver_id', user.id)

  const partnerIds = Array.from(new Set([
    ...(sentTo || []).map(m => m.receiver_id),
    ...(receivedFrom || []).map(m => m.sender_id),
  ]))

  const { data: allUsers } = await supabase
    .from('users').select('id, username, display_name, avatar_url').neq('id', user.id)

  const conversations = await Promise.all(
    partnerIds.map(async (partnerId) => {
      const partner = allUsers?.find(u => u.id === partnerId)
      if (!partner) return null
      const { data: lastMsgs } = await supabase
        .from('messages')
        .select('content, image_url, created_at, sender_id')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: false }).limit(1)
      const { count: unread } = await supabase
        .from('messages').select('id', { count: 'exact', head: true })
        .eq('sender_id', partnerId).eq('receiver_id', user.id).is('read_at', null)
      return { partner, lastMessage: lastMsgs?.[0] || null, unreadCount: unread || 0 }
    })
  )

  const validConvos = conversations
    .filter(Boolean)
    .sort((a, b) => (b?.lastMessage?.created_at || '').localeCompare(a?.lastMessage?.created_at || ''))

  const newPeople = allUsers?.filter(u => !partnerIds.includes(u.id)) || []
  const selectedRecipient = allUsers?.find(u => u.id === recipientId)

  let areFriends = false
  if (selectedRecipient) {
    const { data: friendship } = await supabase
      .from('friend_requests')
      .select('status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedRecipient.id}),and(sender_id.eq.${selectedRecipient.id},receiver_id.eq.${user.id})`)
      .eq('status', 'accepted')
      .maybeSingle()
    
    if (friendship) {
      areFriends = true
    }
  }

  function timeAgo(d: string) {
    const diff = Date.now() - new Date(d).getTime()
    const m = Math.floor(diff / 60000)
    if (m < 1) return 'now'
    if (m < 60) return `${m}m`
    const h = Math.floor(m / 60)
    if (h < 24) return `${h}h`
    const days = Math.floor(h / 24)
    if (days < 7) return `${days}d`
    return new Date(d).toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const hasConvos = validConvos.length > 0

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-transparent">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-full md:w-[300px] lg:w-[320px] shrink-0
        border-r border-border/10 bg-background/25 backdrop-blur-md
        ${selectedRecipient ? 'hidden md:flex' : 'flex'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4 shrink-0">
          <h1 className="text-lg font-light tracking-tight text-foreground/90">Messages</h1>
          {newPeople.length > 0 && (
            <Link
              href={`/messages?u=${newPeople[0].id}`}
              className="w-7 h-7 rounded-full bg-primary/5 hover:bg-primary/10 flex items-center justify-center text-primary/80 transition-all hover:scale-105"
              title="New message"
            >
              <PenSquare size={13} strokeWidth={1.5} />
            </Link>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto pb-24 md:pb-6 scrollbar-none">
          {!hasConvos ? (
            <div className="flex flex-col items-center justify-center gap-5 py-16 px-6 text-center">
              {/* Stacked ghost bubbles illustration */}
              <div className="relative w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center border border-primary/10">
                <MessageSquare size={20} className="text-primary/45" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-normal text-foreground/80">No conversations yet</p>
                <p className="text-[11px] text-muted-foreground/50 leading-relaxed max-w-[170px] mx-auto font-light">
                  Send a message to a connection from the list below.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {validConvos.map(conv => {
                if (!conv) return null
                const { partner, lastMessage, unreadCount } = conv
                const isActive = partner.id === recipientId
                const lastText = lastMessage
                  ? (lastMessage.image_url && !lastMessage.content ? '📷 Photo' : lastMessage.content)
                  : 'Start a conversation'
                const isFromMe = lastMessage?.sender_id === user.id

                return (
                  <Link
                    key={partner.id}
                    href={`/messages?u=${partner.id}`}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 border
                      ${isActive
                        ? 'bg-primary/10 border-primary/20 dark:bg-primary/5 dark:border-primary/10 text-primary shadow-2xs'
                        : 'bg-transparent border-transparent hover:bg-muted/20 dark:hover:bg-white/[0.01]'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-muted flex items-center justify-center border border-border/10 shadow-3xs">
                        {partner.avatar_url
                          ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-sm font-light text-muted-foreground">{partner.display_name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <OnlineDot userId={partner.id} className="absolute bottom-0 right-0 w-2.5 h-2.5 border border-background shadow-xs" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-1.5 mb-0.5">
                        <p className={`text-[13px] truncate tracking-wide ${unreadCount > 0 ? 'font-normal text-foreground' : 'font-light text-foreground/80'}`}>
                          {partner.display_name}
                        </p>
                        {lastMessage && (
                          <span className={`text-[9px] shrink-0 font-light tracking-wider uppercase ${unreadCount > 0 ? 'text-primary' : 'text-muted-foreground/40'}`}>
                            {timeAgo(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-xs truncate flex-1 ${unreadCount > 0 ? 'text-foreground/80 font-normal' : 'text-muted-foreground/50 font-light'}`}>
                          {isFromMe && <span className="text-muted-foreground/35 font-light">You: </span>}
                          {lastText}
                        </p>
                        {unreadCount > 0 && (
                          <span className="h-4 min-w-[16px] px-1 rounded-full bg-primary text-[8px] font-bold text-primary-foreground flex items-center justify-center shrink-0 shadow-2xs">
                            {unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* New conversation / People */}
          {newPeople.length > 0 && (
            <div className="mt-6 px-4">
              <p className="text-[9px] uppercase tracking-widest text-muted-foreground/40 font-light mb-2 px-1">Connections</p>
              <div className="space-y-0.5">
                {newPeople.map(u => (
                  <Link
                    key={u.id}
                    href={`/messages?u=${u.id}`}
                    className={`
                      flex items-center gap-3 px-2 py-2 rounded-xl transition-all duration-150 border border-transparent
                      ${u.id === recipientId 
                        ? 'bg-muted/40 border-border/10' 
                        : 'hover:bg-muted/20 dark:hover:bg-white/[0.01]'
                      }
                    `}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-muted flex items-center justify-center shrink-0 border border-border/10">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-xs font-light text-muted-foreground">{u.display_name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-light text-foreground/80 truncate tracking-wide">{u.display_name}</p>
                      <p className="text-[10px] text-muted-foreground/45 truncate font-light">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CHAT PANEL ──────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 ${!selectedRecipient ? 'hidden md:flex items-center justify-center bg-background/5' : 'flex flex-col'}`}>
        {selectedRecipient ? (
          <ChatInterface currentUserId={user.id} recipient={selectedRecipient} areFriends={areFriends} />
        ) : (
          <div className="flex flex-col items-center gap-6 text-center px-8 max-w-sm">
            <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center text-primary/45 border border-primary/10 shadow-3xs">
              <MessageSquare size={36} strokeWidth={1} className="animate-pulse" />
            </div>

            <div className="space-y-2">
              <p className="font-light text-base tracking-tight text-foreground/85">Your Private Sanctuary</p>
              <p className="text-xs text-muted-foreground/45 leading-relaxed font-light">
                Select an intimate connection to begin. Serenity secures all messages locally and prevents tracking or metadata profiling.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
