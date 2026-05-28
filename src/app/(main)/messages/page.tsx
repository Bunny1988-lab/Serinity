import { createClient } from '@/lib/supabase/server'
import { MessageSquare, PenSquare, Search, Users } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/notification-bell'

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u: recipientId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('display_name, avatar_url').eq('id', user.id).single()
  const firstName = profile?.display_name?.split(' ')[0] || 'There'

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

  function formatTime(d: string) {
    const date = new Date(d)
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  }

  // Active friends mock
  const activeFriends = validConvos.slice(0, 4).map(c => c?.partner)

  return (
    <div className="h-[100dvh] flex overflow-hidden bg-[#E0F2F1]">
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <div className={`
        flex flex-col w-full md:w-[380px] shrink-0
        border-r border-teal-900/10 bg-[#E0F2F1]
        ${selectedRecipient ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <header className="px-6 py-4 flex items-center justify-between shrink-0 sticky top-0 bg-[#E0F2F1]/80 backdrop-blur-md z-10">
          <div className="w-10 h-10 rounded-full bg-white/50 border border-white/60 overflow-hidden flex items-center justify-center shrink-0 shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-teal-800">{profile?.display_name?.[0]}</span>
            )}
          </div>
          
          <h1 className="text-xl font-medium tracking-wide text-slate-800">Messages</h1>
          
          <NotificationBell />
        </header>

        <div className="flex-1 overflow-y-auto pb-24 md:pb-6 scrollbar-none px-5">
          {/* Hero Greeting */}
          <div className="flex items-center gap-3 mt-2 mb-6">
            <div className="w-20 h-20 shrink-0">
              <img src="/dog_mascot.png" alt="Mascot" className="w-full h-full object-contain" />
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl rounded-tl-none p-3 shadow-sm border border-white/80">
              <p className="text-sm font-medium text-slate-800">Hi {firstName}, you have new messages!</p>
            </div>
          </div>

          {/* Active Now */}
          {activeFriends.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800 text-sm">Active Now</h3>
                <span className="text-[10px] text-green-600 flex items-center gap-1 font-medium uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> active
                </span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {activeFriends.map(friend => {
                  if (!friend) return null;
                  return (
                    <Link href={`/messages?u=${friend.id}`} key={friend.id} className="flex flex-col items-center gap-1.5 shrink-0">
                      <div className="relative">
                        <div className="w-14 h-14 rounded-full bg-white/60 border border-white/80 flex items-center justify-center shadow-sm overflow-hidden">
                          {friend.avatar_url ? (
                            <img src={friend.avatar_url} alt={friend.display_name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-slate-600 font-medium">{friend.display_name[0]}</span>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-[#E0F2F1] rounded-full"></span>
                      </div>
                      <p className="text-xs font-medium text-slate-800">{friend.display_name}</p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Conversations List */}
          <div className="space-y-3 mb-8">
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
                  className={`flex items-center gap-3 p-3 rounded-2xl transition-all duration-200 border
                    ${isActive
                      ? 'bg-white/80 border-white shadow-sm'
                      : 'bg-transparent border-transparent hover:bg-white/40'
                    }
                  `}
                >
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/60 flex items-center justify-center border border-white shadow-sm">
                      {partner.avatar_url
                        ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm font-medium text-slate-600">{partner.display_name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                  </div>

                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[15px] font-semibold text-slate-800 truncate">
                        {partner.display_name}
                      </p>
                      {lastMessage && (
                        <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap ml-2">
                          {formatTime(lastMessage.created_at)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-[13px] truncate flex-1 ${unreadCount > 0 ? 'text-slate-800 font-medium' : 'text-slate-500'}`}>
                        {isFromMe && <span className="text-slate-400">You: </span>}
                        {lastText}
                      </p>
                      {unreadCount > 0 && (
                        <span className="w-5 h-5 rounded-full bg-amber-400 text-[10px] font-bold text-white flex items-center justify-center shrink-0 shadow-sm">
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {/* Your Chat Rooms */}
          <div>
            <h3 className="font-semibold text-slate-800 text-sm mb-3">Your Chat Rooms</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link href="/circles" className="bg-white/60 hover:bg-white/80 border border-white/80 rounded-2xl p-3 flex flex-col gap-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-teal-100/50 flex items-center justify-center text-teal-700">
                  <MessageSquare size={14} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Team Huddle</p>
                  <p className="text-[10px] text-slate-500">Private chats</p>
                </div>
              </Link>
              <Link href="/circles" className="bg-white/60 hover:bg-white/80 border border-white/80 rounded-2xl p-3 flex flex-col gap-2 transition-colors">
                <div className="w-8 h-8 rounded-full bg-amber-100/50 flex items-center justify-center text-amber-600">
                  <Users size={14} strokeWidth={2} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Mindful Chat</p>
                  <p className="text-[10px] text-slate-500">Group chats</p>
                </div>
              </Link>
            </div>
          </div>
          
        </div>
      </div>

      {/* ── MAIN CHAT PANEL ──────────────────────────────────────── */}
      <div className={`flex-1 min-w-0 ${!selectedRecipient ? 'hidden md:flex items-center justify-center bg-white/30' : 'flex flex-col'}`}>
        {selectedRecipient ? (
          <ChatInterface currentUserId={user.id} recipient={selectedRecipient} areFriends={areFriends} />
        ) : (
          <div className="flex flex-col items-center gap-4 text-center px-8 max-w-sm">
            <div className="w-24 h-24">
              <img src="/dog_mascot.png" alt="Mascot" className="w-full h-full object-contain opacity-50 grayscale" />
            </div>
            <p className="font-medium text-lg text-slate-800">Your Private Sanctuary</p>
            <p className="text-sm text-slate-500">
              Select a conversation to begin chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
