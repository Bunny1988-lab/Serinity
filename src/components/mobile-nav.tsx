'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Users, UserCircle, BookHeart, LockKeyhole, MessageSquare, UserPlus2 } from 'lucide-react'
import { UnreadBadgeMobile } from '@/components/unread-badge'

export function MobileNav({
  unreadMessages,
  userId,
}: {
  unreadMessages: number
  userId: string
}) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Hide nav when actively chatting so chat takes full screen
  const isChatting = pathname === '/messages' && searchParams.has('u')
  if (isChatting) return null

  return (
    <nav className="md:hidden fixed bottom-4 left-4 right-4 rounded-3xl border border-border/40 bg-background/75 backdrop-blur-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex justify-around items-center px-1 py-1.5">
        <MobileNavItem href="/feed"        active={pathname === '/feed'}              icon={<Home      size={20} strokeWidth={1.5} />} />
        <MobileNavItem href="/journal"     active={pathname === '/journal'}           icon={<BookHeart size={20} strokeWidth={1.5} />} />
        <MobileNavItem href="/circles"     active={pathname === '/circles'}           icon={<Users     size={20} strokeWidth={1.5} />} />
        <MobileNavItem href="/people"      active={pathname.startsWith('/people')}   icon={<UserPlus2 size={20} strokeWidth={1.5} />} />
        <MobileNavItem href="/messages"    active={pathname.startsWith('/messages')} icon={<MessageSquare size={20} strokeWidth={1.5} />}>
          <UnreadBadgeMobile initialCount={unreadMessages} userId={userId} />
        </MobileNavItem>
        <MobileNavItem href="/vault"       active={pathname === '/vault'}            icon={<LockKeyhole size={20} strokeWidth={1.5} />} />
        <MobileNavItem href="/profile"     active={pathname === '/profile'}          icon={<UserCircle  size={20} strokeWidth={1.5} />} />
      </div>
    </nav>
  )
}

function MobileNavItem({
  href,
  icon,
  active,
  children,
}: {
  href: string
  icon: React.ReactNode
  active: boolean
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative p-2 rounded-2xl transition-all duration-200 flex items-center justify-center ${
        active
          ? 'text-primary bg-primary/10 scale-105'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/20 active:scale-95'
      }`}
    >
      {icon}
      {children}
    </Link>
  )
}
