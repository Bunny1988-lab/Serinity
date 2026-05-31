import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/notification-bell'
import { OnlineDot } from '@/components/presence'
import { IntentionNotes } from '@/components/intention-notes'

export default async function MessagesPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u: recipientId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('display_name, avatar_url, intention_text, intention_expires_at').eq('id', user.id).single()
  const firstName = profile?.display_name?.split(' ')[0] || 'There'

  const { data: sentTo } = await supabase.from('messages').select('receiver_id').eq('sender_id', user.id)
  const { data: receivedFrom } = await supabase.from('messages').select('sender_id').eq('receiver_id', user.id)

  const partnerIds = Array.from(new Set([
    ...(sentTo || []).map(m => m.receiver_id),
    ...(receivedFrom || []).map(m => m.sender_id),
  ]))

  const { data: allUsers } = await supabase
    .from('users').select('id, username, display_name, avatar_url, intention_text, intention_expires_at').neq('id', user.id)

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

  const selectedRecipient = allUsers?.find(u => u.id === recipientId)

  let areFriends = false
  if (selectedRecipient) {
    // Check both directions separately to avoid nested AND/OR PostgREST parsing issues
    const { data: fr1 } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('sender_id', user.id)
      .eq('receiver_id', selectedRecipient.id)
      .eq('status', 'accepted')
      .maybeSingle()

    const { data: fr2 } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('sender_id', selectedRecipient.id)
      .eq('receiver_id', user.id)
      .eq('status', 'accepted')
      .maybeSingle()

    if (fr1 || fr2) {
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
    <div className="flex h-screen overflow-hidden w-full">
      {/* ── LEFT SIDEBAR ─────────────────────────────────────────── */}
      <section className={`
        flex flex-col w-full md:w-[380px] shrink-0
        border-r-[0.5px] border-outline-variant bg-surface
        ${selectedRecipient ? 'hidden md:flex' : 'flex'}
      `}>
        {/* Header */}
        <header className="h-20 flex items-center px-8 border-b-[0.5px] border-outline-variant shrink-0 bg-surface">
          <h2 className="font-headline-sm text-2xl text-primary">Conversations</h2>
        </header>

        <div className="flex-1 overflow-y-auto py-4 hide-scrollbar">
          {/* Intention Notes Bubble Row */}
          <IntentionNotes 
            currentUserId={user.id} 
            currentUserProfile={profile as any} 
            connections={allUsers as any[] || []} 
          />

          {/* Search */}
          <div className="px-6 mb-6">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline opacity-50">search</span>
              <input className="w-full bg-surface-container-low border-none rounded-xl pl-10 py-3 font-ui-element placeholder:text-outline/50 focus:ring-0" placeholder="Search quiet threads..." type="text"/>
            </div>
          </div>

          {/* Chat Items */}
          <div className="space-y-1">
            {validConvos.map(conv => {
              if (!conv) return null
              const { partner, lastMessage, unreadCount } = conv
              const isActive = partner.id === recipientId
              const lastText = lastMessage
                ? (lastMessage.image_url && !lastMessage.content ? '📷 Photo' : lastMessage.content)
                : 'Start a conversation'
              const isFromMe = lastMessage?.sender_id === user.id

              return (
                <div key={partner.id} className="px-4">
                  <Link
                    href={`/messages?u=${partner.id}`}
                    className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300
                      ${isActive
                        ? 'bg-surface-container-high'
                        : 'hover:bg-surface-container-low'
                      }
                    `}
                  >
                    <div className="relative shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center">
                        {partner.avatar_url
                          ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover grayscale opacity-80" />
                          : <div className="w-full h-full bg-surface-container border-[0.5px] border-outline-variant flex items-center justify-center text-sm font-bold text-primary">{partner.display_name?.[0]?.toUpperCase()}</div>
                        }
                      </div>
                      <OnlineDot userId={partner.id} className="absolute bottom-0 right-0 w-3 h-3 border-2 border-surface" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className={`font-ui-element text-[14px] ${isActive ? 'font-bold text-primary' : 'text-on-surface-variant'}`}>
                          {partner.display_name}
                        </span>
                        {lastMessage && (
                          <span className="text-[10px] text-outline uppercase font-semibold">
                            {formatTime(lastMessage.created_at)}
                          </span>
                        )}
                      </div>
                      <p className={`text-body-md line-clamp-1 text-[14px] ${isActive ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {isFromMe && <span className="font-medium">You: </span>}
                        {lastText}
                      </p>
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* ── MAIN CHAT PANEL ──────────────────────────────────────── */}
      <section className={`flex-1 flex flex-col bg-surface-container-lowest relative min-w-0 ${!selectedRecipient ? 'hidden md:flex' : 'flex'}`}>
        {selectedRecipient ? (
          <ChatInterface currentUserId={user.id} recipient={selectedRecipient} areFriends={areFriends} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <span className="material-symbols-outlined text-[64px] text-outline opacity-20 mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>mail</span>
            <h2 className="font-display text-3xl font-medium text-primary italic mb-2">Select a Conversation</h2>
            <p className="text-on-surface-variant font-body-md max-w-sm">Choose an existing connection from the list or search to start a new quiet thread.</p>
          </div>
        )}
      </section>
    </div>
  )
}
