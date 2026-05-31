import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, UserMinus, Crown, Trash2, Shield } from 'lucide-react'
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

  const { data: circle } = await supabase
    .from('circles')
    .select('*, owner:users!circles_owner_id_fkey(id, display_name, username, avatar_url)')
    .eq('id', circleId)
    .single()

  if (!circle || circle.owner_id !== user.id) {
    redirect('/circles')
  }

  const isAdmin = circle.owner_id === user.id

  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id, added_at, users(id, username, display_name, avatar_url)')
    .eq('circle_id', circleId)

  const memberIds = members?.map(m => m.user_id) || []
  const excludeIds = [...memberIds, user.id]
  const { data: otherUsers } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(30)

  async function removeMember(formData: FormData) {
    'use server'
    const supabase = await createClient()
    const userId = formData.get('userId') as string
    await supabase.from('circle_members').delete().match({ circle_id: circleId, user_id: userId })
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
    <div className="w-full flex flex-col min-h-screen bg-background pb-32">
      {/* ── HEADER ───────────────────────────────────────── */}
      <header className="w-full flex items-center px-6 pt-12 pb-4 max-w-[800px] mx-auto bg-transparent relative z-20">
        <Link href="/circles" className="active:scale-95 transition-transform duration-200 text-foreground">
          <ArrowLeft size={28} strokeWidth={2} />
        </Link>
        <div className="flex-1 flex flex-col items-center justify-center -ml-7">
          <h1 className="text-[17px] font-bold text-foreground truncate max-w-[200px]">{circle.name}</h1>
          <p className="text-[12px] font-bold text-foreground/60 mt-0.5 uppercase tracking-widest">
            {members?.length || 0} Member{members?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </header>

      <main className="px-6 space-y-6 max-w-[800px] mx-auto w-full">

        {/* ── Admin Controls ─────────────────────────────── */}
        {isAdmin && (
          <section className="bg-card border border-[#D4AF37]/40 rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)] space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-2 text-[#D4AF37]">
              <Shield size={18} strokeWidth={2.5} />
              <h2 className="text-[13px] font-bold tracking-widest uppercase">Admin Controls</h2>
            </div>

            {/* Rename */}
            <div className="space-y-2">
              <label className="text-[11px] text-foreground/60 font-bold uppercase tracking-wider">Rename Circle</label>
              <form action={renameCircle} className="flex gap-2">
                <input
                  name="name"
                  defaultValue={circle.name}
                  required
                  className="flex-1 bg-background border border-border-mint/50 rounded-full px-5 py-3 text-[14px] font-medium text-foreground focus:outline-none focus:border-[#D4AF37]/50 focus:ring-1 focus:ring-[#D4AF37]/30 transition-all placeholder:text-foreground/40"
                />
                <SubmitButton className="rounded-full px-6 text-[13px] bg-[#D4AF37] text-white font-bold hover:bg-[#D4AF37]/90 transition-all shadow-sm">
                  Save
                </SubmitButton>
              </form>
            </div>

            {/* Delete */}
            <div className="pt-5 border-t border-border-mint/50">
              <p className="text-[13px] text-foreground/70 font-medium mb-4 leading-relaxed">
                Permanently delete this circle and remove all its members. This action cannot be undone.
              </p>
              <form action={deleteCircle}>
                <SubmitButton
                  className="rounded-full px-6 py-3 text-[13px] font-bold bg-card text-red-500 border border-red-200 hover:bg-red-50 hover:border-red-300 transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
                  pendingText="Deleting..."
                >
                  <Trash2 size={16} strokeWidth={2.5} />
                  Delete Circle
                </SubmitButton>
              </form>
            </div>
          </section>
        )}

        {/* ── Current Members ──────────────────────────── */}
        <section className="space-y-3">
          <h3 className="text-[14px] font-bold text-foreground/60 uppercase tracking-widest px-2">
            Active Members
          </h3>

          <div className="bg-card border border-border-mint rounded-[24px] overflow-hidden shadow-[0_4px_12px_rgba(0,0,0,0.02)] divide-y divide-[#BCE3D8]/30">
            {/* Admin (owner) row */}
            <div className="flex items-center gap-4 p-5 bg-[#FFFCF5]">
              <div className="relative w-12 h-12 rounded-full overflow-hidden bg-background border border-[#D4AF37]/40 flex items-center justify-center shrink-0">
                {(circle.owner as any)?.avatar_url
                  ? <img src={(circle.owner as any).avatar_url} alt="" className="w-full h-full object-cover" />
                  : <span className="text-[16px] font-bold text-[#D4AF37]">{(circle.owner as any)?.display_name?.[0]?.toUpperCase()}</span>
                }
                <span className="absolute bottom-0 right-0 bg-[#D4AF37] rounded-full p-1 border-2 border-white">
                  <Crown size={10} className="text-white fill-white" />
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-bold text-foreground truncate">{(circle.owner as any)?.display_name}</p>
                  <span className="text-[10px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 border border-[#D4AF37]/20 px-2 py-0.5 rounded-full uppercase tracking-wider">Owner</span>
                </div>
                <p className="text-[13px] text-foreground/60 font-medium truncate">@{(circle.owner as any)?.username}</p>
              </div>
            </div>

            {members?.length === 0 ? (
              <div className="text-center py-8 bg-background/30">
                <p className="text-[14px] text-foreground/60 font-medium">No other members in this circle yet.</p>
              </div>
            ) : (
              members?.map((member: any) => (
                <div key={member.user_id} className="flex items-center gap-4 p-5 hover:bg-background/30 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-background border border-border-mint flex items-center justify-center shrink-0">
                    {member.users?.avatar_url
                      ? <img src={member.users.avatar_url} alt="" className="w-full h-full object-cover" />
                      : <span className="text-[16px] font-bold text-foreground">{member.users?.display_name?.[0]?.toUpperCase()}</span>
                    }
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-bold text-foreground truncate">{member.users?.display_name}</p>
                    <p className="text-[13px] text-foreground/60 font-medium truncate">@{member.users?.username}</p>
                  </div>
                  
                  {isAdmin && (
                    <form action={removeMember}>
                      <input type="hidden" name="userId" value={member.user_id} />
                      <button
                        type="submit"
                        title="Remove from circle"
                        className="text-foreground/40 hover:text-red-50 hover:bg-red-500 transition-all p-3 rounded-full cursor-pointer"
                      >
                        <UserMinus size={18} strokeWidth={2} />
                      </button>
                    </form>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* ── Add People ───────────────────────────────── */}
        {isAdmin && (
          <section className="space-y-3 pb-8">
            <h3 className="text-[14px] font-bold text-foreground/60 uppercase tracking-widest px-2">
              Add Friends to Circle
            </h3>
            <div className="bg-card border border-border-mint rounded-[24px] p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
              <AddMemberSearch circleId={circleId} excludeIds={excludeIds} />
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
