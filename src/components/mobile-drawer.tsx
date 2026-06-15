'use client'

import { useState, Component, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ── Error Boundary ────────────────────────────────────────────────────────────
class DrawerErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch(error: Error) {
    console.error('[MobileDrawer] Runtime error caught by boundary:', error)
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null
    }
    return this.props.children
  }
}

// ── Nav items — every href must correspond to an existing app/(main) route ───
interface NavItem {
  href: string
  icon: string
  label: string
  hasBadge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/home',          icon: 'home',              label: 'Home' },
  { href: '/discover',      icon: 'search',            label: 'Discover' },
  { href: '/profile',       icon: 'account_circle',    label: 'Profile' },
  { href: '/messages',      icon: 'mail',              label: 'Messages',     hasBadge: true },
  { href: '/notifications', icon: 'notifications',     label: 'Notifications' },
  { href: '/people',        icon: 'group',             label: 'People' },
  { href: '/ai',            icon: 'smart_toy',         label: 'AI Assistant' },
  { href: '/presence',      icon: 'self_improvement',  label: 'Zen Presence' },
  { href: '/loops',         icon: 'filter_vintage',    label: 'Zen Loops' },
  { href: '/guides',        icon: 'import_contacts',   label: 'Quiet Guides' },
  { href: '/vault',         icon: 'lock',              label: 'Private Vault' },
  { href: '/settings',      icon: 'settings',          label: 'Settings' },
]

interface MobileDrawerProps {
  unreadMessages?: number
  userId?: string
}

function DrawerInner({ unreadMessages = 0, userId = '' }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const pathname = usePathname() ?? ''
  const router = useRouter()

  // Client-side logout — avoids server-action redirect which can 404 on mobile
  const handleLogout = async () => {
    if (isSigningOut) return
    try {
      setIsSigningOut(true)
      setIsOpen(false)
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('[MobileDrawer] Logout error:', err)
      // Even if signout fails, still redirect
      router.push('/login')
    }
  }

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const safeUnread = Math.max(0, unreadMessages ?? 0)

  const drawerContent = (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-sm md:hidden"
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.div
            key="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 left-0 bottom-0 w-72 bg-surface border-r border-outline-variant/30 z-[9999] flex flex-col py-8 px-6 md:hidden shadow-2xl overflow-y-auto hide-scrollbar"
          >
            {/* Header row */}
            <div className="flex items-center justify-between mb-8 shrink-0">
              <div>
                <h1 className="font-display text-3xl text-primary font-semibold tracking-tight">
                  Quiet
                </h1>
                <p className="text-[10px] tracking-[0.15em] text-on-surface-variant/70 uppercase font-bold mt-0.5">
                  Premium Network
                </p>
              </div>
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setIsOpen(false)}
                className="p-2 -mr-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors active:scale-95"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation links */}
            <nav className="flex flex-col space-y-1 flex-grow" aria-label="Main navigation">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`flex items-center gap-4 py-3 px-3 rounded-xl transition-all duration-200 font-medium select-none ${
                      isActive
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'text-on-surface hover:bg-surface-container hover:text-primary active:scale-[0.98]'
                    }`}
                  >
                    <span
                      className="material-symbols-outlined shrink-0"
                      style={{
                        fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                        fontSize: '20px',
                      }}
                    >
                      {item.icon}
                    </span>
                    <span className="text-[14px] leading-none">{item.label}</span>

                    {/* Unread badge on Messages */}
                    {item.hasBadge && safeUnread > 0 && userId && (
                      <span className="ml-auto min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center leading-none">
                        {safeUnread > 9 ? '9+' : safeUnread}
                      </span>
                    )}
                  </Link>
                )
              })}
            </nav>

            {/* Sign out */}
            <div className="mt-6 shrink-0">
              <button
                type="button"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-all duration-300 cursor-pointer font-semibold text-sm uppercase tracking-wider active:scale-[0.98] disabled:opacity-60"
              >
                <LogOut size={16} className={isSigningOut ? 'animate-spin' : ''} />
                {isSigningOut ? 'Signing out…' : 'Sign Out'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {/* Hamburger trigger — mobile only */}
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
        className="md:hidden text-primary p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors focus:outline-none active:scale-95"
      >
        <Menu size={24} />
      </button>

      {mounted ? createPortal(drawerContent, document.body) : null}
    </>
  )
}

// Export wrapped in error boundary so drawer can never crash the whole page
export function MobileDrawer(props: MobileDrawerProps) {
  return (
    <DrawerErrorBoundary
      fallback={
        <button
          type="button"
          aria-label="Open navigation menu"
          className="md:hidden text-primary p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors"
          onClick={() => window.location.reload()}
        >
          <Menu size={24} />
        </button>
      }
    >
      <DrawerInner {...props} />
    </DrawerErrorBoundary>
  )
}
