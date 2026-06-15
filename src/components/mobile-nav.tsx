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
    <nav
      className="fixed bottom-0 left-0 right-0 w-full bg-background border-t border-outline-variant/50 flex justify-around items-center z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)', height: 'calc(56px + env(safe-area-inset-bottom, 8px))' }}
    >
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
            className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-2"
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
