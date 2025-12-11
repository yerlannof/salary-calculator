'use client'

import { useSpring, useTransform, motion } from 'framer-motion'
import { useEffect } from 'react'

interface AnimatedNumberProps {
  value: number
  className?: string
  format?: 'money' | 'short' | 'percent' | 'plain'
}

export function AnimatedNumber({ value, className, format = 'plain' }: AnimatedNumberProps) {
  const spring = useSpring(value, {
    mass: 0.8,
    stiffness: 75,
    damping: 15
  })

  const display = useTransform(spring, (current) => {
    const rounded = Math.round(current)

    switch (format) {
      case 'money':
        return rounded.toLocaleString('ru-RU') + ' ₸'
      case 'short':
        if (rounded >= 1000000) {
          return (rounded / 1000000).toFixed(1) + 'М'
        }
        if (rounded >= 1000) {
          return Math.round(rounded / 1000) + 'К'
        }
        return rounded.toString()
      case 'percent':
        return rounded + '%'
      default:
        return rounded.toLocaleString('ru-RU')
    }
  })

  useEffect(() => {
    spring.set(value)
  }, [spring, value])

  return <motion.span className={className}>{display}</motion.span>
}
