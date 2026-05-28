import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { UserPlus2, Search, Users2 } from 'lucide-react'
import { FriendRequestButton, FriendStatus } from '@/components/friend-request-button'
import { getAllFriendRequestsForUser } from '@/app/(main)/actions'

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q: query } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // All friend requests involving me
  const allRequests = await getAllFriendRequestsForUser()

  // Incoming pending (where I am the receiver)
  const incomingRequests = allRequests.filter(
    (r: any) => r.receiver_id === user.id && r.status === 'pending'
  )

  // Build status map: otherId -> { status, requestId, isSender }
  type ReqInfo = { status: string; requestId: string; isSender: boolean }
  const requestMap: Record<string, ReqInfo> = {}
  allRequests.forEach((r: any) => {
    const otherId = r.sender_id === user.id ? r.receiver_id : r.sender_id
    requestMap[otherId] = {
      status: r.status,
      requestId: r.id,
      isSender: r.sender_id === user.id,
    }
  })

  // Fetch incoming senders' profiles
  const incomingSenderIds = incomingRequests.map((r: any) => r.sender_id)
  let incomingProfiles: any[] = []
  if (incomingSenderIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .in('id', incomingSenderIds)
    incomingProfiles = data || []
  }

  // Fetch people to display
  let people: any[] = []
  const trimmed = query?.trim() || ''
  if (trimmed.length >= 1) {
    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .or(`username.ilike.%${trimmed}%,display_name.ilike.%${trimmed}%`)
      .neq('id', user.id)
      .limit(25)
    people = data || []
  } else {
    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .neq('id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)
    people = data || []
  }

  function getStatus(targetId: string): { status: FriendStatus; requestId?: string } {
    const req = requestMap[targetId]
    if (!req) return { status: 'none' }
    if (req.status === 'accepted') return { status: 'accepted', requestId: req.requestId }
    if (req.status === 'declined') return { status: 'declined', requestId: req.requestId }
    if (req.isSender) return { status: 'pending_sent', requestId: req.requestId }
    return { status: 'pending_received', requestId: req.requestId }
  }

  return (
    <div className="pb-32 md:pb-8 min-h-screen bg-transparent relative overflow-x-hidden">
      {/* Ambient */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Sticky header + search */}
      <header className="sticky top-0 z-10 bg-background/40 backdrop-blur-2xl border-b border-border/20">
        <div className="px-5 md:px-10 pt-5 pb-4 max-w-2xl mx-auto">
          <div className="flex items-center gap-2.5 mb-4">
            <UserPlus2 size={20} className="text-primary/80" strokeWidth={1.5} />
            <h1 className="text-xl font-light tracking-tight">Find People</h1>
            {incomingRequests.length > 0 && (
              <span className="ml-auto h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </div>

          {/* Search bar */}
          <form method="GET" className="relative">
            <Search
              size={15}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 pointer-events-none"
            />
            <input
              name="q"
              defaultValue={query || ''}
              autoComplete="off"
              placeholder="Search by name or @username…"
              className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/30 rounded-full text-sm font-light outline-none focus:border-primary/40 transition-all placeholder:text-muted-foreground/40"
            />
          </form>
        </div>
      </header>

      <div className="px-4 md:px-10 py-6 max-w-2xl mx-auto space-y-8">
        {/* ── Incoming requests ─────────────────────────────── */}
        {incomingRequests.length > 0 && (
          <section className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
              Friend Requests ({incomingRequests.length})
            </p>
            <div className="space-y-2">
              {incomingRequests.map((req: any) => {
                const sender = incomingProfiles.find((p) => p.id === req.sender_id)
                if (!sender) return null
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-3 p-4 bg-primary/5 border border-primary/15 rounded-2xl"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border/20 shrink-0 flex items-center justify-center">
                      {sender.avatar_url ? (
                        <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-light text-muted-foreground">
                          {sender.display_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{sender.display_name}</p>
                      <p className="text-xs text-muted-foreground/60 truncate">@{sender.username}</p>
                    </div>
                    <FriendRequestButton
                      targetUserId={sender.id}
                      initialStatus="pending_received"
                      requestId={req.id}
                    />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* ── People list ───────────────────────────────────── */}
        <section className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">
            {trimmed ? `Results for "${trimmed}"` : 'People on Serenity'}
          </p>

          {people.length === 0 ? (
            <div className="text-center py-20 space-y-3">
              <Users2 size={40} className="mx-auto text-muted-foreground/25 stroke-[1.25]" />
              <p className="text-muted-foreground/50 font-light text-sm">No people found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {people.map((person: any) => {
                const { status, requestId } = getStatus(person.id)
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-3 p-4 bg-background/30 border border-border/20 rounded-2xl hover:border-border/50 transition-all group"
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-muted border border-border/20 shrink-0 flex items-center justify-center">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-sm font-light text-muted-foreground">
                          {person.display_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                        {person.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground/55 truncate">@{person.username}</p>
                    </div>
                    <FriendRequestButton
                      targetUserId={person.id}
                      initialStatus={status}
                      requestId={requestId}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
