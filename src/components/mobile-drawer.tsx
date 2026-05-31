'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { logout } from '@/app/auth/actions'
import { UnreadBadge } from '@/components/unread-badge'

interface MobileDrawerProps {
  unreadMessages: number
  userId: string
}

export function MobileDrawer({ unreadMessages, userId }: MobileDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navItems = [
    { href: '/home', icon: 'home', label: 'Home' },
    { href: '/discover', icon: 'search', label: 'Discover' },
    { href: '/profile', icon: 'account_circle', label: 'Profile' },
    { href: '/messages', icon: 'mail', label: 'Messages', hasBadge: true },
    { href: '/ai', icon: 'smart_toy', label: 'AI Assistant' },
    { href: '/presence', icon: 'self_improvement', label: 'Zen Presence' },
    { href: '/loops', icon: 'filter_vintage', label: 'Zen Loops' },
    { href: '/guides', icon: 'import_contacts', label: 'Quiet Guides' },
    { href: '/vault', icon: 'lock', label: 'Private Vault' },
    { href: '/settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden text-primary p-2 -ml-2 rounded-full hover:bg-surface-container transition-colors focus:outline-none"
        title="Open Navigation"
      >
        <Menu size={24} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 bottom-0 w-64 bg-surface/90 backdrop-blur-xl border-r border-outline-variant/30 z-[110] flex flex-col py-8 px-6 md:hidden shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="font-display text-3xl text-primary font-semibold tracking-tight">Quiet</h1>
                  <p className="font-body-md text-[10px] tracking-[0.15em] text-on-surface-variant/80 uppercase font-bold mt-1">Premium Network</p>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 -mr-2 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="flex flex-col space-y-1 flex-grow overflow-y-auto pr-1 hide-scrollbar">
                {navItems.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-4 py-3 px-3 rounded-xl transition-all duration-300 font-medium tracking-wide ${
                        isActive
                          ? 'bg-primary text-on-primary shadow-sm scale-100'
                          : 'text-on-surface hover:bg-surface-container hover:text-primary active:scale-95'
                      }`}
                    >
                      <span
                        className="material-symbols-outlined"
                        style={{
                          fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
                          fontSize: '20px',
                        }}
                      >
                        {item.icon}
                      </span>
                      <span className="text-[14px] leading-none mt-0.5">{item.label}</span>
                      {item.hasBadge && (
                        <div className="ml-auto flex items-center">
                          <UnreadBadge initialCount={unreadMessages} userId={userId} />
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>

              {/* Sign Out */}
              <form action={logout} className="mt-8 shrink-0">
                <button
                  type="submit"
                  className="flex items-center justify-center w-full py-3.5 rounded-xl bg-surface-container-high text-primary hover:bg-primary hover:text-on-primary transition-colors duration-300 cursor-pointer font-semibold text-sm uppercase tracking-wider"
                >
                  Sign Out
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
