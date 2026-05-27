'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { Home, Users, UserCircle, BookHeart, LockKeyhole, MessageSquare } from 'lucide-react'
import { ReactNode } from 'react'

export function MobileNav({ unreadMessages }: { unreadMessages: number }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // On mobile, if we are in `/messages` and have selected a recipient (`u` search param), 
  // we hide the bottom navigation completely to maximize screen space for texting.
  const isChatting = pathname === '/messages' && searchParams.has('u')

  if (isChatting) return null

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 rounded-3xl border border-border/40 bg-background/70 backdrop-blur-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex justify-around p-2">
        <MobileNavItem href="/feed" active={pathname === '/feed'} icon={<Home size={22} strokeWidth={1.5} />} />
        <MobileNavItem href="/journal" active={pathname === '/journal'} icon={<BookHeart size={22} strokeWidth={1.5} />} />
        <MobileNavItem href="/circles" active={pathname === '/circles'} icon={<Users size={22} strokeWidth={1.5} />} />
        <MobileNavItem href="/messages" active={pathname.startsWith('/messages')} icon={<MessageSquare size={22} strokeWidth={1.5} />}>
          {unreadMessages > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground shadow-sm">
              {unreadMessages}
            </span>
          )}
        </MobileNavItem>
        <MobileNavItem href="/vault" active={pathname === '/vault'} icon={<LockKeyhole size={22} strokeWidth={1.5} />} />
        <MobileNavItem href="/profile" active={pathname === '/profile'} icon={<UserCircle size={22} strokeWidth={1.5} />} />
      </div>
    </nav>
  )
}

function MobileNavItem({ href, icon, active, children }: { href: string; icon: React.ReactNode; active: boolean; children?: React.ReactNode }) {
  return (
    <Link 
      href={href} 
      className={`relative p-2.5 rounded-2xl transition-all duration-200 flex items-center justify-center ${
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
