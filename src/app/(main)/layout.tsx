import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, UserCircle, BookHeart, LogOut, LockKeyhole, MessageSquare } from 'lucide-react'
import { logout } from '@/app/auth/actions'

import { MindfulPause } from '@/components/mindful-pause'
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
        <div className="flex min-h-screen bg-transparent">
          <MindfulPause />
          <Companion userId={user.id} />
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-56 lg:w-64 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl shrink-0">
            <div className="p-6 lg:p-8">
              <Link href="/feed" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
                <img src="/logo.png" alt="Serenity Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-sm font-medium tracking-[0.2em] text-foreground uppercase opacity-80">Serenity</span>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-1.5 px-4 py-4">
          <NavItem href="/feed" icon={<Home size={22} strokeWidth={1.5} />} label="Home" />
          <NavItem href="/journal" icon={<BookHeart size={22} strokeWidth={1.5} />} label="Journal" />
          <NavItem href="/circles" icon={<Users size={22} strokeWidth={1.5} />} label="Circles" />
          <NavItem href="/messages" icon={<MessageSquare size={22} strokeWidth={1.5} />} label="Messages">
            <UnreadBadge initialCount={unreadMessages || 0} userId={user.id} />
          </NavItem>
          <NavItem href="/vault" icon={<LockKeyhole size={22} strokeWidth={1.5} />} label="Vault" />
          <NavItem href="/profile" icon={<UserCircle size={22} strokeWidth={1.5} />} label="Profile" />
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
        <MobileNav unreadMessages={unreadMessages || 0} />
      </Suspense>
        </div>
      </VaultProvider>
    </WallpaperProvider>
  )
}

function NavItem({ href, icon, label, children }: { href: string; icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
      {icon}
      <span>{label}</span>
      {children}
    </Link>
  )
}

function MobileNavItem({ href, icon, children }: { href: string; icon: React.ReactNode; children?: React.ReactNode }) {
  return (
    <Link href={href} className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
      {icon}
      {children}
    </Link>
  )
}
