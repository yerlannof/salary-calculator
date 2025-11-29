"use client"

import { memo } from "react"
import {
  Sprout,
  Star,
  Flame,
  Dumbbell,
  Target,
  Gem,
  Crown,
  Rocket,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Маппинг уровней на иконки и цвета
export const LEVEL_CONFIG: Record<string, {
  icon: LucideIcon
  color: string
  bg: string
}> = {
  'Новичок': {
    icon: Sprout,
    color: 'text-green-500',
    bg: 'bg-green-500/20'
  },
  'Продавец': {
    icon: Star,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/20'
  },
  'Опытный': {
    icon: Flame,
    color: 'text-orange-500',
    bg: 'bg-orange-500/20'
  },
  'Мастер': {
    icon: Dumbbell,
    color: 'text-blue-500',
    bg: 'bg-blue-500/20'
  },
  'Профи': {
    icon: Target,
    color: 'text-cyan-500',
    bg: 'bg-cyan-500/20'
  },
  'Эксперт': {
    icon: Gem,
    color: 'text-purple-500',
    bg: 'bg-purple-500/20'
  },
  'Легенда': {
    icon: Crown,
    color: 'text-amber-500',
    bg: 'bg-amber-500/20'
  },
  'Бог продаж': {
    icon: Rocket,
    color: 'text-rose-500',
    bg: 'bg-rose-500/20'
  },
}

interface LevelIconProps {
  levelName: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export const LevelIcon = memo(function LevelIcon({
  levelName,
  size = 'md',
  className
}: LevelIconProps) {
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Новичок']
  const Icon = config.icon

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Icon className={cn(sizeClasses[size], config.color, className)} />
  )
})

// Компонент для бейджа уровня
export const LevelBadge = memo(function LevelBadge({
  levelName,
  className
}: {
  levelName: string
  className?: string
}) {
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Новичок']
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      config.bg,
      className
    )}>
      <Icon className={cn("w-3.5 h-3.5", config.color)} />
      <span>{levelName}</span>
    </div>
  )
})
