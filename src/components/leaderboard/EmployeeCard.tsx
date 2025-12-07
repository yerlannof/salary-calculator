'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LevelBadge } from '@/components/calculator/LevelIcon'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'
import {
  ChevronRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Zap,
} from 'lucide-react'
import Link from 'next/link'

interface AchievementBadge {
  id: string
  code: string
  name: string
  icon: string | null
}

interface StoreInfo {
  id: string
  name: string
}

interface EmployeeCardProps {
  employee: {
    id: string
    moysklad_id: string
    name: string
    firstName: string
    lastName: string
    isActive: boolean
    totalSales: number
    totalReturns: number
    netSales: number
    salary: number
    salesCount: number
    shiftCount?: number
    returnsCount: number
    rank: string
    progress: number
    nextRank: string | null
    salesUntilNext: number
    position: number
    prevPosition: number | null
    positionChange: number
    streak: number
    achievements: AchievementBadge[]
    stores?: StoreInfo[]
  }
  index: number
  period: string
  departmentId: string
  showStores?: boolean
  onAvatarClick?: () => void
}

// Esports rank colors - only for position indicator
const POSITION_COLORS: Record<number, { text: string; border: string; bg: string }> = {
  1: { text: 'text-neon-cyan', border: 'border-l-neon-cyan', bg: 'bg-neon-cyan/10' },
  2: { text: 'text-rank-2', border: 'border-l-rank-2', bg: 'bg-rank-2/10' },
  3: { text: 'text-rank-3', border: 'border-l-rank-3', bg: 'bg-rank-3/10' },
}

export function EmployeeCard({ employee, index, period, departmentId, showStores, onAvatarClick }: EmployeeCardProps) {
  const isTop3 = employee.position <= 3
  const positionStyle = POSITION_COLORS[employee.position]
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
    >
      <Link href={`/team-sales/${employee.moysklad_id}?period=${period}&dept=${departmentId}`}>
        <div
          className={cn(
            'relative overflow-hidden rounded-lg transition-all duration-200 cursor-pointer group',
            'bg-esports-card border border-esports-border',
            'hover:bg-esports-elevated hover:border-esports-muted',
            !employee.isActive && 'opacity-50',
            // Top-3 get colored left border
            isTop3 && positionStyle && `border-l-4 ${positionStyle.border}`,
            // #1 gets subtle glow
            employee.position === 1 && 'border-glow-cyan'
          )}
        >
          <div className="relative p-4">
            <div className="flex items-center gap-4">
              {/* Position Number - Arcade Style */}
              <div className={cn(
                'w-10 h-10 flex items-center justify-center font-mono font-black text-lg',
                isTop3 && positionStyle ? positionStyle.text : 'text-esports-muted'
              )}>
                {employee.position === 1 ? (
                  <Zap className="w-6 h-6 text-neon-cyan" />
                ) : (
                  <span className={employee.position === 1 ? 'text-glow-cyan' : ''}>
                    #{employee.position}
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
                  employee.position === 1 && 'ring-neon-cyan/50',
                  employee.position === 2 && 'ring-rank-2/50',
                  employee.position === 3 && 'ring-rank-3/50',
                )}
              >
                <img
                  src={`/api/photo/${employee.moysklad_id}`}
                  alt={employee.name}
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
                    {employee.name}
                  </p>

                  {/* Fired badge */}
                  {!employee.isActive && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-destructive/20 text-destructive border border-destructive/30 shrink-0">
                      Уволен
                    </span>
                  )}

                  <LevelBadge levelName={employee.rank} className="shrink-0" />

                  {/* Streak badge - simplified */}
                  {employee.streak >= 3 && (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs font-bold bg-neon-magenta/20 text-neon-magenta border border-neon-magenta/30">
                      <Flame className="w-3 h-3" />
                      {employee.streak}
                    </span>
                  )}

                  {/* Position Change */}
                  {employee.positionChange !== 0 && (
                    <span
                      title={employee.positionChange > 0
                        ? `Был ${employee.position + employee.positionChange}, сейчас ${employee.position}`
                        : `Был ${employee.position - Math.abs(employee.positionChange)}, сейчас ${employee.position}`
                      }
                      className={cn(
                        'flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 cursor-help',
                        employee.positionChange > 0
                          ? 'text-neon-cyan bg-neon-cyan/10 border border-neon-cyan/30'
                          : 'text-destructive bg-destructive/10 border border-destructive/30'
                      )}
                    >
                      {employee.positionChange > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          +{employee.positionChange}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {employee.positionChange}
                        </>
                      )}
                    </span>
                  )}

                  {/* Achievements */}
                  {employee.achievements?.length > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {employee.achievements.slice(0, 3).map((ach) => (
                        <span
                          key={ach.id}
                          className="text-sm"
                          title={ach.name}
                        >
                          {ach.icon || ACHIEVEMENT_ICONS[ach.code] || '🏅'}
                        </span>
                      ))}
                      {employee.achievements.length > 3 && (
                        <span className="text-xs text-esports-muted font-medium">
                          +{employee.achievements.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Store Badges */}
                {showStores && employee.stores && employee.stores.length > 0 && (
                  <div className="flex items-center gap-1 mb-1.5 flex-wrap">
                    {employee.stores.map((store) => (
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

                {/* Progress Bar - Esports Style */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-esports-elevated rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-neon-cyan"
                      initial={{ width: 0 }}
                      animate={{ width: `${employee.progress}%` }}
                      transition={{ duration: 0.5, delay: index * 0.03 }}
                    />
                  </div>
                  <span className="text-xs font-mono text-esports-muted w-9 text-right">
                    {Math.round(employee.progress)}%
                  </span>
                </div>

                {employee.nextRank && employee.salesUntilNext > 0 && (
                  <p className="text-xs text-esports-muted mt-1">
                    До <span className="text-esports-text">{employee.nextRank}</span>:{' '}
                    <span className="text-neon-yellow font-mono">{formatMoneyShort(employee.salesUntilNext)}</span>
                  </p>
                )}
              </div>

              {/* Sales & Salary - Arcade Score Style */}
              <div className="text-right">
                <p className={cn(
                  'font-black text-xl font-score tracking-tight',
                  employee.position === 1 ? 'text-neon-cyan text-glow-cyan' : 'text-neon-yellow'
                )}>
                  {formatMoneyShort(employee.netSales)}
                </p>
                {/* Breakdown if returns exist */}
                {employee.totalReturns > 0 && (
                  <p className="text-[10px] text-esports-muted -mt-0.5" title="Продажи - Возвраты">
                    <span className="text-esports-text">{formatMoneyShort(employee.totalSales)}</span>
                    <span className="text-destructive"> -{formatMoneyShort(employee.totalReturns)}</span>
                  </p>
                )}
                <p className="text-sm font-semibold text-emerald-400 font-score">
                  {formatMoney(employee.salary)}
                </p>
                <div className="flex items-center justify-end gap-2 text-xs text-esports-muted mt-0.5">
                  <span title="Чеки">{employee.salesCount} чек.</span>
                  {employee.shiftCount && employee.shiftCount > 0 && (
                    <span title="Смены">{employee.shiftCount} см.</span>
                  )}
                  {employee.returnsCount > 0 && (
                    <span className="text-destructive" title="Возвраты">-{employee.returnsCount}</span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-esports-muted group-hover:text-esports-text group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
