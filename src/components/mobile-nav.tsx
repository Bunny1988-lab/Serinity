'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Users, UserCircle, LockKeyhole, MessageSquare, UserPlus2, Compass } from 'lucide-react'
import { UnreadBadgeMobile } from '@/components/unread-badge'
import { JournalIcon } from '@/components/journal-icon'

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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card rounded-t-[2.5rem] border-t-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)] z-50 pb-safe px-4 pt-2">
      <div className="flex justify-between items-center px-2 relative h-16">
        <MobileNavItem href="/home"        active={pathname === '/home'}              icon={<Home      size={24} strokeWidth={pathname === '/home' ? 2.5 : 2} />} label="Home" />
        <MobileNavItem href="/messages"    active={pathname.startsWith('/messages')} icon={<MessageSquare size={24} strokeWidth={pathname.startsWith('/messages') ? 2.5 : 2} />} label="Chats">
          <UnreadBadgeMobile initialCount={unreadMessages} userId={userId} />
        </MobileNavItem>
        <MobileNavItem href="/discover"    active={pathname === '/discover'}          icon={<Compass   size={24} strokeWidth={pathname === '/discover' ? 2.5 : 2} />} label="Discover" />
        <MobileNavItem href="/journal"     active={pathname === '/journal'}           icon={<JournalIcon size={24} strokeWidth={pathname === '/journal' ? 2.5 : 2} />} label="Journal" />
        <MobileNavItem href="/profile"     active={pathname === '/profile'}          icon={<UserCircle  size={24} strokeWidth={pathname === '/profile' ? 2.5 : 2} />} label="Profile" />
      </div>
    </nav>
  )
}

function MobileNavItem({
  href,
  icon,
  active,
  label,
  children,
}: {
  href: string
  icon: React.ReactNode
  active: boolean
  label: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 h-full w-14 ${
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground active:scale-95'
      }`}
    >
      <div className="relative">
        {icon}
        {children}
      </div>
      <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>
        {label}
      </span>
      {active && (
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-foreground rounded-t-full" />
      )}
    </Link>
  )
}
