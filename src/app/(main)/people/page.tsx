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
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      <header className="w-full bg-background sticky top-0 z-20 border-b border-border-mint/50 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="px-6 pt-10 pb-4 max-w-[800px] mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus2 size={24} className="text-foreground" strokeWidth={2} />
            <h1 className="text-[17px] font-bold text-foreground">Find People</h1>
            {incomingRequests.length > 0 && (
              <span className="ml-auto h-6 min-w-[24px] px-2 rounded-full bg-foreground text-[11px] font-bold text-white flex items-center justify-center">
                {incomingRequests.length}
              </span>
            )}
          </div>

          <form method="GET" className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40 pointer-events-none"
            />
            <input
              name="q"
              defaultValue={query || ''}
              autoComplete="off"
              placeholder="Search by name or @username…"
              className="w-full pl-11 pr-5 py-3 bg-card border border-border-mint rounded-full text-[14px] font-medium text-foreground outline-none focus:border-border-mint focus:ring-1 focus:ring-[#BCE3D8] transition-all placeholder:text-foreground/40 shadow-sm"
            />
          </form>
        </div>
      </header>

      <main className="px-6 space-y-6 pt-6 max-w-[800px] mx-auto w-full">
        {/* ── Incoming requests ─────────────────────────────── */}
        {incomingRequests.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-[14px] font-bold text-foreground/60 uppercase tracking-widest px-2">
              Friend Requests ({incomingRequests.length})
            </h3>
            <div className="bg-card border border-border-mint rounded-[24px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)] divide-y divide-[#BCE3D8]/30">
              {incomingRequests.map((req: any) => {
                const sender = incomingProfiles.find((p) => p.id === req.sender_id)
                if (!sender) return null
                return (
                  <div
                    key={req.id}
                    className="flex items-center gap-4 p-5 bg-background/20 transition-all"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-border-mint shrink-0 flex items-center justify-center">
                      {sender.avatar_url ? (
                        <img src={sender.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[16px] font-bold text-foreground">
                          {sender.display_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate">{sender.display_name}</p>
                      <p className="text-[13px] text-foreground/60 font-medium truncate">@{sender.username}</p>
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
          <h3 className="text-[14px] font-bold text-foreground/60 uppercase tracking-widest px-2">
            {trimmed ? `Results for "${trimmed}"` : 'People on Serenity'}
          </h3>

          {people.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border-mint border-dashed rounded-[24px] space-y-3">
              <Users2 size={32} className="mx-auto text-foreground/30" strokeWidth={2} />
              <p className="text-[14px] text-foreground/60 font-medium">No people found</p>
            </div>
          ) : (
            <div className="bg-card border border-border-mint rounded-[24px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)] divide-y divide-[#BCE3D8]/30">
              {people.map((person: any) => {
                const { status, requestId } = getStatus(person.id)
                return (
                  <div
                    key={person.id}
                    className="flex items-center gap-4 p-5 hover:bg-background/30 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-border-mint shrink-0 flex items-center justify-center group-hover:scale-105 transition-transform">
                      {person.avatar_url ? (
                        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[16px] font-bold text-foreground">
                          {person.display_name?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-bold text-foreground truncate group-hover:text-foreground/80 transition-colors">
                        {person.display_name}
                      </p>
                      <p className="text-[13px] text-foreground/60 font-medium truncate">@{person.username}</p>
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
      </main>
    </div>
  )
}
