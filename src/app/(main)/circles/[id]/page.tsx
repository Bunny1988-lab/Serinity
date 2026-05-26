import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, UserMinus, UserPlus, Crown, Trash2, Shield } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { SubmitButton } from '@/components/submit-button'
import { AddMemberSearch } from '@/components/add-member-search'

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
    <div className="pb-32 md:pb-8 min-h-screen bg-transparent relative overflow-hidden">
      {/* Decorative Blur Background Circles */}
      <div className="absolute top-[-10%] left-[10%] w-[500px] h-[300px] rounded-full bg-primary/3 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[350px] h-[350px] rounded-full bg-amber-500/2 blur-[130px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/30 backdrop-blur-2xl border-b border-border/20 px-6 py-4 flex items-center gap-4">
        <Link
          href="/circles"
          className="text-muted-foreground hover:text-foreground transition-colors p-2.5 -ml-2 rounded-full hover:bg-muted/40 border border-transparent hover:border-border/30 shadow-2xs"
        >
          <ArrowLeft size={18} strokeWidth={1.75} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-light tracking-tight text-foreground truncate">{circle.name}</h1>
          <p className="text-[10px] text-muted-foreground/80 uppercase tracking-widest font-semibold mt-0.5">
            {members?.length || 0} trusted member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
        {isAdmin && (
          <span className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 rounded-full uppercase shadow-2xs">
            <Crown size={12} className="fill-amber-500/20" />
            Admin
          </span>
        )}
      </header>

      <div className="max-w-2xl mx-auto p-6 md:p-8 space-y-8">

        {/* ── Admin Panel ─────────────────────────────── */}
        {isAdmin && (
          <section className="bg-gradient-to-br from-amber-500/[0.04] via-background/40 to-background/20 backdrop-blur-md border border-amber-500/20 rounded-[2rem] p-6 space-y-6 shadow-xs relative overflow-hidden group">
            <div className="absolute right-[-20px] top-[-20px] w-28 h-28 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/8 transition-colors duration-500" />
            
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
              <Shield size={16} strokeWidth={2} />
              <h2 className="text-[10px] font-bold tracking-[0.25em] uppercase">Admin Controls</h2>
            </div>

            {/* Rename */}
            <div className="space-y-2">
              <label className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-wider">Rename Circle</label>
              <form action={renameCircle} className="flex gap-2">
                <input
                  name="name"
                  defaultValue={circle.name}
                  required
                  className="flex-1 h-10 bg-background/50 border border-border/40 rounded-full px-4 text-xs font-light focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all placeholder:text-muted-foreground/30"
                />
                <SubmitButton className="rounded-full px-5 h-10 text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium hover:scale-105 active:scale-95 transition-all">Save</SubmitButton>
              </form>
            </div>

            {/* Delete */}
            <div className="pt-4 border-t border-border/20">
              <p className="text-xs text-muted-foreground/80 font-light mb-4">
                Permanently delete this circle and remove all its members. This action cannot be undone.
              </p>
              <form action={deleteCircle}>
                <SubmitButton
                  className="rounded-full px-5 h-10 text-xs font-medium bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 hover:border-transparent hover:scale-105 active:scale-95 transition-all"
                  pendingText="Deleting..."
                >
                  <Trash2 size={13} className="mr-1.5" />
                  Delete Circle
                </SubmitButton>
              </form>
            </div>
          </section>
        )}

        {/* ── Current Members ──────────────────────────── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
              Active Members ({members?.length || 0})
            </h3>
          </div>

          {members?.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-border/40 rounded-[2rem] bg-background/10 backdrop-blur-xs">
              <p className="text-xs text-muted-foreground/60 font-light">No custom members inside this circle yet. Add users below.</p>
            </div>
          ) : (
            <div className="bg-background/25 backdrop-blur-md border border-border/30 rounded-[2rem] overflow-hidden shadow-2xs divide-y divide-border/20">
              {/* Admin (owner) row — always first */}
              <div className="flex items-center gap-4 p-4.5 bg-amber-500/[0.03] transition-all">
                <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-amber-400/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                  {(circle.owner as any)?.avatar_url
                    ? <img src={(circle.owner as any).avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-sm font-semibold text-amber-600">{(circle.owner as any)?.display_name?.[0]?.toUpperCase()}</span>
                  }
                  <span className="absolute bottom-0 right-0 bg-amber-500 rounded-full p-1 border border-background">
                    <Crown size={8} className="text-white fill-white" />
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">{(circle.owner as any)?.display_name}</p>
                    <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Owner</span>
                  </div>
                  <p className="text-xs text-muted-foreground/60 truncate">@{(circle.owner as any)?.username}</p>
                </div>
              </div>

              {members?.map((member: any) => (
                <div key={member.user_id} className="flex items-center gap-4 p-4.5 hover:bg-muted/20 transition-all duration-300">
                  <div className="w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-primary/5 border border-border/40 flex items-center justify-center shrink-0">
                    {member.users?.avatar_url
                      ? <img src={member.users.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-sm font-semibold text-primary/60">{member.users?.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{member.users?.display_name}</p>
                    <p className="text-xs text-muted-foreground/60 truncate">@{member.users?.username}</p>
                  </div>
                  
                  {isAdmin && (
                    <form action={removeMember}>
                      <input type="hidden" name="userId" value={member.user_id} />
                      <button
                        type="submit"
                        title="Remove from circle"
                        className="text-muted-foreground/50 hover:text-rose-500 transition-colors p-2.5 rounded-full hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 shadow-2xs cursor-pointer"
                      >
                        <UserMinus size={15} strokeWidth={1.75} />
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
          <section className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
              Add Friends to Circle
            </h3>
            <div className="bg-background/20 backdrop-blur-md border border-border/30 rounded-[2rem] p-6 shadow-2xs">
              <AddMemberSearch circleId={circleId} excludeIds={excludeIds} />
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
