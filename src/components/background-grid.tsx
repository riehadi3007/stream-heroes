"use client"

import React, { useEffect, useRef, useState } from "react"

export function BackgroundGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
    
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      drawGrid()
    }

    const drawGrid = () => {
      if (!ctx || !canvas) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Grid settings
      const gridSize = 60
      const minOpacity = 0.03
      const maxOpacity = 0.1
      
      // Background glow effect
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, 
        canvas.height / 2, 
        0, 
        canvas.width / 2, 
        canvas.height / 2, 
        canvas.width
      )
      
      gradient.addColorStop(0, 'rgba(96, 64, 255, 0.01)')
      gradient.addColorStop(0.5, 'rgba(120, 0, 255, 0.005)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Draw horizontal lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        const distanceFromCenter = Math.abs(y - canvas.height / 2)
        const opacity = Math.max(minOpacity, maxOpacity - (distanceFromCenter / canvas.height) * 0.1)
        
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.strokeStyle = `rgba(96, 64, 255, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Draw vertical lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        const distanceFromCenter = Math.abs(x - canvas.width / 2)
        const opacity = Math.max(minOpacity, maxOpacity - (distanceFromCenter / canvas.width) * 0.1)
        
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.strokeStyle = `rgba(96, 64, 255, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }
      
      // Use a deterministic pattern instead of random for data points
      const numPointsX = Math.floor(canvas.width / gridSize)
      const numPointsY = Math.floor(canvas.height / gridSize)
      
      for (let i = 0; i < numPointsX; i++) {
        for (let j = 0; j < numPointsY; j++) {
          // Only draw points at specific intervals to create a pattern
          if ((i + j) % 5 === 0) {
            const x = i * gridSize
            const y = j * gridSize
            // Use a deterministic approach for sizing and coloring
            const size = ((i * j) % 3) + 1
            const isAccent = (i + j) % 7 === 0
            
            ctx.beginPath()
            ctx.arc(x, y, size, 0, Math.PI * 2)
            ctx.fillStyle = isAccent 
              ? 'rgba(255, 64, 96, 0.4)' 
              : 'rgba(96, 64, 255, 0.3)'
            ctx.fill()
          }
        }
      }
    }
    
    window.addEventListener('resize', resizeCanvas)
    resizeCanvas()
    
    // Add animation
    let animationFrame: number
    
    const animate = () => {
      drawGrid()
      animationFrame = requestAnimationFrame(animate)
    }
    
    animate()
    
    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationFrame)
    }
  }, [])

  // Don't render anything during SSR, only on client
  if (!isMounted) {
    return null
  }

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-[-1] opacity-70"
    />
  )
} 