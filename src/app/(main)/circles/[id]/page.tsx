import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { ArrowLeft, UserMinus, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export default async function CircleDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: circleId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  // Fetch circle details
  const { data: circle } = await supabase
    .from('circles')
    .select('*')
    .eq('id', circleId)
    .single()

  if (!circle || circle.owner_id !== user.id) {
    redirect('/circles')
  }

  // Fetch circle members
  const { data: members } = await supabase
    .from('circle_members')
    .select('user_id, users(username, display_name, avatar_url)')
    .eq('circle_id', circleId)

  // Fetch all users not in circle to add (basic implementation)
  const memberIds = members?.map(m => m.user_id) || []
  const { data: otherUsers } = await supabase
    .from('users')
    .select('id, username, display_name, avatar_url')
    .neq('id', user.id)
    .not('id', 'in', `(${memberIds.length ? memberIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
    .limit(20)

  // Inline server actions for simplicity
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

  return (
    <div className="pb-20 md:pb-0 min-h-screen">
      <header className="sticky top-0 z-10 bg-background/80 px-4 py-4 backdrop-blur-xl border-b border-border/50 flex items-center gap-4">
        <Link href="/circles" className="text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-full hover:bg-muted/50">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-light tracking-tight">{circle.name}</h1>
        </div>
      </header>
      
      <div className="p-4 space-y-8 max-w-xl mx-auto mt-4">
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-2">Current Members ({members?.length || 0})</h3>
          
          {members?.length === 0 ? (
            <div className="text-center text-muted-foreground py-6 border border-dashed border-border/50 rounded-2xl">
              <p className="text-sm font-light">No members yet. Add some below.</p>
            </div>
          ) : (
            <div className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl divide-y divide-border/50">
              {members?.map((member: any) => (
                <div key={member.user_id} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                      {member.users.display_name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-foreground">{member.users.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{member.users.username}</p>
                    </div>
                  </div>
                  <form action={removeMember}>
                    <input type="hidden" name="userId" value={member.user_id} />
                    <button type="submit" className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10">
                      <UserMinus size={18} />
                    </button>
                  </form>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4 pt-4 border-t border-border/30">
          <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground px-2">Add People</h3>
          
          <div className="bg-background/40 backdrop-blur-sm border border-border/50 rounded-2xl divide-y divide-border/50">
            {otherUsers?.map((u: any) => (
              <div key={u.id} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                    {u.display_name?.[0] || '?'}
                  </div>
                  <div>
                    <p className="font-medium text-sm text-foreground">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">@{u.username}</p>
                  </div>
                </div>
                <form action={addMember}>
                  <input type="hidden" name="userId" value={u.id} />
                  <button type="submit" className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-primary/10">
                    <UserPlus size={18} />
                  </button>
                </form>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
