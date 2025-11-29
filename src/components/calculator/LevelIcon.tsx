"use client"

import { memo } from "react"
import {
  Circle,
  Crosshair,
  Target,
  Hexagon,
  Diamond,
  Flame,
  Zap,
  Crown,
  Star,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// CS2 Premier style rank configuration
export const LEVEL_CONFIG: Record<string, {
  icon: LucideIcon
  color: string
  bg: string
  glow?: string
}> = {
  'Gray': {
    icon: Circle,
    color: 'text-gray-400',
    bg: 'bg-gray-400/20'
  },
  'Cyan': {
    icon: Crosshair,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/20'
  },
  'Blue': {
    icon: Target,
    color: 'text-blue-500',
    bg: 'bg-blue-500/20'
  },
  'Purple': {
    icon: Hexagon,
    color: 'text-purple-500',
    bg: 'bg-purple-500/20'
  },
  'Pink': {
    icon: Diamond,
    color: 'text-pink-500',
    bg: 'bg-pink-500/20'
  },
  'Red': {
    icon: Flame,
    color: 'text-red-500',
    bg: 'bg-red-500/20'
  },
  'Orange': {
    icon: Zap,
    color: 'text-orange-500',
    bg: 'bg-orange-500/20'
  },
  'Gold': {
    icon: Crown,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/20',
    glow: 'drop-shadow-[0_0_6px_rgba(234,179,8,0.5)]'
  },
  'Global': {
    icon: Star,
    color: 'text-yellow-400',
    bg: 'bg-gradient-to-br from-yellow-500/30 to-orange-500/30',
    glow: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]'
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
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Gray']
  const Icon = config.icon

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Icon className={cn(sizeClasses[size], config.color, config.glow, className)} />
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
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Gray']
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
      config.bg,
      config.glow && "shadow-lg",
      className
    )}>
      <Icon className={cn("w-3.5 h-3.5", config.color, config.glow)} />
      <span>{levelName}</span>
    </div>
  )
})
