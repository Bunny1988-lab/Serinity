'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function DesktopNavItem({ 
  href, 
  icon, 
  label, 
  children,
  collapsed = false 
}: { 
  href: string; 
  icon: React.ReactNode; 
  label: string; 
  children?: React.ReactNode;
  collapsed?: boolean 
}) {
  const pathname = usePathname()
  const isActive = pathname.startsWith(href)
  
  return (
    <Link 
      href={href} 
      title={collapsed ? label : undefined}
      className={`group flex items-center transition-all duration-300 ease-out relative ${
        collapsed ? 'justify-center py-3 px-2 rounded-xl' : 'justify-between px-4 py-3 rounded-lg'
      } ${
        isActive 
          ? 'text-primary font-bold border-r-2 border-primary bg-surface-container-low' 
          : 'text-on-surface-variant font-medium hover:text-primary hover:bg-surface-container-low border-r-2 border-transparent'
      }`}
    >
      <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-4'}`}>
        <div className={`transition-transform duration-200 relative ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
          {icon}
          {collapsed && children && (
            <div className="absolute -top-1.5 -right-1.5 z-10 scale-75 transform origin-top-right">
              {children}
            </div>
          )}
        </div>
        {!collapsed && <span className="text-[15px] tracking-wide animate-fade-in">{label}</span>}
      </div>
      {!collapsed && children}
    </Link>
  )
}
