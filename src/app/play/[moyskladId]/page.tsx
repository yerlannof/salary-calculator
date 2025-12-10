/**
 * /play/[moyskladId] - Личный профиль игрока
 * С ПОЛНОЙ информацией включая ЗП (приватно)
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { LevelBadge, ChallengerBadge } from '@/components/play/LevelBadge'
import { formatMoney } from '@/lib/calculations'
import { getLevelProgressColor } from '@/lib/gamification/power'

// Get current period (YYYY-MM)
function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'
import {
  ArrowLeft,
  Flame,
  Lock,
  TrendingUp,
  TrendingDown,
  Zap,
  Shield,
  Award,
  Target,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { PlayerProfileResponse } from '@/lib/gamification/types'

export default function PlayerProfilePage({ params }: { params: { moyskladId: string } }) {
  const [period, setPeriod] = useState(getCurrentPeriod())

  // Fetch player data
  const { data, isLoading, error } = useQuery<PlayerProfileResponse>({
    queryKey: ['player-profile', params.moyskladId, period],
    queryFn: async () => {
      const res = await fetch(`/api/play/profile/${params.moyskladId}?period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch profile')
      return res.json()
    },
  })

  const player = data?.player

  return (
    <div className="min-h-screen bg-esports-bg pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-esports-bg/95 backdrop-blur-sm border-b border-esports-border">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/play"
              className="flex items-center gap-2 text-esports-muted hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к лидерборду</span>
            </Link>
          </div>

          {/* Period Display */}
          <div className="flex items-center justify-center gap-2 px-4 py-2 bg-esports-card border border-esports-border rounded-lg">
            <span className="text-sm font-semibold text-esports-text">
              {new Date(period + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-2xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error || !player ? (
          <div className="text-center py-12">
            <p className="text-destructive">Ошибка загрузки профиля</p>
          </div>
        ) : (
          <>
            {/* Hero Section - Avatar & Name */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-6"
            >
              <div className="relative inline-block mb-4">
                <img
                  src={`/api/photo/${player.moyskladId}`}
                  alt={player.name}
                  className="w-24 h-24 rounded-full object-cover ring-4 ring-neon-cyan/50"
                  style={{ objectPosition: 'center 35%', transform: 'scale(1.15)' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    const initials = `${player.firstName?.[0] || ''}${player.lastName?.[0] || ''}`
                    target.style.display = 'none'
                    target.parentElement!.innerHTML = `<div class="w-24 h-24 rounded-full bg-esports-elevated flex items-center justify-center text-2xl font-bold text-esports-muted ring-4 ring-neon-cyan/50">${initials}</div>`
                  }}
                />
                {player.isChallenger && player.challengerRank && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                    <ChallengerBadge rank={player.challengerRank} />
                  </div>
                )}
              </div>

              <h1 className="text-2xl font-black text-white mb-2">{player.name}</h1>
              <LevelBadge
                level={player.power.level}
                levelName={player.power.levelName}
                levelIcon={player.power.levelIcon}
                levelColor={player.power.levelColor}
                size="lg"
              />
            </motion.div>

            {/* Power Rating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 20 }}
              transition={{ delay: 0.1 }}
              className="bg-esports-card border border-esports-border rounded-lg p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-neon-cyan" />
                <h2 className="text-lg font-bold text-white">POWER RATING</h2>
              </div>

              <p className="text-5xl font-black text-neon-cyan text-center mb-4">
                {player.power.totalPower} <span className="text-xl text-esports-muted">PR</span>
              </p>

              {/* Progress to Next Level */}
              {player.power.nextLevelPR && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-esports-muted mb-2">
                    <span>Lv.{player.power.level} {player.power.levelName}</span>
                    <span>Lv.{player.power.level + 1}</span>
                  </div>
                  <div className="h-3 bg-esports-elevated rounded-full overflow-hidden">
                    <div
                      style={{ width: `${player.power.progressPercent}%` }}
                      className={cn(
                        'h-full rounded-full transition-all',
                        getLevelProgressColor(player.power.level)
                      )}
                    />
                  </div>
                  <p className="text-xs text-center text-esports-muted mt-2">
                    {player.power.prToNextLevel} PR до следующего уровня
                  </p>
                </div>
              )}

              {/* Power Breakdown */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-esports-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">💰</span>
                    <span className="text-xs text-esports-muted">База</span>
                  </div>
                  <p className="text-xl font-bold text-white">{player.power.basePower}</p>
                </div>
                <div className="bg-esports-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">⭐</span>
                    <span className="text-xs text-esports-muted">Качество</span>
                  </div>
                  <p className="text-xl font-bold text-neon-cyan">+{player.power.qualityBonus}</p>
                </div>
                <div className="bg-esports-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🔥</span>
                    <span className="text-xs text-esports-muted">Серия</span>
                  </div>
                  <p className="text-xl font-bold text-neon-magenta">+{player.power.streakBonus}</p>
                </div>
                <div className="bg-esports-elevated rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎯</span>
                    <span className="text-xs text-esports-muted">Челленджи</span>
                  </div>
                  <p className="text-xl font-bold text-neon-yellow">+{player.power.challengeBonus}</p>
                </div>
              </div>
            </motion.div>

            {/* PRIVATE SECTION - Salary & Sales */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-gradient-to-br from-neon-yellow/5 to-neon-magenta/5 border-2 border-dashed border-neon-yellow/30 rounded-lg p-6 mb-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <Lock className="w-5 h-5 text-neon-yellow" />
                <h2 className="text-lg font-bold text-white">ТОЛЬКО ДЛЯ ТЕБЯ</h2>
              </div>

              {/* Salary */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-esports-muted mb-2">💰 Зарплата</h3>
                <p className="text-3xl font-black text-emerald-400 mb-2">
                  {formatMoney(player.salary.total)}
                </p>
                <div className="flex gap-4 text-sm text-esports-muted">
                  <span>Оклад: {formatMoney(player.salary.base)}</span>
                  <span>Бонус: {formatMoney(player.salary.bonus)}</span>
                </div>
              </div>

              {/* Sales */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-esports-muted mb-2">📊 Продажи</h3>
                <p className="text-2xl font-bold text-white mb-2">
                  {formatMoney(player.sales.net)}
                </p>
                <div className="flex gap-4 text-sm text-esports-muted">
                  <span>Всего: {formatMoney(player.sales.gross)}</span>
                  {player.sales.returns > 0 && (
                    <span className="text-destructive">Возвраты: -{formatMoney(player.sales.returns)}</span>
                  )}
                </div>
              </div>

              {/* Checks */}
              <div>
                <h3 className="text-sm font-semibold text-esports-muted mb-2">🧾 Чеки</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xl font-bold text-white">{player.checks.count}</p>
                    <p className="text-xs text-esports-muted">Всего чеков</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold text-white">{formatMoney(player.checks.avgCheck)}</p>
                    <p className="text-xs text-esports-muted">Средний чек</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Position & Streak */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="grid grid-cols-2 gap-4 mb-6"
            >
              <div className="bg-esports-card border border-esports-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-neon-cyan" />
                  <span className="text-sm text-esports-muted">Позиция</span>
                </div>
                <p className="text-4xl font-black text-neon-cyan">#{player.position}</p>
                {player.positionChange !== 0 && (
                  <div className={cn(
                    'mt-2 inline-flex items-center gap-1 text-sm font-bold',
                    player.positionChange > 0 ? 'text-neon-cyan' : 'text-destructive'
                  )}>
                    {player.positionChange > 0 ? (
                      <>
                        <TrendingUp className="w-4 h-4" />
                        +{player.positionChange}
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-4 h-4" />
                        {player.positionChange}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-esports-card border border-esports-border rounded-lg p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="w-5 h-5 text-neon-magenta" />
                  <span className="text-sm text-esports-muted">Streak</span>
                </div>
                <p className="text-4xl font-black text-neon-magenta">{player.streak}</p>
                {player.maxStreak && player.maxStreak > player.streak && (
                  <p className="text-xs text-esports-muted mt-2">
                    Макс: {player.maxStreak}
                  </p>
                )}
              </div>
            </motion.div>

            {/* Badges */}
            {player.badges && player.badges.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-esports-card border border-esports-border rounded-lg p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-neon-yellow" />
                  <h2 className="text-lg font-bold text-white">Достижения</h2>
                </div>
                <div className="flex flex-wrap gap-3">
                  {player.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center gap-2 bg-esports-elevated rounded-lg px-3 py-2 border border-esports-border"
                      title={badge.name}
                    >
                      <span className="text-2xl">{badge.icon || ACHIEVEMENT_ICONS[badge.code] || '🏅'}</span>
                      <span className="text-sm font-semibold text-esports-text">{badge.name}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function Trophy({ className }: { className?: string }) {
  return <Target className={className} />
}
