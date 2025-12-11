'use client'
import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { AnimatedNumber } from '@/components/ui/AnimatedNumber'
import { Sprout, ShoppingBag, Star, Flame, Zap, Crown } from 'lucide-react'

interface SalaryCardProps {
  salary: number
  base: number
  bonus: number
  level: string
  levelPercent: number
  progress: number
}

// Level-based gradients and icons
const LEVEL_CONFIG: Record<string, {
  gradient: string
  icon: React.ElementType
  glowColor: string
}> = {
  'Новичок': {
    gradient: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    icon: Sprout,
    glowColor: 'rgba(99, 102, 241, 0.4)'
  },
  'Продавец': {
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
    icon: ShoppingBag,
    glowColor: 'rgba(59, 130, 246, 0.4)'
  },
  'Опытный': {
    gradient: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)',
    icon: Star,
    glowColor: 'rgba(16, 185, 129, 0.4)'
  },
  'Мастер': {
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    icon: Flame,
    glowColor: 'rgba(16, 185, 129, 0.5)'
  },
  'Профи': {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)',
    icon: Zap,
    glowColor: 'rgba(245, 158, 11, 0.4)'
  },
  'Легенда': {
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    icon: Crown,
    glowColor: 'rgba(245, 158, 11, 0.5)'
  },
}

export function SalaryCard({ salary, base, bonus, level, levelPercent, progress }: SalaryCardProps) {
  const circumference = 2 * Math.PI * 90
  const strokeDashoffset = circumference - (progress / 100) * circumference

  const config = useMemo(() =>
    LEVEL_CONFIG[level] || LEVEL_CONFIG['Новичок'],
    [level]
  )

  const LevelIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-3xl p-8"
      style={{ background: config.gradient }}
    >
      {/* Glass overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent pointer-events-none" />

      {/* Animated glow pulse - color matches level */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${config.glowColor} 0%, transparent 60%)`
        }}
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.05, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />

      <div className="relative z-10 flex flex-col items-center text-white">
        {/* Circular progress */}
        <div className="relative w-52 h-52 mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 200 200">
            {/* Background circle */}
            <circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="12"
            />
            {/* Progress circle */}
            <motion.circle
              cx="100" cy="100" r="90"
              fill="none"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }}
            />
          </svg>

          {/* Center content with animated numbers */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xs uppercase tracking-widest opacity-80 mb-1">
              Зарплата
            </span>
            <div className="text-5xl font-display font-extrabold">
              <AnimatedNumber value={Math.round(salary / 1000)} />
              <span>к</span>
            </div>
            <div className="text-sm opacity-70 mt-1">
              <AnimatedNumber value={salary} format="money" />
            </div>
          </div>
        </div>

        {/* Base + Bonus pills with animated numbers */}
        <div className="flex items-center gap-3 mb-4">
          <motion.span
            className="px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm text-sm"
            whileHover={{ scale: 1.05 }}
          >
            Оклад <AnimatedNumber value={base / 1000} />к
          </motion.span>
          <span className="text-white/50">+</span>
          <motion.span
            className="px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-sm text-sm font-semibold"
            whileHover={{ scale: 1.05 }}
          >
            Бонус <AnimatedNumber value={bonus / 1000} />к
          </motion.span>
        </div>

        {/* Level badge with icon */}
        <motion.div
          className="px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm flex items-center gap-2"
          key={level}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <LevelIcon className="w-5 h-5" />
          <span className="font-semibold">{level}</span>
          <span className="opacity-70">•</span>
          <span className="font-display font-bold">{levelPercent}%</span>
        </motion.div>
      </div>
    </motion.div>
  )
}
