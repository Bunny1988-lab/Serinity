'use client'

import { useState, useEffect, Suspense, Component, type ReactNode } from 'react'
import Link from 'next/link'
import { ChevronLeft, Bell } from 'lucide-react'
import { DesktopNavItem } from '@/components/desktop-nav-item'
import { logout } from '@/app/auth/actions'
import { MindfulPause } from '@/components/mindful-pause'
import { WallpaperProvider } from '@/components/wallpaper-provider'
import { VaultProvider } from '@/components/vault-context'
import { GlobalRealtime } from '@/components/global-realtime'
import { PresenceProvider } from '@/components/presence'
import { UnreadBadge } from '@/components/unread-badge'
import { MobileNav } from '@/components/mobile-nav'
import { NotificationBell } from '@/components/notification-bell'
import { MobileDrawer } from '@/components/mobile-drawer'

// Error boundary to prevent any header widget from crashing the whole page
class SafeWidget extends Component<{ children: ReactNode; fallback?: ReactNode }, { error: boolean }> {
  state = { error: false }
  static getDerivedStateFromError() { return { error: true } }
  componentDidCatch(e: Error) { console.error('[LayoutShell] Widget error:', e) }
  render() {
    if (this.state.error) return this.props.fallback ?? null
    return this.props.children
  }
}

interface LayoutShellProps {
  children: React.ReactNode
  unreadMessages: number
  userId: string
  profile: {
    wallpaper_theme: string | null
    display_name: string | null
    avatar_url: string | null
  } | null
}

