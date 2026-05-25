import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Home, Users, UserCircle, BookHeart, LogOut, LockKeyhole, MessageSquare } from 'lucide-react'
import { logout } from '@/app/auth/actions'

import { MindfulPause } from '@/components/mindful-pause'
import { Companion } from '@/components/companion'
import { WallpaperProvider } from '@/components/wallpaper-provider'
import { VaultProvider } from '@/components/vault-context'

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
        <div className="flex min-h-screen bg-transparent">
          <MindfulPause />
          <Companion userId={user.id} />
          {/* Desktop Sidebar */}
          <aside className="hidden md:flex w-64 flex-col border-r border-border/50 bg-background/50 backdrop-blur-xl">
            <div className="p-8">
              <Link href="/feed" className="flex items-center gap-3 hover:opacity-95 transition-opacity">
                <img src="/logo.png" alt="Serenity Logo" className="w-8 h-8 rounded-lg object-contain" />
                <span className="text-sm font-medium tracking-[0.2em] text-foreground uppercase opacity-80">Serenity</span>
              </Link>
            </div>
            
            <nav className="flex-1 space-y-2 px-6 py-4">
          <NavItem href="/feed" icon={<Home size={22} strokeWidth={1.5} />} label="Home" />
          <NavItem href="/journal" icon={<BookHeart size={22} strokeWidth={1.5} />} label="Journal" />
          <NavItem href="/circles" icon={<Users size={22} strokeWidth={1.5} />} label="Circles" />
          <NavItem href="/messages" icon={<MessageSquare size={22} strokeWidth={1.5} />} label="Messages" badge={unreadMessages || 0} />
          <NavItem href="/vault" icon={<LockKeyhole size={22} strokeWidth={1.5} />} label="Vault" />
          <NavItem href="/profile" icon={<UserCircle size={22} strokeWidth={1.5} />} label="Profile" />
        </nav>

        <div className="p-6">
          <form action={logout}>
            <button type="submit" className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
              <LogOut size={20} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-2xl mx-auto md:ml-0 min-h-screen border-r border-border/30 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
        {children}
      </main>

      {/* Right margin space for balance on large screens */}
      <div className="hidden lg:block flex-1 bg-transparent"></div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-6 left-6 right-6 rounded-3xl border border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl z-50 overflow-hidden">
        <div className="flex justify-around p-2">
          <MobileNavItem href="/feed" icon={<Home size={24} strokeWidth={1.5} />} />
          <MobileNavItem href="/journal" icon={<BookHeart size={24} strokeWidth={1.5} />} />
          <MobileNavItem href="/circles" icon={<Users size={24} strokeWidth={1.5} />} />
          <MobileNavItem href="/messages" icon={<MessageSquare size={24} strokeWidth={1.5} />} badge={unreadMessages || 0} />
          <MobileNavItem href="/vault" icon={<LockKeyhole size={24} strokeWidth={1.5} />} />
          <MobileNavItem href="/profile" icon={<UserCircle size={24} strokeWidth={1.5} />} />
        </div>
      </nav>
        </div>
      </VaultProvider>
    </WallpaperProvider>
  )
}

function NavItem({ href, icon, label, badge = 0 }: { href: string; icon: React.ReactNode; label: string; badge?: number }) {
  return (
    <Link href={href} className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted/50 hover:text-foreground">
      {icon}
      <span>{label}</span>
      {badge > 0 && (
        <span className="ml-auto min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-medium rounded-full flex items-center justify-center px-1">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}

function MobileNavItem({ href, icon, badge = 0 }: { href: string; icon: React.ReactNode; badge?: number }) {
  return (
    <Link href={href} className="relative p-2 text-muted-foreground hover:text-foreground transition-colors">
      {icon}
      {badge > 0 && (
        <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-medium rounded-full flex items-center justify-center">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </Link>
  )
}
