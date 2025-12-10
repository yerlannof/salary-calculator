/**
 * PlayerCard - карточка игрока для лидерборда
 * БЕЗ денег - только Power Rating, уровень, позиция, streak
 */

'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { LevelBadge, ChallengerBadge } from './LevelBadge'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'
import { getLevelProgressColor } from '@/lib/gamification/power'
import {
  Flame,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import type { PlayerProfile } from '@/lib/gamification/types'

interface PlayerCardProps {
  player: PlayerProfile
  index: number
  period: string
  departmentId: string
  showStores?: boolean
  onAvatarClick?: () => void
}

const POSITION_COLORS: Record<number, { text: string; border: string; bg: string }> = {
  1: { text: 'text-neon-cyan', border: 'border-l-neon-cyan', bg: 'bg-neon-cyan/10' },
  2: { text: 'text-rank-2', border: 'border-l-rank-2', bg: 'bg-rank-2/10' },
  3: { text: 'text-rank-3', border: 'border-l-rank-3', bg: 'bg-rank-3/10' },
}

export function PlayerCard({
  player,
  index,
  period,
  departmentId,
  showStores,
  onAvatarClick,
}: PlayerCardProps) {
  const isTop3 = player.position <= 3
  const positionStyle = POSITION_COLORS[player.position]
  const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Link href={`/play/${player.moyskladId}?period=${period}&dept=${departmentId}`}>
        <div
          className={cn(
            'relative overflow-hidden rounded-lg transition-all duration-200 cursor-pointer group',
            'bg-esports-card border border-esports-border',
            'hover:bg-esports-elevated hover:border-esports-muted',
            !player.isActive && 'opacity-50',
            isTop3 && positionStyle && `border-l-4 ${positionStyle.border}`,
            player.position === 1 && 'border-glow-cyan'
          )}
        >
          <div className="relative p-4">
            <div className="flex items-center gap-4">
              {/* Position Number */}
              <div className={cn(
                'w-10 h-10 flex items-center justify-center font-mono font-black text-lg',
                isTop3 && positionStyle ? positionStyle.text : 'text-esports-muted'
              )}>
                {player.position === 1 ? (
                  <Zap className="w-6 h-6 text-neon-cyan" />
                ) : (
                  <span className={player.position === 1 ? 'text-glow-cyan' : ''}>
                    #{player.position}
                  </span>
                )}
              </div>

              {/* Avatar */}
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onAvatarClick?.()
                }}
                className={cn(
                  'w-12 h-12 rounded-lg overflow-hidden transition-all duration-200',
                  'hover:scale-105 cursor-pointer',
                  'ring-1 ring-esports-border',
                  isTop3 && 'ring-2',
                  player.position === 1 && 'ring-neon-cyan/50',
                  player.position === 2 && 'ring-rank-2/50',
                  player.position === 3 && 'ring-rank-3/50',
                )}
              >
                <img
                  src={`/api/photo/${player.moyskladId}`}
                  alt={player.name}
                  className="w-full h-full object-cover"
                  style={{ objectPosition: 'center 35%', transform: 'scale(1.15)' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    if (target.nextElementSibling) {
                      (target.nextElementSibling as HTMLElement).style.display = 'flex'
                    }
                  }}
                />
                <div className="w-full h-full bg-esports-elevated items-center justify-center text-esports-muted font-bold hidden">
                  {initials}
                </div>
              </button>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <p className={cn(
                    'font-semibold truncate transition-colors',
                    'text-esports-text group-hover:text-white'
                  )}>
                    {player.name}
                  </p>

                  {/* Fired badge */}
                  {!player.isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 shrink-0">
                      Уволен
                    </span>
                  )}

                  {/* Challenger Badge */}
                  {player.isChallenger && player.challengerRank && (
                    <ChallengerBadge rank={player.challengerRank} className="shrink-0" />
                  )}

                  {/* Level Badge */}
                  <LevelBadge
                    level={player.power.level}
                    levelName={player.power.levelName}
                    levelIcon={player.power.levelIcon}
                    levelColor={player.power.levelColor}
                    size="sm"
                    className="shrink-0"
                  />

                  {/* Streak */}
                  {player.streak >= 3 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30">
                      <Flame className="w-3 h-3" />
                      {player.streak}
                    </span>
                  )}

                  {/* Position Change */}
                  {player.positionChange !== 0 && (
                    <span
                      title={player.positionChange > 0
                        ? `Был ${player.position + player.positionChange}, сейчас ${player.position}`
                        : `Был ${player.position - Math.abs(player.positionChange)}, сейчас ${player.position}`
                      }
                      className={cn(
                        'flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 cursor-help',
                        player.positionChange > 0
                          ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'text-destructive bg-destructive/10 border border-destructive/30'
                      )}
                    >
                      {player.positionChange > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          +{player.positionChange}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {player.positionChange}
                        </>
                      )}
                    </span>
                  )}

                  {/* Achievements */}
                  {player.badges?.length > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {player.badges.slice(0, 3).map((badge) => (
                        <span
                          key={badge.id}
                          className="text-sm"
                          title={badge.name}
                        >
                          {badge.icon || ACHIEVEMENT_ICONS[badge.code] || '🏅'}
                        </span>
                      ))}
                      {player.badges.length > 3 && (
                        <span className="text-xs text-esports-muted font-medium">
                          +{player.badges.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Store Badges */}
                {showStores && player.stores && player.stores.length > 0 && (
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    {player.stores.map((store) => (
                      <span
                        key={store.id}
                        className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-esports-elevated text-esports-muted border border-esports-border"
                        title={store.name}
                      >
                        {store.name.length > 12 ? store.name.slice(0, 12) + '…' : store.name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Progress Bar to Next Level */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-esports-elevated rounded-full overflow-hidden">
                    <motion.div
                      className={cn(
                        'h-full rounded-full',
                        getLevelProgressColor(player.power.level)
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${player.power.progressPercent}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-esports-muted w-9 text-right">
                    {Math.round(player.power.progressPercent)}%
                  </span>
                </div>

                {player.power.nextLevelPR && player.power.prToNextLevel > 0 && (
                  <p className="text-xs text-esports-muted mt-1">
                    До Lv.{player.power.level + 1}:{' '}
                    <span className="text-neon-yellow font-mono">{player.power.prToNextLevel} PR</span>
                  </p>
                )}
              </div>

              {/* Power Rating - Main Metric (вместо денег) */}
              <div className="text-right">
                <p className={cn(
                  'font-black text-xl font-score tracking-tight',
                  player.position === 1 ? 'text-neon-cyan text-glow-cyan' : 'text-neon-yellow'
                )}>
                  {player.power.totalPower} <span className="text-sm font-normal">PR</span>
                </p>

                {/* Stats (количества БЕЗ денег) */}
                <div className="flex items-center justify-end gap-2 text-xs text-esports-muted mt-0.5">
                  <span title="Чеки">{player.salesCount} чек.</span>
                  {player.shiftCount && player.shiftCount > 0 && (
                    <span title="Смены">{player.shiftCount} см.</span>
                  )}
                  {player.returnsCount && player.returnsCount > 0 && (
                    <span className="text-destructive" title="Возвраты">-{player.returnsCount}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
