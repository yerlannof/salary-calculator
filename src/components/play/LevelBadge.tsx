/**
 * Badge с уровнем игрока (Lv.7 ELITE 👑)
 * Faceit-style дизайн
 */

import { cn } from '@/lib/utils'
import { LEVEL_COLORS } from '@/config/gamification'
import type { PowerLevel } from '@/config/gamification'

interface LevelBadgeProps {
  level: number
  levelName: string
  levelIcon: string
  levelColor: PowerLevel['color']
  className?: string
  showLevel?: boolean  // показывать "Lv.7" или только "ELITE"
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-sm px-2.5 py-1',
  lg: 'text-base px-3 py-1.5',
}

export function LevelBadge({
  level,
  levelName,
  levelIcon,
  levelColor,
  className,
  showLevel = true,
  size = 'md',
}: LevelBadgeProps) {
  const colors = LEVEL_COLORS[levelColor]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded font-bold border transition-all',
        colors.text,
        colors.bg,
        colors.border,
        SIZE_CLASSES[size],
        className
      )}
    >
      <span>{levelIcon}</span>
      {showLevel && (
        <span className="text-esports-muted">Lv.{level}</span>
      )}
      <span>{levelName}</span>
    </span>
  )
}

/**
 * Компактная версия - только иконка с уровнем
 */
export function LevelIcon({
  level,
  levelIcon,
  levelColor,
  className,
}: Pick<LevelBadgeProps, 'level' | 'levelIcon' | 'levelColor' | 'className'>) {
  const colors = LEVEL_COLORS[levelColor]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold border',
        colors.text,
        colors.bg,
        colors.border,
        className
      )}
      title={`Level ${level}`}
    >
      <span className="text-lg">{levelIcon}</span>
    </div>
  )
}

/**
 * Challenger Badge для топ-3
 */
export function ChallengerBadge({
  rank,
  className,
}: {
  rank: 1 | 2 | 3
  className?: string
}) {
  const styles = {
    1: {
      text: 'text-black',
      bg: 'bg-neon-yellow',
      border: 'border-neon-yellow',
      icon: '👑',
      label: '#1',
    },
    2: {
      text: 'text-black',
      bg: 'bg-rank-2',
      border: 'border-rank-2',
      icon: '🥈',
      label: '#2',
    },
    3: {
      text: 'text-white',
      bg: 'bg-rank-3',
      border: 'border-rank-3',
      icon: '🥉',
      label: '#3',
    },
  }

  const style = styles[rank]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-black border-2',
        style.text,
        style.bg,
        style.border,
        className
      )}
    >
      <span>{style.icon}</span>
      <span>CHALLENGER {style.label}</span>
    </span>
  )
}
