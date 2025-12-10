/**
 * /play - GAMEOVER ARENA
 * Геймифицированный лидерборд с Power Rating (БЕЗ денег)
 */

'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '@/components/ui/skeleton'
import { PowerPodium } from '@/components/play/PowerPodium'
import { PlayerCard } from '@/components/play/PlayerCard'
import { Trophy, Gamepad2, Users, Target } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import type { DepartmentType } from '@/lib/supabase/types'
import type { LeaderboardResponse } from '@/lib/gamification/types'

const DEPARTMENTS = [
  { id: 'almaty' as DepartmentType, name: 'ALMATY', emoji: '🏔️', color: 'text-neon-cyan' },
  { id: 'astana' as DepartmentType, name: 'ASTANA', emoji: '🌆', color: 'text-neon-magenta' },
]

// Get current period (YYYY-MM)
function getCurrentPeriod(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function PlayPage() {
  const [department, setDepartment] = useState<DepartmentType>('almaty')
  const [period, setPeriod] = useState(getCurrentPeriod())

  // Fetch leaderboard data
  const { data, isLoading, error, refetch } = useQuery<LeaderboardResponse>({
    queryKey: ['play-leaderboard', department, period],
    queryFn: async () => {
      const res = await fetch(`/api/play/leaderboard?department=${department}&period=${period}`)
      if (!res.ok) throw new Error('Failed to fetch leaderboard')
      return res.json()
    },
  })

  const players = data?.players || []
  const topPlayers = players.slice(0, 3)
  const otherPlayers = players.slice(3)

  return (
    <div className="min-h-screen bg-esports-bg">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-esports-bg/95 backdrop-blur-sm border-b border-esports-border">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
                <Gamepad2 className="w-6 h-6 text-neon-cyan" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">GAMEOVER ARENA</h1>
                <p className="text-sm text-esports-muted">Power Rating Leaderboard</p>
              </div>
            </div>

            {/* Back to Calculator */}
            <Link
              href="/"
              className="px-4 py-2 bg-esports-card border border-esports-border rounded-lg text-sm font-semibold text-esports-text hover:bg-esports-elevated hover:text-white transition-all"
            >
              ← Калькулятор
            </Link>
          </div>

          {/* Period Selector */}
          <div className="mb-4">
            {/* Note: Period будет управляться через URL params в будущем */}
            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-esports-card border border-esports-border rounded-lg">
              <span className="text-sm font-semibold text-esports-text">
                {new Date(period + '-01').toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Department Tabs */}
          <div className="flex gap-2">
            {DEPARTMENTS.map((dept) => (
              <button
                key={dept.id}
                onClick={() => setDepartment(dept.id)}
                className={cn(
                  'flex-1 px-4 py-3 rounded-lg font-bold transition-all',
                  'border-2',
                  department === dept.id
                    ? 'bg-esports-elevated border-neon-cyan text-white'
                    : 'bg-esports-card border-esports-border text-esports-muted hover:border-esports-muted'
                )}
              >
                <span className="mr-2">{dept.emoji}</span>
                {dept.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container max-w-4xl mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-destructive">Ошибка загрузки данных</p>
            <button
              onClick={() => refetch()}
              className="mt-4 px-4 py-2 bg-esports-card border border-esports-border rounded-lg"
            >
              Попробовать снова
            </button>
          </div>
        ) : players.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-esports-muted mx-auto mb-4" />
            <p className="text-esports-muted">Нет данных за выбранный период</p>
          </div>
        ) : (
          <>
            {/* Stats Bar */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-3 gap-3 mb-6"
            >
              <div className="bg-esports-card border border-esports-border rounded-lg p-3 text-center">
                <Users className="w-5 h-5 text-neon-cyan mx-auto mb-1" />
                <p className="text-2xl font-black text-white">{players.length}</p>
                <p className="text-xs text-esports-muted">Игроков</p>
              </div>
              <div className="bg-esports-card border border-esports-border rounded-lg p-3 text-center">
                <Trophy className="w-5 h-5 text-neon-yellow mx-auto mb-1" />
                <p className="text-2xl font-black text-neon-yellow">
                  {data?.totals?.totalPower || 0}
                </p>
                <p className="text-xs text-esports-muted">Total PR</p>
              </div>
              <div className="bg-esports-card border border-esports-border rounded-lg p-3 text-center">
                <Target className="w-5 h-5 text-neon-magenta mx-auto mb-1" />
                <p className="text-2xl font-black text-neon-magenta">
                  {topPlayers.length > 0 ? topPlayers[0].power.totalPower : 0}
                </p>
                <p className="text-xs text-esports-muted">Top PR</p>
              </div>
            </motion.div>

            {/* Podium - Top 3 Challengers */}
            {topPlayers.length >= 3 && (
              <PowerPodium
                players={topPlayers}
                period={period}
                department={department}
              />
            )}

            {/* Rest of Players */}
            {otherPlayers.length > 0 && (
              <div className="space-y-3 mt-6">
                {otherPlayers.map((player, idx) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    index={idx + 3}
                    period={period}
                    departmentId={department}
                  />
                ))}
              </div>
            )}

            {/* Last Sync Info */}
            {data?.lastSync && (
              <div className="mt-6 text-center text-xs text-esports-muted">
                Последняя синхронизация:{' '}
                {new Date(data.lastSync.at).toLocaleString('ru-RU')}
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer with Link to Team Sales */}
      <div className="container max-w-4xl mx-auto px-4 pb-8">
        <Link
          href="/team-sales"
          className="block p-4 bg-esports-card border border-esports-border rounded-lg text-center hover:bg-esports-elevated hover:border-neon-cyan/50 transition-all group"
        >
          <div className="flex items-center justify-center gap-2">
            <Trophy className="w-5 h-5 text-neon-yellow" />
            <span className="font-bold text-esports-text group-hover:text-white">
              Директорский лидерборд (с деньгами)
            </span>
            <span className="text-neon-cyan">→</span>
          </div>
        </Link>
      </div>
    </div>
  )
}