export function LayoutShell({ children, unreadMessages, userId, profile }: LayoutShellProps) {
  // Sidebar collapsed state, load from localStorage if available to persist user preference
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored) {
      setIsCollapsed(stored === 'true')
    }
  }, [])

  const handleToggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('sidebar-collapsed', String(nextState))
  }

  // Prevent hydration flicker by keeping layout width fixed during server/client handoff
  const sidebarWidthClass = !isMounted 
    ? 'w-64 px-6' 
    : isCollapsed 
      ? 'w-20 px-3' 
      : 'w-64 px-6'

  const contentMarginClass = !isMounted 
    ? 'md:ml-64' 
    : isCollapsed 
      ? 'md:ml-20' 
      : 'md:ml-64'

  return (
    <WallpaperProvider theme={profile?.wallpaper_theme || 'system'}>
      <VaultProvider>
        <GlobalRealtime userId={userId} />
        <PresenceProvider userId={userId} />
        
        <div className="flex min-h-screen bg-background relative overflow-hidden">
          <MindfulPause />

          {/* ── DESKTOP SIDEBAR (Slideable & Collapsible) ────────────────────────────── */}
          <nav className={`fixed left-0 top-0 h-full border-r-[0.5px] border-outline-variant bg-white/40 backdrop-blur-md z-50 hidden md:flex flex-col py-16 transition-all duration-300 ease-in-out shadow-[0_0_30px_rgba(0,0,0,0.04)] group/sidebar ${sidebarWidthClass}`}>
            
            {/* Elegant Border Chevron Toggle Toggle */}
            <button
              onClick={handleToggleCollapse}
              className="absolute -right-3.5 top-24 w-7 h-7 rounded-full bg-white border border-outline-variant shadow-md flex items-center justify-center text-primary opacity-0 group-hover/sidebar:opacity-100 focus:opacity-100 hover:bg-surface-container transition-all duration-200 z-[60] cursor-pointer"
              title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              <ChevronLeft 
                size={14} 
                strokeWidth={2.5}
                className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180 text-amber-600' : 'text-primary'}`} 
              />
            </button>

            {/* Brand Logo Header */}
            <div className="mb-12 shrink-0 flex justify-center">
              <Link href="/home" className="block text-center select-none">
                {isCollapsed ? (
                  <span className="font-display text-3xl font-semibold text-primary tracking-tighter hover:text-amber-600 transition-colors animate-fade-in">Q</span>
                ) : (
                  <div className="animate-fade-in text-left">
                    <h1 className="font-display text-5xl text-primary font-semibold tracking-tight">Quiet</h1>
                    <p className="font-body-md text-xs tracking-[0.15em] text-on-surface-variant/80 uppercase font-bold mt-1">Premium Network</p>
                  </div>
                )}
              </Link>
            </div>
            
            {/* Scrollable Navigation List */}
            <div className="flex flex-col space-y-3.5 flex-grow overflow-y-auto pr-1 scrollbar-none">
              <DesktopNavItem collapsed={isCollapsed} href="/home"     icon={<span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>home</span>} label="Home" />
              <DesktopNavItem collapsed={isCollapsed} href="/discover" icon={<span className="material-symbols-outlined">search</span>} label="Discover" />
              <DesktopNavItem collapsed={isCollapsed} href="/profile"  icon={<span className="material-symbols-outlined">account_circle</span>} label="Profile" />
              <DesktopNavItem collapsed={isCollapsed} href="/messages" icon={<span className="material-symbols-outlined">mail</span>} label="Messages">
                <UnreadBadge initialCount={unreadMessages} userId={userId} />
              </DesktopNavItem>
              <DesktopNavItem collapsed={isCollapsed} href="/ai"       icon={<span className="material-symbols-outlined">smart_toy</span>} label="AI Assistant" />
              <DesktopNavItem collapsed={isCollapsed} href="/presence" icon={<span className="material-symbols-outlined">self_improvement</span>} label="Zen Presence" />
              <DesktopNavItem collapsed={isCollapsed} href="/loops"    icon={<span className="material-symbols-outlined">filter_vintage</span>} label="Zen Loops" />
              <DesktopNavItem collapsed={isCollapsed} href="/guides"   icon={<span className="material-symbols-outlined">import_contacts</span>} label="Quiet Guides" />
              <DesktopNavItem collapsed={isCollapsed} href="/vault"    icon={<span className="material-symbols-outlined">lock</span>} label="Private Vault" />
              <DesktopNavItem collapsed={isCollapsed} href="/settings" icon={<span className="material-symbols-outlined">settings</span>} label="Settings" />
            </div>

            {/* Tactile Collapsible Sign Out Trigger */}
            <form action={logout} className="mt-8 shrink-0 flex justify-center w-full">
              <button
                type="submit"
                title="Sign Out"
                className={`flex items-center justify-center bg-primary text-on-primary border-[0.5px] border-primary hover:opacity-90 active:scale-95 transition-all duration-300 cursor-pointer ${
                  isCollapsed ? 'w-11 h-11 rounded-full' : 'w-full py-4 rounded-xl scale-95 font-body-md text-base'
                }`}
              >
                {isCollapsed ? (
                  <span className="material-symbols-outlined text-[20px] font-bold">logout</span>
                ) : (
                  <span className="font-semibold tracking-wider text-sm uppercase">Sign Out</span>
                )}
              </button>
            </form>
          </nav>

          {/* ── TOP APP BAR (Responsive layout-aligned) ────────────────────────────── */}
          <header className={`fixed top-0 right-0 left-0 transition-all duration-300 ease-in-out h-20 bg-surface/40 backdrop-blur-md border-b-[0.5px] border-outline-variant z-40 justify-between items-center px-6 md:px-16 ${contentMarginClass} ${isChatActive ? 'hidden md:flex' : 'flex'}`}>
            <div className="flex items-center space-x-4 md:space-x-8">
              <SafeWidget>
                <MobileDrawer unreadMessages={unreadMessages} userId={userId} />
              </SafeWidget>
              <h2 className="font-headline-sm text-2xl font-medium text-primary capitalize hidden md:block">
                Quiet
              </h2>
            </div>
            <div className="flex items-center space-x-6">
              <div className="relative group hidden md:block">
                <input
                  className="bg-surface-container border-[0.5px] border-outline-variant px-4 py-2 w-64 font-ui-element text-sm focus:outline-none focus:border-primary transition-colors duration-300 rounded-full"
                  placeholder="Search insights..."
                  type="text"
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              </div>
              <SafeWidget fallback={<Bell size={20} className="text-on-surface-variant" />}>
                <NotificationBell />
              </SafeWidget>
              <Link href="/profile" className="text-on-surface-variant hover:opacity-70 transition-opacity flex">
                <span className="material-symbols-outlined">account_circle</span>
              </Link>
            </div>
          </header>

          {/* ── MAIN CONTENT (Margin-aligned) ──────────────────────────── */}
          <main className={`flex-1 min-w-0 min-h-screen overflow-x-hidden transition-all duration-300 ease-in-out ${isChatActive ? 'pt-0 md:pt-20' : 'pt-20'} ${contentMarginClass}`}>
            {children}
          </main>

          {/* Mobile Bottom Nav — hidden on desktop */}
          <div className="md:hidden">
            <Suspense fallback={null}>
              <MobileNav />
            </Suspense>
          </div>
        </div>
      </VaultProvider>
    </WallpaperProvider>
  )
}
