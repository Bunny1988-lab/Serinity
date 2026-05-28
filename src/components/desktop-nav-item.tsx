'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DesktopNavItem({ href, icon, label, children }: { href: string; icon: React.ReactNode; label: string; children?: React.ReactNode }) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  
  return (
    <Link href={href} className={`group flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 ${
      isActive 
        ? 'bg-teal-900/10 text-teal-900 font-medium' 
        : 'text-slate-600 hover:bg-teal-900/5 hover:text-teal-800'
    }`}>
      <div className="flex items-center gap-4">
        <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
        </div>
        <span className="text-[15px]">{label}</span>
      </div>
      {children}
    </Link>
  )
}
