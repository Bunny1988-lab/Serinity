import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutShell } from '@/components/layout-shell'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('wallpaper_theme, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .is('read_at', null)

  return (
    <LayoutShell
      userId={user.id}
      profile={profile}
      unreadMessages={unreadMessages || 0}
    >
      {children}
    </LayoutShell>
  )
}
