import { createClient } from '@/lib/supabase/server'
import { MessageSquare, Users } from 'lucide-react'
import Link from 'next/link'
import { ChatInterface } from '@/components/chat-interface'
import { redirect } from 'next/navigation'
import { NotificationBell } from '@/components/notification-bell'
import { OnlineDot } from '@/components/presence'
import { IntentionNotes } from '@/components/intention-notes'
import { MessagesSidebar } from '@/components/messages-sidebar'

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

  // Fetch all users with audit logs
  const { data: allUsers, error: allUsersError } = await supabase
    .from('users').select('id, username, display_name, avatar_url, intention_text, intention_expires_at').neq('id', user.id)

  console.log('--- AUDIT DEBUG LOGS: MESSAGES PAGE ---');
  console.log('Current User ID:', user.id);
  if (allUsersError) {
    console.error('ERROR FETCHING USERS from database:', allUsersError);
  } else {
    console.log(`Successfully fetched ${allUsers?.length || 0} users from database.`);
  }

  // Fetch accepted friend requests for the user with audit logs
  const { data: sentReqs, error: sentReqsError } = await supabase.from('friend_requests').select('receiver_id').eq('sender_id', user.id).eq('status', 'accepted')
  const { data: recReqs, error: recReqsError } = await supabase.from('friend_requests').select('sender_id').eq('receiver_id', user.id).eq('status', 'accepted')

  if (sentReqsError) console.error('Error fetching sent friend requests:', sentReqsError);
  if (recReqsError) console.error('Error fetching received friend requests:', recReqsError);

  console.log('Raw sent friend requests from DB:', sentReqs);
  console.log('Raw received friend requests from DB:', recReqs);

  const friendIds = new Set([
    ...(sentReqs || []).map(r => r.receiver_id),
    ...(recReqs || []).map(r => r.sender_id),
  ])

  console.log('Computed connected friend IDs:', Array.from(friendIds));

  const actualFriends = allUsers?.filter(u => friendIds.has(u.id)) || []
  console.log('Filtered connected friends:', actualFriends);
  console.log('----------------------------------------');

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
      .limit(1)

    const { data: fr2 } = await supabase
      .from('friend_requests')
      .select('status')
      .eq('sender_id', selectedRecipient.id)
      .eq('receiver_id', user.id)
      .eq('status', 'accepted')
      .limit(1)

    if ((fr1 && fr1.length > 0) || (fr2 && fr2.length > 0)) {
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
        <MessagesSidebar
          conversations={validConvos as any}
          friends={actualFriends}
          currentUserId={user.id}
          selectedUserId={recipientId}
        >
          {/* Intention Notes Bubble Row */}
          <div className="mb-4">
            <IntentionNotes 
              currentUserId={user.id} 
              currentUserProfile={profile as any} 
              connections={allUsers as any[] || []} 
            />
          </div>
        </MessagesSidebar>
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
