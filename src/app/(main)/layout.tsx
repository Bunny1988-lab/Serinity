import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, UserCircle, LogOut, LockKeyhole, MessageSquare, UserPlus2, Compass } from 'lucide-react'
import { DesktopNavItem } from '@/components/desktop-nav-item'
import { logout } from '@/app/auth/actions'

import { MindfulPause } from '@/components/mindful-pause'
import { JournalIcon } from '@/components/journal-icon'
import { Companion } from '@/components/companion'
import { WallpaperProvider } from '@/components/wallpaper-provider'
import { VaultProvider } from '@/components/vault-context'
import { GlobalRealtime } from '@/components/global-realtime'
import { PresenceProvider } from '@/components/presence'
import { UnreadBadge, UnreadBadgeMobile } from '@/components/unread-badge'
import { MobileNav } from '@/components/mobile-nav'
import { Suspense } from 'react'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Fetch the user's selected wallpaper theme
  const { data: profile } = await supabase
    .from('users')
    .select('wallpaper_theme')
    .eq('id', user.id)
    .single()

  // Unread messages count for badge
  const { count: unreadMessages } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .is('read_at', null)

  return (
    <WallpaperProvider theme={profile?.wallpaper_theme || 'system'}>
      <VaultProvider>
        <GlobalRealtime userId={user.id} />
        <PresenceProvider userId={user.id} />
        <div className="flex min-h-screen bg-[#E0F2F1]">
          <MindfulPause />
          <Companion userId={user.id} />
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-56 lg:w-64 flex-col border-r border-teal-900/10 bg-[#E0F2F1]/80 backdrop-blur-xl shrink-0">
            <div className="p-6 lg:p-8">
              <Link href="/feed" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
                <img src="/logo.png" alt="Serenity Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-sm font-medium tracking-[0.2em] text-slate-800 uppercase opacity-90">Serenity</span>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-1.5 px-4 py-4">
              <DesktopNavItem href="/feed"     icon={<Home          size={22} strokeWidth={1.5} />} label="Home" />
              <DesktopNavItem href="/messages" icon={<MessageSquare size={22} strokeWidth={1.5} />} label="Chats">
                <UnreadBadge initialCount={unreadMessages || 0} userId={user.id} />
              </DesktopNavItem>
              <DesktopNavItem href="/discover" icon={<Compass       size={22} strokeWidth={1.5} />} label="Discover" />
              <DesktopNavItem href="/journal"  icon={<JournalIcon   size={22} strokeWidth={1.5} />} label="Journal" />
              <DesktopNavItem href="/profile"  icon={<UserCircle    size={22} strokeWidth={1.5} />} label="Profile" />
            </nav>

        <div className="p-4 lg:p-6">
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
              <LogOut size={20} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 min-h-screen overflow-hidden">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <Suspense fallback={null}>
        <MobileNav unreadMessages={unreadMessages || 0} userId={user.id} />
      </Suspense>
        </div>
      </VaultProvider>
    </WallpaperProvider>
  )
}

