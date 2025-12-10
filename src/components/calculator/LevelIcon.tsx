"use client"

import { memo } from "react"
import {
  Sprout,
  ShoppingBag,
  Star,
  Flame,
  Zap,
  Crown,
  LucideIcon
} from "lucide-react"
import { cn } from "@/lib/utils"

// Esports 3-tier system
// Tier 1 (Low): gray/muted
// Tier 2 (Mid): cyan
// Tier 3 (High): magenta with glow

type TierLevel = 'low' | 'mid' | 'high'

const TIER_STYLES: Record<TierLevel, { color: string; bg: string; border: string; glow?: string }> = {
  low: {
    color: 'text-esports-muted',
    bg: 'bg-esports-elevated',
    border: 'border-esports-border',
  },
  mid: {
    color: 'text-neon-cyan',
    bg: 'bg-neon-cyan/10',
    border: 'border-neon-cyan/30',
  },
  high: {
    color: 'text-neon-magenta',
    bg: 'bg-neon-magenta/10',
    border: 'border-neon-magenta/30',
    glow: 'glow-magenta',
  },
}

// Level configuration with tier assignment
export const LEVEL_CONFIG: Record<string, {
  icon: LucideIcon
  tier: TierLevel
}> = {
  'Новичок': { icon: Sprout, tier: 'low' },
  'Продавец': { icon: ShoppingBag, tier: 'low' },
  'Опытный': { icon: Star, tier: 'mid' },
  'Мастер': { icon: Flame, tier: 'mid' },
  'Профи': { icon: Zap, tier: 'high' },
  'Легенда': { icon: Crown, tier: 'high' },
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
  const tierStyle = TIER_STYLES[config.tier]
  const Icon = config.icon

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  return (
    <Icon className={cn(sizeClasses[size], tierStyle.color, className)} />
  )
})

// Esports-style level badge
export const LevelBadge = memo(function LevelBadge({
  levelName,
  className
}: {
  levelName: string
  className?: string
}) {
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Новичок']
  const tierStyle = TIER_STYLES[config.tier]
  const Icon = config.icon

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
      "border",
      tierStyle.bg,
      tierStyle.border,
      tierStyle.color,
      className
    )}>
      <Icon className="w-3 h-3" />
      <span>{levelName}</span>
    </div>
  )
})

// For backward compatibility - expose bg property through helper
export function getLevelStyle(levelName: string) {
  const config = LEVEL_CONFIG[levelName] || LEVEL_CONFIG['Новичок']
  const tierStyle = TIER_STYLES[config.tier]
  return {
    ...config,
    color: tierStyle.color,
    bg: tierStyle.bg,
    glow: tierStyle.glow,
  }
}

// Icon ID to component mapping (for emoji field compatibility)
const ICON_MAP: Record<string, LucideIcon> = {
  'sprout': Sprout,
  'shopping-bag': ShoppingBag,
  'star': Star,
  'flame': Flame,
  'zap': Zap,
  'crown': Crown,
}

// Get icon component from ID string
export function getIconComponent(iconId: string): LucideIcon {
  return ICON_MAP[iconId] || Sprout
}
