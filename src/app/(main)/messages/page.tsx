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
    <div className="h-[100dvh] flex overflow-hidden bg-background">

      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-full md:w-[320px] shrink-0
        border-r border-border/40
        ${selectedRecipient ? 'hidden md:flex' : 'flex'}
      `}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <h1 className="text-xl font-semibold tracking-tight">Messages</h1>
          {newPeople.length > 0 && (
            <Link
              href={`/messages?u=${newPeople[0].id}`}
              className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
              title="New message"
            >
              <PenSquare size={15} strokeWidth={2} />
            </Link>
          )}
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto pb-20 md:pb-4">
          {!hasConvos ? (
            <div className="flex flex-col items-center justify-center gap-5 py-14 px-8 text-center">
              {/* Stacked ghost bubbles illustration */}
              <div className="relative w-20 h-20">
                <div className="absolute bottom-0 left-0 w-14 h-9 rounded-2xl rounded-bl-sm bg-muted/60 border border-border/30" />
                <div className="absolute top-0 right-0 w-14 h-9 rounded-2xl rounded-tr-sm bg-primary/10 border border-primary/20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <MessageSquare size={22} className="text-primary/40" strokeWidth={1.5} />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground/70">No conversations yet</p>
                <p className="text-xs text-muted-foreground/50 leading-relaxed max-w-[180px] mx-auto">
                  Send a message to someone from the list below
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
                      flex items-center gap-3 px-3 py-3 rounded-2xl transition-all duration-150
                      ${isActive
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/60 active:bg-muted/80'
                      }
                    `}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                        {partner.avatar_url
                          ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-lg font-medium text-primary/60">{partner.display_name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <OnlineDot userId={partner.id} className="absolute bottom-0 right-0 w-3 h-3" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2 mb-0.5">
                        <p className={`text-sm truncate ${unreadCount > 0 ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'}`}>
                          {partner.display_name}
                        </p>
                        {lastMessage && (
                          <span className={`text-[11px] shrink-0 ${unreadCount > 0 ? 'text-primary font-medium' : 'text-muted-foreground/50'}`}>
                            {timeAgo(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={`text-xs truncate ${unreadCount > 0 ? 'text-foreground/70 font-medium' : 'text-muted-foreground/60 font-light'}`}>
                        {isFromMe && <span className="text-muted-foreground/40">You: </span>}
                        {lastText}
                      </p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}

          {/* New conversation */}
          {newPeople.length > 0 && (
            <div className="mt-4 px-4">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-semibold mb-2 px-1">People</p>
              <div className="space-y-0.5">
                {newPeople.map(u => (
                  <Link
                    key={u.id}
                    href={`/messages?u=${u.id}`}
                    className={`flex items-center gap-3 px-2 py-2 rounded-xl transition-colors hover:bg-muted/50 ${u.id === recipientId ? 'bg-muted/50' : ''}`}
                  >
                    <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm font-medium text-muted-foreground">{u.display_name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground/80 truncate">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground/50 truncate">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CHAT PANEL ──────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 ${!selectedRecipient ? 'hidden md:flex items-center justify-center bg-muted/20' : 'flex flex-col'}`}>
        {selectedRecipient ? (
          <ChatInterface currentUserId={user.id} recipient={selectedRecipient} />
        ) : (
          <div className="flex flex-col items-center gap-6 text-center px-8 max-w-xs">
            {/* Animated chat preview illustration */}
            <div className="w-full space-y-3">
              {/* Incoming bubble */}
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                <div className="px-4 py-2.5 bg-muted/70 border border-border/30 rounded-2xl rounded-bl-sm text-xs text-muted-foreground/50 font-light max-w-[60%]">
                  How are you feeling today?
                </div>
              </div>
              {/* Outgoing bubble */}
              <div className="flex justify-end">
                <div className="px-4 py-2.5 bg-primary/20 rounded-2xl rounded-br-sm text-xs text-primary/60 font-light max-w-[55%]">
                  Better now that you're here 🌿
                </div>
              </div>
              {/* Incoming bubble */}
              <div className="flex items-end gap-2">
                <div className="w-7 h-7 rounded-full bg-muted shrink-0" />
                <div className="px-4 py-2.5 bg-muted/70 border border-border/30 rounded-2xl rounded-bl-sm text-xs text-muted-foreground/50 font-light max-w-[50%]">
                  I'm always here ✨
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="font-semibold text-foreground/50 text-sm tracking-tight">Your private space</p>
              <p className="text-xs text-muted-foreground/40 leading-relaxed">
                Select a conversation to begin. Messages are private and stay between you and your circle.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
