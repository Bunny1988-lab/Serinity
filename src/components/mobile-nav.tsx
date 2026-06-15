'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Home, MessageCircle, Compass, BookOpen, User } from 'lucide-react'

export function MobileNav() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  // Hide on onboarding, login, etc
  if (['/login', '/signup', '/onboarding'].includes(pathname)) return null

  // Hide the bottom nav dock if we are inside a specific chat conversation
  const isInsideSpecificChat = pathname === '/messages' && searchParams.get('u') !== null
  if (isInsideSpecificChat) return null
  
  const navItems = [
    { name: 'Home', href: '/home', icon: Home },
    { name: 'Chats', href: '/messages', icon: MessageCircle },
    { name: 'Discover', href: '/discover', icon: Compass },
    { name: 'Journal', href: '/journal', icon: BookOpen },
    { name: 'Profile', href: '/profile', icon: User },
  ]
  
  // Also highlight Chats if in a specific chat
  const isChatActive = pathname.startsWith('/messages') || pathname.startsWith('/ai-friend')

  return (
    <nav className="fixed bottom-0 w-full bg-background/70 backdrop-blur-2xl border-t border-border-mint/50 h-[84px] px-4 pb-safe flex justify-around items-center max-w-[800px] mx-auto z-50 rounded-t-[32px] shadow-[0_-8px_32px_rgba(0,0,0,0.04)]">
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = 
          item.name === 'Chats' 
            ? isChatActive 
            : pathname === item.href
            
        return (
          <Link
            key={item.name}
            href={item.href}
            className="flex flex-col items-center justify-center w-16 h-full relative pt-2 pb-4"
          >
            <Icon 
              size={24} 
              strokeWidth={isActive ? 2.5 : 2} 
              className={`mb-1 transition-colors ${isActive ? 'text-foreground' : 'text-[#87A19B]'}`} 
            />
            <span 
              className={`text-[10px] font-medium transition-colors ${isActive ? 'text-foreground font-bold' : 'text-[#87A19B]'}`}
            >
              {item.name}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
