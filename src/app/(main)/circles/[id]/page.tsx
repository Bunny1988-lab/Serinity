import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, UserMinus, UserPlus, Crown, Trash2, Shield } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SubmitButton } from '@/components/submit-button'

export default async function CircleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch circle details + owner profile
  const { data: circle } = await supabase
    .from('circles')
    .select('*, owner:users!circles_owner_id_fkey(id, display_name, username, avatar_url)')
    .eq('id', circleId)
    .single()

  if (!circle || circle.owner_id !== user.id) {
    redirect('/circles')
  }

  const isAdmin = circle.owner_id === user.id

  // Fetch circle members with their profiles
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id, added_at, users(id, username, display_name, avatar_url)')
    .eq('circle_id', circleId)

  // Fetch all users not yet in circle (to add)
  const memberIds = members?.map(m => m.user_id) || []
  const excludeIds = [...memberIds, user.id]
  const { data: otherUsers } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(30)

  // ── Server Actions ────────────────────────────────────────────────────────

  async function removeMember(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const userId = formData.get('userId') as string
    await supabase.from('circle_members').delete().match({ circle_id: circleId, user_id: userId })
    revalidatePath(`/circles/${circleId}`)
  }

  async function addMember(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const userId = formData.get('userId') as string
    await supabase.from('circle_members').insert({ circle_id: circleId, user_id: userId })
    revalidatePath(`/circles/${circleId}`)
  }

  async function renameCircle(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const name = formData.get('name') as string
    if (!name?.trim()) return
    await supabase.from('circles').update({ name: name.trim() }).eq('id', circleId)
    revalidatePath(`/circles/${circleId}`)
    revalidatePath('/circles')
  }

  async function deleteCircle() {
    'use server'
    const supabase = await createClient()
    await supabase.from('circles').delete().eq('id', circleId)
    revalidatePath('/circles')
    redirect('/circles')
  }

  return (
    <div className="pb-24 md:pb-0 min-h-screen bg-background">

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-2xl border-b border-border/30 px-5 py-4 flex items-center gap-4">
        <Link
          href="/circles"
          className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted/50"
        >
          <ArrowLeft size={20} strokeWidth={1.5} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-light tracking-tight truncate">{circle.name}</h1>
          <p className="text-xs text-muted-foreground font-light">
            {members?.length || 0} member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-full">
            <Crown size={12} />
            Admin
          </span>
        )}
      </header>

      <div className="max-w-xl mx-auto p-5 space-y-8">

        {/* ── Admin Panel ─────────────────────────────── */}
        {isAdmin && (
          <section className="bg-amber-500/5 border border-amber-500/15 rounded-3xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-amber-600">
              <Shield size={16} strokeWidth={1.5} />
              <h2 className="text-sm font-semibold tracking-wide uppercase">Admin Controls</h2>
            </div>

            {/* Rename */}
            <div className="space-y-2">
              <label className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Rename Circle</label>
              <form action={renameCircle} className="flex gap-2">
                <input
                  name="name"
                  defaultValue={circle.name}
                  required
                  className="flex-1 h-10 bg-background border border-border/60 rounded-full px-4 text-sm font-light focus:outline-none focus:border-primary/50 transition-colors"
                />
                <SubmitButton className="rounded-full px-5 h-10 text-sm">Save</SubmitButton>
              </form>
            </div>

            {/* Delete */}
            <div className="pt-2 border-t border-border/20">
              <p className="text-xs text-muted-foreground font-light mb-3">
                Permanently delete this circle and all its members. This cannot be undone.
              </p>
              <form action={deleteCircle}>
                <SubmitButton
                  className="rounded-full px-5 h-10 text-sm bg-destructive/90 hover:bg-destructive text-destructive-foreground border-0"
                  pendingText="Deleting..."
                >
                  <Trash2 size={14} className="mr-1.5" />
                  Delete Circle
                </SubmitButton>
              </form>
            </div>
          </section>
        )}

        {/* ── Current Members ──────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 px-1">
            Members · {members?.length || 0}
          </h3>

          {members?.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl">
              <p className="text-sm text-muted-foreground font-light">No members yet. Add people below.</p>
            </div>
          ) : (
            <div className="bg-background/60 border border-border/40 rounded-2xl divide-y divide-border/30 overflow-hidden">
              {/* Admin (owner) row — always first */}
              <div className="flex items-center gap-3 p-4 bg-amber-500/5">
                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-amber-400/30 to-amber-600/20 flex items-center justify-center shrink-0">
                  {(circle.owner as any)?.avatar_url
                    ? <img src={(circle.owner as any).avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-semibold text-amber-600">{(circle.owner as any)?.display_name?.[0]?.toUpperCase()}</span>
                  }
                  <span className="absolute -bottom-0.5 -right-0.5 bg-amber-500 rounded-full p-0.5">
                    <Crown size={8} className="text-white" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{(circle.owner as any)?.display_name} <span className="text-[11px] text-amber-600 font-semibold ml-1">Admin</span></p>
                  <p className="text-xs text-muted-foreground truncate">@{(circle.owner as any)?.username}</p>
                </div>
              </div>

              {members?.map((member: any) => (
                <div key={member.user_id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                    {member.users?.avatar_url
                      ? <img src={member.users.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-semibold text-primary/60">{member.users?.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{member.users?.display_name}</p>
                    <p className="text-xs text-muted-foreground truncate">@{member.users?.username}</p>
                  </div>
                  {isAdmin && (
                    <form action={removeMember}>
                      <input type="hidden" name="userId" value={member.user_id} />
                      <button
                        type="submit"
                        title="Remove from circle"
                        className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10"
                      >
                        <UserMinus size={16} strokeWidth={1.5} />
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Add People ───────────────────────────────── */}
        {isAdmin && (
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/70 px-1">
              Add People
            </h3>

            {!otherUsers || otherUsers.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border/50 rounded-2xl">
                <p className="text-sm text-muted-foreground font-light">Everyone is already in this circle.</p>
              </div>
            ) : (
              <div className="bg-background/60 border border-border/40 rounded-2xl divide-y divide-border/30 overflow-hidden">
                {otherUsers.map((u: any) => (
                  <div key={u.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center shrink-0">
                      {u.avatar_url
                        ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-sm font-semibold text-muted-foreground">{u.display_name?.[0]?.toUpperCase()}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                    </div>
                    <form action={addMember}>
                      <input type="hidden" name="userId" value={u.id} />
                      <button
                        type="submit"
                        title="Add to circle"
                        className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10"
                      >
                        <UserPlus size={16} strokeWidth={1.5} />
                      </button>
                    </form>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </div>
  )
}
