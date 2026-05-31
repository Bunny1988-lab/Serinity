import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Settings, ChevronLeft, BookOpen, Clock, Users } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { FriendRequestButton } from '@/components/friend-request-button'
import { MemoryCabinetViewer } from '@/components/memory-cabinet-viewer'


// Streak helper
function calculateStreak(entries: { created_at: string }[]): number {
  if (!entries.length) return 0
  const uniqueDays = [...new Set(entries.map(e => new Date(e.created_at).toDateString()))]
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
  let streak = 0
  let expected = new Date()
  expected.setHours(0, 0, 0, 0)
  for (const dayStr of uniqueDays) {
    const day = new Date(dayStr)
    const diff = Math.round((expected.getTime() - day.getTime()) / (1000 * 60 * 60 * 24))
    if (diff <= 1) { streak++; expected = day } else break
  }
  return streak
}

export default async function ProfilePage({ searchParams }: { searchParams: Promise<{ u?: string }> }) {
  const { u: targetUserId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const isOwnProfile = !targetUserId || targetUserId === user.id
  const activeUserId = isOwnProfile ? user.id : targetUserId

  const { data: profile } = await supabase
    .from('users')
    .select('id, display_name, avatar_url, bio')
    .eq('id', activeUserId)
    .single()

  if (!profile) {
    redirect('/home')
  }

  // Fetch connection status if not own profile
  let friendShipStatus = null
  let requestId = undefined
  if (!isOwnProfile) {
    const { data: request } = await supabase
      .from('friend_requests')
      .select('id, sender_id, receiver_id, status')
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${targetUserId}),and(sender_id.eq.${targetUserId},receiver_id.eq.${user.id})`)
      .maybeSingle()

    if (request) {
      requestId = request.id
      if (request.status === 'accepted') friendShipStatus = 'accepted'
      else if (request.status === 'declined') friendShipStatus = 'declined'
      else if (request.sender_id === user.id) friendShipStatus = 'pending_sent'
      else friendShipStatus = 'pending_received'
    }
  }

  // Real journal entries — used for count, streak
  const { data: journalEntries } = isOwnProfile
    ? await supabase
        .from('journal_entries')
        .select('id, content, created_at, mood')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false })
        .limit(100)
    : { data: [] }

  // Real posts for the Signals grid
  const { data: posts } = await supabase
    .from('posts')
    .select('id, content, image_url, mood, created_at')
    .eq('author_id', activeUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  const journalCount = journalEntries?.length || 0
  const mindfulMinutes = journalCount * 5

  // Real connections count
  const { count: friendsCount } = await supabase
    .from('friend_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'accepted')
    .or(`sender_id.eq.${activeUserId},receiver_id.eq.${activeUserId}`)

  const firstName = profile?.display_name || 'User'
  const bio = profile?.bio || 'Nurturing growth, one step at a time.'

  return (
    <div className="flex flex-col min-h-[100dvh] w-full bg-background overflow-y-auto">
      <main className="pt-20 md:pt-32 pb-24 max-w-7xl mx-auto px-5 md:px-16 w-full">
        {/* Hero Header Section */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20 items-start">
          {/* Profile Image */}
          <div className="md:col-span-5 aspect-[4/5] overflow-hidden border-[0.5px] border-outline-variant">
            {profile?.avatar_url ? (
              <img
                alt={firstName}
                className="w-full h-full object-cover grayscale-[0.2] hover:scale-105 transition-transform duration-[2000ms] ease-out"
                src={profile.avatar_url}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-surface-container-low text-[120px] font-display text-primary">
                {firstName[0]}
              </div>
            )}
          </div>
          
          {/* Info & Stats */}
          <div className="md:col-span-7 pt-4">
            <div className="flex justify-between items-end mb-6">
              <div>
                <h2 className="font-display-lg text-5xl md:text-[64px] leading-tight mb-2 text-primary">
                  {profile?.display_name || 'User'}
                </h2>
                <p className="font-body-lg text-on-surface-variant italic font-serif">
                  Member
                </p>
              </div>
            </div>

            {/* Interaction Action Buttons for Other User's Profile */}
            {!isOwnProfile && (
              <div className="flex items-center gap-4 mb-8">
                <FriendRequestButton 
                  targetUserId={profile.id}
                  initialStatus={friendShipStatus}
                  requestId={requestId}
                />
                <Link 
                  href={`/messages?u=${profile.id}`}
                  className="py-2.5 px-6 bg-surface-container border-[0.5px] border-outline-variant hover:bg-surface-container-high text-[10px] font-label-caps uppercase tracking-[0.2em] font-bold text-primary flex items-center justify-center gap-2 transition-all active:scale-98"
                >
                  Message
                </Link>
              </div>
            )}

            <p className="font-body-lg text-lg max-w-xl mb-12 text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {bio}
            </p>
            
            {/* Stats Bar */}
            <div className="flex gap-16 border-t-[0.5px] border-b-[0.5px] border-outline-variant py-10">
              <div className="flex flex-col">
                <span className="font-display-lg text-[40px] text-primary">{posts?.length || 0}</span>
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-bold">Posts</span>
              </div>
              {isOwnProfile && (
                <div className="flex flex-col">
                  <span className="font-display-lg text-[40px] text-primary">{mindfulMinutes}</span>
                  <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-bold">Minutes</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-display-lg text-[40px] text-primary">{friendsCount || 0}</span>
                <span className="font-label-caps text-xs text-on-surface-variant uppercase tracking-widest font-bold">Connections</span>
              </div>
            </div>
          </div>
        </section>

        {/* Memory Scrapbooks drawer */}
        <section className="mb-20">
          <MemoryCabinetViewer profileUserId={activeUserId} isOwnProfile={isOwnProfile} />
        </section>

        {/* Signal Feed Tabs */}
        <section className="mb-12">
          <div className="flex gap-12 border-b-[0.5px] border-outline-variant pb-4 overflow-x-auto whitespace-nowrap">
            <button className="font-label-caps text-xs uppercase tracking-widest text-primary font-bold border-b border-primary pb-4 -mb-[17px]">
              Latest Signals
            </button>
            <button className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant font-bold hover:text-primary transition-colors pb-4 -mb-[17px]">
              Archives
            </button>
            <button className="font-label-caps text-xs uppercase tracking-widest text-on-surface-variant font-bold hover:text-primary transition-colors pb-4 -mb-[17px]">
              Curations
            </button>
          </div>
        </section>

        {/* Signals Grid (Dynamic) */}
        {posts && posts.length > 0 ? (
          <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {posts.map((post: any, i: number) => {
              // Assign sizes sequentially based on index to create a bento-like grid
              let colSpan = "md:col-span-4"
              let aspect = "aspect-square"
              let type = "image"
              
              if (!post.image_url) {
                type = "text"
              } else if (i === 0) {
                colSpan = "md:col-span-8"
                aspect = "aspect-video"
              } else if (i === 1) {
                colSpan = "md:col-span-4"
                aspect = "aspect-[3/4]"
              }

              if (type === "text") {
                return (
                  <div key={post.id} className={`${colSpan} p-10 bg-surface-container-low flex flex-col justify-between border-[0.5px] border-outline-variant`}>
                    <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>format_quote</span>
                    <p className="font-headline-sm text-2xl font-medium italic leading-relaxed text-primary my-8 line-clamp-4">
                      "{post.content}"
                    </p>
                    <span className="font-label-caps text-xs font-bold text-on-surface-variant uppercase tracking-widest">
                      {new Date(post.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                )
              }

              return (
                <div key={post.id} className={`${colSpan} group relative overflow-hidden ${aspect} border-[0.5px] border-outline-variant bg-surface-container-low`}>
                  <img
                    alt="Post visual"
                    className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 ${i > 2 ? 'grayscale group-hover:grayscale-0' : ''}`}
                    src={post.image_url}
                  />
                  {i === 0 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-12">
                      <span className="font-label-caps text-xs text-white mb-2 uppercase tracking-[0.2em] font-bold">Featured</span>
                      <h3 className="font-headline-sm text-3xl font-medium text-white italic">"{post.content.slice(0, 50)}..."</h3>
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        ) : (
          <div className="text-center py-32 border-[0.5px] border-outline-variant bg-surface-container-lowest">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-4">image</span>
            <p className="font-headline-md text-xl text-primary italic">No signals yet.</p>
            <p className="font-body-md text-on-surface-variant mt-2">Your posts will appear here.</p>
          </div>
        )}
      </main>
    </div>
  )
}
