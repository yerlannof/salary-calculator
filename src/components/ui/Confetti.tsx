'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface ConfettiProps {
  trigger: boolean
  duration?: number
}

const CONFETTI_COLORS = [
  '#10b981', // emerald
  '#3b82f6', // blue
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ef4444', // red
  '#06b6d4', // cyan
]

interface Particle {
  id: number
  x: number
  color: string
  rotation: number
  scale: number
}

export function Confetti({ trigger, duration = 2000 }: ConfettiProps) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (trigger) {
      // Generate particles
      const newParticles: Particle[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: Math.random() * 100, // percentage across screen
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
      }))
      setParticles(newParticles)
      setShow(true)

      const timer = setTimeout(() => {
        setShow(false)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [trigger, duration])

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              className="absolute w-3 h-3 rounded-sm"
              style={{
                left: `${particle.x}%`,
                backgroundColor: particle.color,
              }}
              initial={{
                y: -20,
                rotate: 0,
                opacity: 1,
                scale: particle.scale,
              }}
              animate={{
                y: '100vh',
                rotate: particle.rotation + 720,
                opacity: [1, 1, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 2 + Math.random(),
                ease: [0.25, 0.46, 0.45, 0.94],
                delay: Math.random() * 0.3,
              }}
            />
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
