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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#E0F2F1]/95 backdrop-blur-2xl shadow-[0_-4px_20px_rgba(0,0,0,0.03)] z-50 pb-safe">
      <div className="flex justify-between items-center px-6 py-3">
        <MobileNavItem href="/feed"        active={pathname === '/feed'}              icon={<Home      size={24} strokeWidth={pathname === '/feed' ? 2 : 1.5} />} label="Home" />
        <MobileNavItem href="/messages"    active={pathname.startsWith('/messages')} icon={<MessageSquare size={24} strokeWidth={pathname.startsWith('/messages') ? 2 : 1.5} />} label="Chats">
          <UnreadBadgeMobile initialCount={unreadMessages} userId={userId} />
        </MobileNavItem>
        <MobileNavItem href="/discover"    active={pathname === '/discover'}          icon={<Compass   size={24} strokeWidth={pathname === '/discover' ? 2 : 1.5} />} label="Discover" />
        <MobileNavItem href="/journal"     active={pathname === '/journal'}           icon={<JournalIcon size={24} strokeWidth={pathname === '/journal' ? 2 : 1.5} />} label="Journal" />
        <MobileNavItem href="/profile"     active={pathname === '/profile'}          icon={<UserCircle  size={24} strokeWidth={pathname === '/profile' ? 2 : 1.5} />} label="Profile" />
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
      className={`relative flex flex-col items-center justify-center gap-1 transition-all duration-200 w-16 ${
        active
          ? 'text-teal-800'
          : 'text-slate-400 hover:text-slate-600 active:scale-95'
      }`}
    >
      <div className="relative">
        {icon}
        {children}
      </div>
      <span className={`text-[10px] ${active ? 'font-semibold' : 'font-medium'}`}>
        {label}
      </span>
    </Link>
  )
}
