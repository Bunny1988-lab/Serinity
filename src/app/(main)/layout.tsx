import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LayoutShell } from '@/components/layout-shell'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // ── Safety net: ensure public.users row exists ─────────────────────────────
  // If the DB trigger `handle_new_user` failed silently at signup (e.g. username
  // was null), this upsert creates the row now so all page queries work.
  const { data: existingProfile } = await supabase
    .from('users')
    .select('wallpaper_theme, display_name, avatar_url')
    .eq('id', user.id)
    .single()

  let profile = existingProfile
  if (!profile) {
    const meta = user.user_metadata || {}
    const email = user.email || ''
    const fallbackUsername = meta.username || email.split('@')[0].replace(/[^a-z0-9_]/gi, '_').toLowerCase() || 'user'
    const fallbackDisplayName = meta.display_name || meta.full_name || fallbackUsername

    await supabase.from('users').upsert(
      { id: user.id, username: fallbackUsername, display_name: fallbackDisplayName },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    // Re-fetch after upsert
    const { data: newProfile } = await supabase
      .from('users')
      .select('wallpaper_theme, display_name, avatar_url')
      .eq('id', user.id)
      .single()

    profile = newProfile
  }

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
