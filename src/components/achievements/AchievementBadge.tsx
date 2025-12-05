'use client'

import { cn } from '@/lib/utils'
import { ACHIEVEMENT_ICONS, ACHIEVEMENT_COLORS } from '@/lib/achievements'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface AchievementData {
  id: string
  code: string
  name: string
  description?: string | null
  icon?: string | null
  earnedAt?: string
  period?: string
}

interface AchievementBadgeProps {
  achievement: AchievementData
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  earned?: boolean
  className?: string
}

export function AchievementBadge({
  achievement,
  size = 'md',
  showLabel = false,
  earned = true,
  className,
}: AchievementBadgeProps) {
  const icon = achievement.icon || ACHIEVEMENT_ICONS[achievement.code] || '🏅'
  const colors = ACHIEVEMENT_COLORS[achievement.code] || {
    bg: 'from-gray-500/20',
    border: 'border-gray-500/50',
  }

  const sizeClasses = {
    sm: 'w-6 h-6 text-sm',
    md: 'w-8 h-8 text-lg',
    lg: 'w-12 h-12 text-2xl',
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2 cursor-help transition-all',
              !earned && 'opacity-40 grayscale',
              className
            )}
          >
            <div
              className={cn(
                'rounded-full flex items-center justify-center bg-gradient-to-br border',
                colors.bg,
                colors.border,
                sizeClasses[size],
                earned && 'hover:scale-110 transition-transform'
              )}
            >
              <span role="img" aria-label={achievement.name}>
                {icon}
              </span>
            </div>
            {showLabel && (
              <span className="text-sm font-medium">{achievement.name}</span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs">
          <div className="space-y-1">
            <p className="font-semibold flex items-center gap-2">
              <span>{icon}</span>
              {achievement.name}
            </p>
            {achievement.description && (
              <p className="text-xs text-muted-foreground">
                {achievement.description}
              </p>
            )}
            {earned && achievement.earnedAt && (
              <p className="text-xs text-primary">
                Получено: {formatDate(achievement.earnedAt)}
              </p>
            )}
            {!earned && (
              <p className="text-xs text-muted-foreground italic">
                Ещё не получено
              </p>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface AchievementListProps {
  achievements: AchievementData[]
  maxShow?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function AchievementList({
  achievements,
  maxShow = 3,
  size = 'sm',
  className,
}: AchievementListProps) {
  const shown = achievements.slice(0, maxShow)
  const remaining = achievements.length - maxShow

  if (achievements.length === 0) return null

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {shown.map((ach) => (
        <AchievementBadge key={ach.id} achievement={ach} size={size} />
      ))}
      {remaining > 0 && (
        <span className="text-xs text-muted-foreground ml-1">
          +{remaining}
        </span>
      )}
    </div>
  )
}

interface AchievementGridProps {
  allAchievements: AchievementData[]
  earnedIds: string[]
  className?: string
}

export function AchievementGrid({
  allAchievements,
  earnedIds,
  className,
}: AchievementGridProps) {
  return (
    <div className={cn('grid grid-cols-4 sm:grid-cols-6 gap-3', className)}>
      {allAchievements.map((ach) => (
        <div key={ach.id} className="flex flex-col items-center gap-1">
          <AchievementBadge
            achievement={ach}
            size="lg"
            earned={earnedIds.includes(ach.id)}
          />
          <span className="text-xs text-center text-muted-foreground line-clamp-2">
            {ach.name}
          </span>
        </div>
      ))}
    </div>
  )
}
