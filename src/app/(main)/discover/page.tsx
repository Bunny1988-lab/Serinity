import { createClient } from '@/lib/supabase/server'
import { Search, Settings, ChevronLeft, X, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { FriendRequestButton } from '@/components/friend-request-button'
import { ShareProfileButton } from '@/components/share-profile-button'

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u: targetUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch actual public posts with images
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, image_url, mood, visibility, created_at, users:author_id (display_name, avatar_url)')
    .not('image_url', 'is', null)
    .order('created_at', { ascending: false })
    .limit(10)

  // Fetch some text-only posts for quotes
  const { data: textPosts } = await supabase
    .from('posts')
    .select('id, content, created_at, users:author_id (display_name)')
    .is('image_url', null)
    .order('created_at', { ascending: false })
    .limit(4)

  // All real users (not self)
  const { data: allUsers } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, bio')
    .neq('id', user.id)
    .limit(20)

  // All friend requests sent/received
  const { data: sentRequests } = await supabase
    .from('friend_requests')
    .select('id, receiver_id, status')
    .eq('sender_id', user.id)

  const { data: receivedRequests } = await supabase
    .from('friend_requests')
    .select('id, sender_id, status')
    .eq('receiver_id', user.id)

  const sentMap = new Map(sentRequests?.map(r => [r.receiver_id, { status: r.status, id: r.id }]) || [])
  const receivedMap = new Map(receivedRequests?.map(r => [r.sender_id, { status: r.status, id: r.id }]) || [])

  const listUsers = allUsers || []

  function getStatus(targetId: string): { status: any; requestId?: string } {
    const sent = sentMap.get(targetId)
    if (sent) return { status: sent.status === 'accepted' ? 'accepted' : 'pending_sent', requestId: sent.id }
    const received = receivedMap.get(targetId)
    if (received) return { status: received.status === 'accepted' ? 'accepted' : 'pending_received', requestId: received.id }
    return { status: 'none' }
  }

  // If targetUserId is present, fetch their profile, posts, and connection details
  let targetProfile = null
  let targetPosts = null
  let targetFriendshipStatus = 'none'
  let targetRequestId = undefined

  if (targetUserId && targetUserId !== user.id) {
    const { data: profile } = await supabase
      .from('users')
      .select('id, display_name, avatar_url, bio')
      .eq('id', targetUserId)
      .single()
      
    if (profile) {
      targetProfile = profile
      
      // Fetch target user's posts
      const { data: tPosts } = await supabase
        .from('posts')
        .select('id, content, image_url, mood, created_at')
        .eq('author_id', targetUserId)
        .order('created_at', { ascending: false })
        .limit(10)
      targetPosts = tPosts

      // Fetch friendship request between logged-in user and target user
      const { data: request } = await supabase
        .from('friend_requests')
        .select('id, sender_id, receiver_id, status')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
        .maybeSingle()

      if (request) {
        targetRequestId = request.id
        if (request.status === 'accepted') targetFriendshipStatus = 'accepted'
        else if (request.status === 'declined') targetFriendshipStatus = 'declined'
        else if (request.sender_id === user.id) targetFriendshipStatus = 'pending_sent'
        else targetFriendshipStatus = 'pending_received'
      }
    }
  }

  // Combine posts into a layout array
  const layoutItems: any[] = []
  if (posts) {
    posts.forEach((post, i) => {
      layoutItems.push({ type: 'image', data: post, size: ['large', 'medium', 'medium', 'small'][i % 4] })
    })
  }
  if (textPosts) {
    textPosts.forEach(post => {
      layoutItems.push({ type: 'text', data: post, size: 'medium' })
    })
  }
  
  // Sort randomly for masonry feel
  layoutItems.sort(() => Math.random() - 0.5)

  return (
    <div className="w-full flex flex-col pb-32 min-h-screen bg-surface">
      <header className="md:hidden w-full flex justify-between items-center px-6 pt-12 pb-4 bg-surface/40 backdrop-blur-md sticky top-0 z-50 border-b-[0.5px] border-outline-variant mb-6">
        <Link href="/home" className="flex items-center justify-center w-10 h-10 hover:opacity-70 transition-opacity -ml-2">
          <ChevronLeft className="text-on-surface-variant hover:text-primary transition-colors" size={28} strokeWidth={2} />
        </Link>
        <h1 className="font-headline-sm text-2xl text-primary">Discover</h1>
        <div className="w-10"></div>
      </header>

      <header className="hidden md:flex fixed top-0 right-0 left-64 h-20 bg-surface/40 backdrop-blur-md justify-between items-center px-16 z-40">
        <div className="flex items-center space-x-4">
          <h2 className="font-headline-sm text-[24px] text-primary">Discover</h2>
        </div>
        <div className="flex items-center space-x-8">
          <div className="relative group">
            <input className="bg-transparent border-b-[0.5px] border-outline-variant py-2 pr-8 focus:outline-none focus:border-primary transition-colors font-ui-element text-sm w-64 text-primary" placeholder="Search the quiet..." type="text"/>
            <span className="material-symbols-outlined absolute right-0 top-2 text-on-surface-variant group-hover:text-primary transition-colors">search</span>
          </div>
          <div className="flex space-x-4 text-on-surface-variant">
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">notifications</span>
            <span className="material-symbols-outlined cursor-pointer hover:text-primary transition-colors">account_circle</span>
          </div>
        </div>
      </header>

      <section className="pt-6 md:pt-32 px-6 md:px-16 pb-20 max-w-7xl mx-auto w-full">
        
        <div className="mb-16">
          <div className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar">
            <button className="px-8 py-3 bg-primary text-on-primary font-label-caps whitespace-nowrap transition-transform duration-300 hover:scale-95 text-[12px] uppercase tracking-widest font-bold">All Inspirations</button>
            <button className="px-8 py-3 bg-white/40 backdrop-blur-md border-[0.5px] border-outline-variant text-primary font-label-caps whitespace-nowrap hover:bg-surface-container-low transition-all text-[12px] uppercase tracking-widest font-bold">Architecture</button>
            <button className="px-8 py-3 bg-white/40 backdrop-blur-md border-[0.5px] border-outline-variant text-primary font-label-caps whitespace-nowrap hover:bg-surface-container-low transition-all text-[12px] uppercase tracking-widest font-bold">Still Life</button>
            <button className="px-8 py-3 bg-white/40 backdrop-blur-md border-[0.5px] border-outline-variant text-primary font-label-caps whitespace-nowrap hover:bg-surface-container-low transition-all text-[12px] uppercase tracking-widest font-bold">Minimalism</button>
          </div>
        </div>

        {layoutItems.length > 0 ? (
          <div className="masonry-grid mb-16">
            {layoutItems.map((item, i) => {
              const className = `masonry-item-${item.size}`
              if (item.type === 'text') {
                return (
                  <div key={item.data.id} className={`${className} flex flex-col justify-center p-6 bg-surface-container border-[0.5px] border-outline-variant shadow-[0_0_30px_rgba(27,28,27,0.04)]`}>
                    <span className="material-symbols-outlined text-outline mb-6" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                    <blockquote className="font-headline-sm text-[20px] md:text-[24px] italic text-primary leading-relaxed font-medium">
                      "{item.data.content}"
                    </blockquote>
                    <cite className="mt-6 font-label-caps text-[12px] font-bold uppercase tracking-widest not-italic text-on-surface-variant">— {item.data.users?.display_name || 'Anonymous'}</cite>
                  </div>
                )
              }
              
              return (
                <div key={item.data.id} className={`${className} group relative overflow-hidden bg-white/40 backdrop-blur-md border-[0.5px] border-outline-variant transition-all duration-500 hover:scale-[1.01] shadow-[0_0_30px_rgba(27,28,27,0.04)]`}>
                  <img className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={item.data.content} src={item.data.image_url} />
                  
                  {item.size === 'large' ? (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6">
                      <p className="font-label-caps text-[12px] text-white mb-1 uppercase tracking-widest font-bold">Inspiration</p>
                      <h3 className="font-headline-sm text-xl font-medium text-white line-clamp-2">{item.data.content}</h3>
                    </div>
                  ) : item.size === 'medium' ? (
                    <div className="absolute top-4 left-4">
                      <span className="material-symbols-outlined text-primary bg-white/40 backdrop-blur-md p-2 rounded-full border-[0.5px] border-white/50">favorite</span>
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-24 border-[0.5px] border-outline-variant bg-surface-container-lowest mb-16">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">search</span>
            <p className="font-headline-md text-xl text-primary italic">Nothing to discover yet.</p>
            <p className="font-body-md text-on-surface-variant mt-2">Posts with images will appear here.</p>
          </div>
        )}

        <div className="mt-20">
          <h2 className="font-headline-sm text-[24px] text-primary mb-2">Community Connections</h2>
          <p className="text-on-surface-variant text-xs font-bold uppercase tracking-widest mb-8">Discover quiet profiles</p>
          
          {listUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listUsers.map(u => {
                const { status, requestId } = getStatus(u.id)
                return (
                  <div key={u.id} className="bg-surface-container-low border-[0.5px] border-outline-variant p-5 flex items-center justify-between shadow-sm hover:bg-surface-container hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-surface-container-lowest border-[0.5px] border-outline-variant flex items-center justify-center shrink-0">
                        {u.avatar_url
                          ? <img src={u.avatar_url} alt={u.display_name} className="w-full h-full object-cover grayscale opacity-90" />
                          : <span className="text-lg font-display font-bold text-primary">{u.display_name?.[0]?.toUpperCase()}</span>
                        }
                      </div>
                      <div className="min-w-0">
                        <Link href={`/discover?u=${u.id}`} className="text-sm font-bold text-primary truncate hover:underline block">
                          {u.display_name}
                        </Link>
                        <div className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold text-outline uppercase tracking-widest">
                          Connect
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 ml-4">
                      <FriendRequestButton
                        targetUserId={u.id}
                        initialStatus={status}
                        requestId={requestId}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-surface-container-low border-[0.5px] border-outline-variant">
              <p className="text-5xl mb-4 grayscale opacity-70">🌱</p>
              <p className="text-base font-bold text-primary">No one to discover yet</p>
              <p className="text-sm font-medium text-on-surface-variant mt-2 italic">Be the first to invite friends.</p>
            </div>
          )}
        </div>

      </section>

      {/* ─── DYNAMIC PROFILE DETAILS OVERLAY IN DISCOVER SECTION ─── */}
      {targetProfile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-surface border-[0.5px] border-outline-variant max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-6 md:p-8 border-b-[0.5px] border-outline-variant/30 flex justify-between items-center shrink-0">
              <span className="font-label-caps text-xs font-bold text-outline uppercase tracking-[0.2em] font-semibold">
                Discovering Profile
              </span>
              <Link
                href="/discover"
                className="w-10 h-10 bg-surface-container border-[0.5px] border-outline-variant rounded-full flex items-center justify-center text-on-surface-variant hover:text-primary transition-all active:scale-95"
              >
                <X size={18} />
              </Link>
            </div>

            {/* Profile Content */}
            <div className="flex-1 overflow-y-auto p-6 md:p-12 space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                {/* Avatar */}
                <div className="md:col-span-4 aspect-square overflow-hidden border-[0.5px] border-outline-variant bg-surface-container-low flex items-center justify-center">
                  {targetProfile.avatar_url ? (
                    <img src={targetProfile.avatar_url} alt="" className="w-full h-full object-cover grayscale-[0.2]" />
                  ) : (
                    <span className="text-[80px] font-display text-primary">{targetProfile.display_name?.[0]?.toUpperCase()}</span>
                  )}
                </div>

                {/* Details */}
                <div className="md:col-span-8 space-y-6 pt-2">
                  <div>
                    <h2 className="font-display-lg text-4xl text-primary mb-2 leading-none">
                      {targetProfile.display_name}
                    </h2>
                    <p className="font-body-lg text-on-surface-variant italic font-serif">Member</p>
                  </div>

                  <p className="font-body-lg text-base text-on-surface-variant leading-relaxed whitespace-pre-wrap max-w-xl">
                    {targetProfile.bio || 'Nurturing growth, one step at a time.'}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-4 border-t-[0.5px] border-outline-variant/30 flex-wrap">
                    <FriendRequestButton 
                      targetUserId={targetProfile.id}
                      initialStatus={targetFriendshipStatus}
                      requestId={targetRequestId}
                    />
                    <Link 
                      href={`/messages?u=${targetProfile.id}`}
                      className="py-2.5 px-6 bg-surface-container border-[0.5px] border-outline-variant hover:bg-surface-container-high text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary flex items-center justify-center gap-2 transition-all active:scale-98"
                    >
                      <MessageSquare size={12} />
                      Message
                    </Link>
                    <ShareProfileButton targetProfileId={targetProfile.id} />
                  </div>
                </div>
              </div>

              {/* Signals Tab Header */}
              <div className="border-b-[0.5px] border-outline-variant pb-4">
                <h3 className="font-label-caps text-xs uppercase tracking-widest text-primary font-bold">
                  Signals & Shared Thoughts
                </h3>
              </div>

              {/* Signals Grid */}
              {targetPosts && targetPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {targetPosts.map((post: any) => (
                    <div key={post.id} className="bg-surface-container-low border-[0.5px] border-outline-variant p-6 flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                      {post.image_url && (
                        <img src={post.image_url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-[0.08] pointer-events-none" />
                      )}
                      {post.mood && (
                        <span className="font-label-caps text-[9px] font-bold text-secondary uppercase tracking-widest mb-4">
                          Feeling {post.mood}
                        </span>
                      )}
                      <p className="font-headline-sm text-[16px] italic leading-relaxed text-primary mb-4 flex-1">
                        "{post.content}"
                      </p>
                      <span className="font-label-caps text-[9px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 border-[0.5px] border-outline-variant bg-surface-container-lowest">
                  <p className="font-headline-sm text-sm text-outline italic">No public signals shared yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
