'use client'

import { formatMoneyShort } from '@/lib/calculations'
import { LevelBadge, LEVEL_CONFIG } from '@/components/calculator/LevelIcon'
import { ArrowRight, Star } from 'lucide-react'

interface LevelProgressWidgetProps {
  currentSales: number
  rank: string
  nextRank: string | null
  salesUntilNext: number
  progress: number
}

export function LevelProgressWidget({
  currentSales,
  rank,
  nextRank,
  salesUntilNext,
  progress
}: LevelProgressWidgetProps) {
  const currentLevel = LEVEL_CONFIG[rank]
  const nextLevel = nextRank ? LEVEL_CONFIG[nextRank] : null
  const CurrentIcon = currentLevel?.icon
  const NextIcon = nextLevel?.icon

  // Calculate thresholds from current data
  const salesAtLevelStart = currentSales - (progress / 100) * salesUntilNext / (1 - progress / 100) || 0
  const nextMinSales = currentSales + salesUntilNext

  return (
    <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-esports-border">
        <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
          <Star className="w-4 h-4 text-neon-magenta" />
          Прогресс уровня
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Current vs Next Level */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-center">
            <div className="text-3xl mb-1">
              {CurrentIcon && <CurrentIcon className="w-8 h-8 mx-auto text-neon-cyan" />}
            </div>
            <LevelBadge levelName={rank} />
            <p className="text-xs text-esports-muted mt-1">Текущий</p>
          </div>

          {nextRank && (
            <>
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="w-5 h-5 text-esports-muted" />
                <span className="text-xs text-neon-yellow font-mono font-bold">
                  {formatMoneyShort(salesUntilNext)}
                </span>
              </div>

              <div className="flex-1 text-center opacity-60">
                <div className="text-3xl mb-1">
                  {NextIcon && <NextIcon className="w-8 h-8 mx-auto text-esports-muted" />}
                </div>
                <LevelBadge levelName={nextRank} />
                <p className="text-xs text-esports-muted mt-1">Следующий</p>
              </div>
            </>
          )}

          {!nextRank && (
            <div className="flex-1 text-center">
              <div className="text-3xl mb-1">
                <span className="text-2xl text-neon-magenta">MAX</span>
              </div>
              <span className="text-xs font-bold text-neon-magenta px-2 py-1 rounded bg-neon-magenta/20 border border-neon-magenta/30">
                Максимум!
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {nextRank && (
          <div>
            <div className="flex justify-between text-xs text-esports-muted mb-2">
              <span>{formatMoneyShort(Math.max(0, salesAtLevelStart))}</span>
              <span className="text-neon-cyan font-mono font-bold">
                {formatMoneyShort(currentSales)}
              </span>
              <span>{formatMoneyShort(nextMinSales)}</span>
            </div>
            <div className="h-3 bg-esports-elevated rounded-full overflow-hidden relative">
              {/* Background gradient */}
              <div className="absolute inset-0 bg-gradient-to-r from-zinc-800 via-zinc-700 to-neon-cyan/20" />
              {/* Progress fill */}
              <div
                className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta transition-all duration-500 relative"
                style={{ width: `${Math.min(100, progress)}%` }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
              {/* Milestones */}
              {[25, 50, 75].map(milestone => (
                <div
                  key={milestone}
                  className="absolute top-0 bottom-0 w-px bg-zinc-600"
                  style={{ left: `${milestone}%` }}
                />
              ))}
            </div>
            <p className="text-center text-xs text-esports-muted mt-2">
              <span className="font-mono font-bold text-neon-cyan">{Math.round(progress)}%</span> до следующего уровня
            </p>
          </div>
        )}

        {/* Max level celebration */}
        {!nextRank && (
          <div className="text-center py-4">
            <p className="text-neon-magenta font-bold">Ты достиг максимального уровня!</p>
            <p className="text-xs text-esports-muted mt-1">Продолжай в том же духе</p>
          </div>
        )}
      </div>
    </div>
  )
}
