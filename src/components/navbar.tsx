'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/auth-context'
import { Button } from '@/components/ui/button'
import { LogIn, LogOut, User, Crown } from 'lucide-react'
import { Logo } from './logo'

export default function Navbar() {
  const pathname = usePathname()
  const { user, isAuthenticated, signOut } = useAuth()
  
  // Check if we're on authentication pages
  const isAuthPage = pathname === '/signin' || pathname === '/signup'

  // Don't show navbar on auth pages
  if (isAuthPage) {
    return null
  }

  // Get page title based on pathname
  const getPageTitle = () => {
    switch(pathname) {
      case '/dashboard': return 'Command Center';
      case '/categories': return 'Item Shop';
      case '/donators': return 'Supporter Guild';
      case '/current-game': return 'Active Mission';
      case '/users': return 'Player Roster';
      case '/settings': return 'System Controls';
      case '/leaderboard': return 'Rankings';
      default: return 'Stream Heroes';
    }
  }

  return (
    <nav className="border-b border-border/30 bg-background/30 backdrop-blur-md supports-[backdrop-filter]:bg-background/50">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center">
          {!isAuthenticated && (
            <div className="mr-6">
              <Link href="/signin">
                <Logo size="md" />
              </Link>
            </div>
          )}
          {isAuthenticated && (
            <div className="flex items-center">
              <h1 className="text-lg font-medium flex items-center gap-2">
                {pathname === '/dashboard' && <Crown className="text-[#ffd700]" size={20} />}
                {getPageTitle()}
              </h1>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          {!isAuthenticated ? (
            <Link href="/signin">
              <Button variant="neo" size="sm">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Button>
            </Link>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mr-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-sidebar-accent/10 border border-border/30">
                <User size={16} className="text-accent" />
                {user?.email}
              </div>
              <Button 
                variant="cyber" 
                size="sm"
                onClick={() => signOut()}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </Button>
            </>
          )}
        </div>
      </div>
    </nav>
  )
} 