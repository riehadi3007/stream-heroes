'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { Logo } from './logo'
import { 
  ChevronLeft, 
  ChevronRight, 
  LayoutDashboard, 
  ShoppingBasket, 
  Users, 
  Settings,
  Gamepad,
  Flame,
  Trophy
} from 'lucide-react'

type MenuItem = {
  href: string
  label: string
  icon: React.ReactNode
}

export default function SideMenu() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { isAuthenticated } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Menu items array - easy to add more in the future
  const menuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} className="text-primary" /> },
    { href: '/categories', label: 'Categories', icon: <ShoppingBasket size={20} className="text-accent" /> },
    { href: '/donators', label: 'Donators', icon: <Flame size={20} className="text-[#ff6b6b]" /> },
    { href: '/current-game', label: 'Current Game', icon: <Gamepad size={20} className="text-[#4ed8c9]" /> },
    { href: '/leaderboard', label: 'Leaderboard', icon: <Trophy size={20} className="text-[#ffd700]" /> },
    { href: '/users', label: 'Players', icon: <Users size={20} className="text-[#9775fa]" /> },
    { href: '/settings', label: 'Settings', icon: <Settings size={20} className="text-[#adb5bd]" /> },
  ]

  // Handle client-side hydration
  useEffect(() => {
    setMounted(true)
  }, [])

  // Apply correct margins as soon as authentication state changes
  useEffect(() => {
    if (mounted) {
      const mainContent = document.getElementById('main-content')
      if (mainContent) {
        if (!isAuthenticated) {
          // Reset margin when user is not logged in
          mainContent.style.marginLeft = '0';
        } else if (collapsed) {
          mainContent.style.marginLeft = '70px';
        } else {
          mainContent.style.marginLeft = '250px';
        }
      }
    }
  }, [isAuthenticated, collapsed, mounted])

  // Don't render anything on server to avoid hydration mismatch
  if (!mounted) return null

  // Don't show the side menu if user is not logged in
  if (!isAuthenticated) return null

  return (
    <div 
      className={cn(
        "h-screen fixed left-0 top-0 z-40 flex flex-col bg-sidebar/70 backdrop-blur-md border-r border-border/30 transition-all duration-300 shadow-lg",
        collapsed ? "w-[70px]" : "w-[250px]"
      )}
    >
      <div className="flex items-center justify-between p-4 border-b border-border/30 bg-sidebar-accent/5">
        {!collapsed ? (
          <Logo size="sm" />
        ) : (
          <Logo size="sm" variant="icon" />
        )}
        <Button 
          variant="cyber" 
          size="icon" 
          className="ml-auto"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </Button>
      </div>

      <div className="flex-1 py-4 overflow-y-auto">
        <nav className="space-y-2 px-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center px-3 py-2 rounded-md transition-all duration-200",
                "hover:bg-sidebar-accent/20 hover:shadow-[0_0_10px_rgba(120,0,255,0.15)]",
                pathname === item.href 
                  ? "bg-sidebar-accent/20 font-medium border-l-2 border-primary shadow-[0_0_15px_rgba(120,0,255,0.15)]" 
                  : "text-muted-foreground",
                collapsed ? "justify-center" : "justify-start"
              )}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span className="ml-3 font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
} 