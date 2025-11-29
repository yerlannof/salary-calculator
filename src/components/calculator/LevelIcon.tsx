"use client"

import { memo } from "react"
import {
  Circle,
  Shield,
  Sword,
  Medal,
  Hexagon,
  Gem,
  ArrowUpCircle,
  Skull,
  Sun,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Valorant-style rank configuration
export const LEVEL_CONFIG: Record<string, {
  icon: LucideIcon
  color: string
  bg: string
  glow?: string
}> = {
  'Iron': {
    icon: Circle,
    color: 'text-slate-400',
    bg: 'bg-slate-400/20'
  },
  'Bronze': {
    icon: Shield,
    color: 'text-amber-700',
    bg: 'bg-amber-700/20'
  },
  'Silver': {
    icon: Sword,
    color: 'text-slate-300',
    bg: 'bg-slate-300/20'
  },
  'Gold': {
    icon: Medal,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/20'
  },
  'Platinum': {
    icon: Hexagon,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/20'
  },
  'Diamond': {
    icon: Gem,
    color: 'text-violet-400',
    bg: 'bg-violet-400/20'
  },
  'Ascendant': {
    icon: ArrowUpCircle,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/20'
  },
  'Immortal': {
    icon: Skull,
    color: 'text-rose-500',
    bg: 'bg-rose-500/20'
  },
  'Radiant': {
    icon: Sun,
    color: 'text-yellow-300',
    bg: 'bg-yellow-300/20',
    glow: 'drop-shadow-[0_0_8px_rgba(253,224,71,0.6)]'
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
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Iron']
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
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Iron']
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
