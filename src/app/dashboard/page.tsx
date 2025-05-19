"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ShoppingBasket, Users, Settings } from 'lucide-react'

export default function Dashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Redirect to sign in if not authenticated
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/signin')
    }
  }, [user, isLoading, router])

  // Show loading state or nothing while checking authentication
  if (isLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <p>Loading...</p>
      </div>
    )
  }

  // Dashboard cards with links to main sections
  const dashboardItems = [
    {
      title: 'Categories',
      description: 'Manage your categories and their prices',
      icon: <ShoppingBasket className="h-8 w-8 text-primary" />,
      href: '/categories'
    },
    {
      title: 'Users',
      description: 'Manage system users and permissions',
      icon: <Users className="h-8 w-8 text-primary" />,
      href: '/users'
    },
    {
      title: 'Settings',
      description: 'Configure system settings and preferences',
      icon: <Settings className="h-8 w-8 text-primary" />,
      href: '/settings'
    }
  ]

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dashboardItems.map((item) => (
          <Card 
            key={item.title} 
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => router.push(item.href)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xl">{item.title}</CardTitle>
              {item.icon}
            </CardHeader>
            <CardContent>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
} 