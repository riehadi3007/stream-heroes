"use client"

import React from 'react'
import { Zap, Tv, Star } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'full' | 'icon'
  className?: string
}

export function Logo({ 
  size = 'md', 
  variant = 'full',
  className 
}: LogoProps) {
  // Size mappings
  const sizeMap = {
    sm: {
      container: 'gap-1',
      icon: 16,
      primary: 'text-lg',
      secondary: 'text-xs'
    },
    md: {
      container: 'gap-2',
      icon: 20,
      primary: 'text-xl',
      secondary: 'text-sm'
    },
    lg: {
      container: 'gap-2.5',
      icon: 24,
      primary: 'text-2xl',
      secondary: 'text-base'
    }
  }

  const iconOnly = variant === 'icon'
  
  // Logo component with animated elements
  return (
    <div className={cn(
      "flex items-center", 
      sizeMap[size].container,
      className
    )}>
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 animate-pulse rounded-full bg-primary/20 blur-sm"></div>
        <div className="relative z-10 flex">
          {/* Star in the background */}
          <Star 
            size={sizeMap[size].icon * 1.2} 
            className="absolute text-accent/20 -z-10 transform -translate-x-1/4 -translate-y-1/4" 
          />
          {/* TV icon as main logo symbol */}
          <Tv 
            size={sizeMap[size].icon} 
            className="text-primary fill-primary/30" 
          />
          {/* Lightning bolt for energy */}
          <Zap 
            size={sizeMap[size].icon * 0.7} 
            className="absolute text-accent bottom-0 right-0 transform translate-x-1/3 translate-y-1/4" 
          />
        </div>
      </div>
      
      {!iconOnly && (
        <div className="flex flex-col">
          <span className={cn(
            "font-bold tracking-wider leading-none", 
            sizeMap[size].primary
          )}>
            STREAM<span className="text-accent">HEROES</span>
          </span>
          {size !== 'sm' && (
            <span className={cn(
              "text-muted-foreground tracking-wide", 
              sizeMap[size].secondary
            )}>
              Support Legends
            </span>
          )}
        </div>
      )}
    </div>
  )
} 