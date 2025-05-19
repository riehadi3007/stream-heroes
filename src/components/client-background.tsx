"use client"

import dynamic from 'next/dynamic'
import { BackgroundGrid } from './background-grid'

// Client Component wrapper for BackgroundGrid to avoid hydration issues
const ClientBackgroundGrid = dynamic(
  () => Promise.resolve(BackgroundGrid),
  { ssr: false }
)

export function ClientBackground() {
  return <ClientBackgroundGrid />
} 