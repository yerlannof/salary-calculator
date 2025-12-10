/**
 * PowerPodium - подиум топ-3 с Power Rating вместо денег
 * Faceit-style Challenger система
 */

'use client'

import { motion } from 'framer-motion'
import { Zap, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ChallengerBadge } from './LevelBadge'
import Link from 'next/link'
import type { PlayerProfile } from '@/lib/gamification/types'

interface PowerPodiumProps {
  players: PlayerProfile[]
  period: string
  department: string
  className?: string
}

const POSITION_STYLES = {
  1: {
    text: 'text-neon-cyan',
    border: 'border-neon-cyan',
    bg: 'bg-neon-cyan/10',
    glow: 'glow-cyan',
    ring: 'ring-neon-cyan/50',
  },
  2: {
    text: 'text-rank-2',
    border: 'border-rank-2',
    bg: 'bg-rank-2/10',
    glow: '',
    ring: 'ring-rank-2/30',
  },
  3: {
    text: 'text-rank-3',
    border: 'border-rank-3',
    bg: 'bg-rank-3/10',
    glow: '',
    ring: 'ring-rank-3/30',
  },
}

export function PowerPodium({ players, period, department, className }: PowerPodiumProps) {
  if (!players || players.length < 3) return null

  return (
    <div className={cn('py-4', className)}>
      {/* Arcade Header */}
      <div className="text-center mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-esports-muted">
          ═══ CHALLENGERS ═══
        </h2>
      </div>

      {/* Podium Container */}
      <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
        {players.slice(0, 3).map((player, idx) => {
          const position = idx + 1
          const style = POSITION_STYLES[position as keyof typeof POSITION_STYLES]
          const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`
          const isFirst = position === 1

          return (
            <motion.div
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1, duration: 0.3 }}
            >
              <Link
                href={`/play/${player.moyskladId}?period=${period}&dept=${department}`}
                className={cn(
                  'flex items-center gap-4 p-4 transition-all duration-200 group',
                  'hover:bg-esports-elevated',
                  idx < 2 && 'border-b border-esports-border',
                  isFirst && 'border-l-4 border-l-neon-cyan'
                )}
              >
                {/* Position Icon/Number */}
                <div className={cn(
                  'w-12 h-12 flex items-center justify-center font-mono font-black text-2xl',
                  style.text
                )}>
                  {isFirst ? (
                    <Zap className="w-8 h-8 text-neon-cyan" />
                  ) : (
                    <span>#{position}</span>
                  )}
                </div>

                {/* Avatar */}
                <div className={cn(
                  'relative w-14 h-14 rounded-lg overflow-hidden',
                  'ring-2',
                  style.ring,
                  isFirst && 'border-glow-cyan'
                )}>
                  <img
                    src={`/api/photo/${player.moyskladId}`}
                    alt={player.name}
                    className="w-full h-full object-cover"
                    style={{ objectPosition: 'center 35%', transform: 'scale(1.1)' }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      target.parentElement!.innerHTML = `<div class="w-full h-full bg-esports-elevated flex items-center justify-center text-esports-muted font-bold text-lg">${initials}</div>`
                    }}
                  />

                  {/* Streak badge */}
                  {player.streak && player.streak >= 3 && (
                    <div className="absolute -bottom-1 -right-1 bg-neon-magenta/90 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold">
                      <Flame className="w-3 h-3" />
                      {player.streak}
                    </div>
                  )}
                </div>

                {/* Name & Level */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className={cn(
                      'font-bold truncate transition-colors',
                      isFirst ? 'text-white text-lg' : 'text-esports-text',
                      'group-hover:text-white'
                    )}>
                      {player.name}
                    </p>
                    {player.challengerRank && (
                      <ChallengerBadge rank={player.challengerRank} />
                    )}
                  </div>

                  {/* Level */}
                  <div className="flex items-center gap-2 text-sm">
                    <span>{player.power.levelIcon}</span>
                    <span className="text-esports-muted">Lv.{player.power.level}</span>
                    <span className={style.text}>{player.power.levelName}</span>
                  </div>
                </div>

                {/* Power Rating - Main Score */}
                <div className="text-right">
                  <p className={cn(
                    'font-black font-score text-2xl tracking-tight',
                    isFirst ? 'text-neon-cyan text-glow-cyan' : style.text
                  )}>
                    {player.power.totalPower}
                  </p>
                  <p className="text-xs text-esports-muted">POWER</p>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Separator */}
      <div className="mt-4 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />
    </div>
  )
}
