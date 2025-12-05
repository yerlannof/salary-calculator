'use client'

import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LevelBadge, LEVEL_CONFIG } from '@/components/calculator/LevelIcon'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'
import {
  Crown,
  Medal,
  ChevronRight,
  Flame,
  TrendingUp,
  TrendingDown,
  Swords,
} from 'lucide-react'
import Link from 'next/link'

interface AchievementBadge {
  id: string
  code: string
  name: string
  icon: string | null
}

interface EmployeeCardProps {
  employee: {
    id: string
    moysklad_id: string
    name: string
    firstName: string
    lastName: string
    isActive: boolean
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
    positionChange: number
    streak: number
    achievements: AchievementBadge[]
  }
  index: number
  period: string
  departmentId: string
}

const RANK_STYLES = {
  1: {
    gradient: 'from-yellow-500/30 via-amber-500/20 to-yellow-600/10',
    border: 'border-yellow-500/50',
    glow: 'shadow-[0_0_20px_rgba(251,191,36,0.2)]',
    ring: 'ring-yellow-500',
    icon: Crown,
    iconColor: 'text-yellow-400',
    numberColor: 'text-yellow-400',
  },
  2: {
    gradient: 'from-slate-400/30 via-slate-500/20 to-slate-600/10',
    border: 'border-slate-400/50',
    glow: 'shadow-[0_0_15px_rgba(148,163,184,0.15)]',
    ring: 'ring-slate-400',
    icon: Medal,
    iconColor: 'text-slate-300',
    numberColor: 'text-slate-300',
  },
  3: {
    gradient: 'from-orange-500/30 via-amber-600/20 to-orange-600/10',
    border: 'border-orange-500/50',
    glow: 'shadow-[0_0_15px_rgba(251,146,60,0.15)]',
    ring: 'ring-orange-500',
    icon: Medal,
    iconColor: 'text-orange-400',
    numberColor: 'text-orange-400',
  },
}

export function EmployeeCard({ employee, index, period, departmentId }: EmployeeCardProps) {
  const isTop3 = index < 3
  const rankStyle = RANK_STYLES[employee.position as keyof typeof RANK_STYLES]
  const levelConfig = LEVEL_CONFIG[employee.rank]
  const initials = `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`
  const Icon = rankStyle?.icon

  return (
    <motion.div
      initial={{ opacity: 0, x: -30, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      layout
    >
      <Link href={`/team-sales/${employee.moysklad_id}?period=${period}&dept=${departmentId}`}>
        <div
          className={cn(
            'relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer group',
            !employee.isActive && 'opacity-60',
            isTop3
              ? `bg-gradient-to-r ${rankStyle.gradient} border-2 ${rankStyle.border} ${rankStyle.glow}`
              : 'bg-gradient-to-r from-slate-900/80 to-slate-800/60 border border-slate-700/50 hover:border-slate-600/70 hover:shadow-[0_0_15px_rgba(100,116,139,0.1)]',
            'hover:scale-[1.02]'
          )}
        >
          {/* Metallic shine overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 pointer-events-none" />

          <div className="relative p-4">
            <div className="flex items-center gap-4">
              {/* Position & Avatar */}
              <div className="relative">
                {/* Avatar with glow */}
                <div
                  className={cn(
                    'w-14 h-14 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-110',
                    isTop3
                      ? `ring-2 ring-offset-2 ring-offset-background ${rankStyle.ring} shadow-lg`
                      : 'ring-1 ring-slate-600'
                  )}
                >
                  <img
                    src={`/api/photo/${employee.moysklad_id}`}
                    alt={employee.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex'
                      }
                    }}
                  />
                  <div className="w-full h-full bg-gradient-to-br from-slate-700 to-slate-900 items-center justify-center text-slate-300 font-bold hidden">
                    {initials}
                  </div>
                </div>

                {/* Position Badge */}
                <div
                  className={cn(
                    'absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center font-black text-sm',
                    isTop3
                      ? `bg-gradient-to-br ${rankStyle.gradient} border-2 ${rankStyle.border} ${rankStyle.numberColor}`
                      : 'bg-slate-800 border border-slate-600 text-slate-400'
                  )}
                >
                  {isTop3 && Icon ? (
                    <Icon className={cn('w-4 h-4', rankStyle.iconColor)} />
                  ) : (
                    employee.position
                  )}
                </div>

                {/* Streak flame */}
                {employee.streak >= 3 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -20 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="absolute -top-2 -left-2"
                  >
                    <div className="relative">
                      <Flame className="w-6 h-6 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white drop-shadow-md">
                        {employee.streak}
                      </span>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <p
                    className={cn(
                      'font-bold truncate transition-colors',
                      isTop3 ? 'text-white' : 'text-slate-100 group-hover:text-white'
                    )}
                  >
                    {employee.name}
                    {!employee.isActive && (
                      <span className="text-xs text-slate-500 ml-1">(неактив)</span>
                    )}
                  </p>

                  <LevelBadge levelName={employee.rank} className="shrink-0" />

                  {/* Achievements */}
                  {employee.achievements?.length > 0 && (
                    <div className="flex items-center gap-0.5 shrink-0">
                      {employee.achievements.slice(0, 3).map((ach) => (
                        <span
                          key={ach.id}
                          className="text-base drop-shadow-[0_0_4px_rgba(255,255,255,0.3)]"
                          title={ach.name}
                        >
                          {ach.icon || ACHIEVEMENT_ICONS[ach.code] || '🏅'}
                        </span>
                      ))}
                      {employee.achievements.length > 3 && (
                        <span className="text-xs text-slate-400 font-medium">
                          +{employee.achievements.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Position Change */}
                  {employee.positionChange !== 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        'flex items-center text-xs font-bold px-1.5 py-0.5 rounded shrink-0',
                        employee.positionChange > 0
                          ? 'text-emerald-400 bg-emerald-500/20'
                          : 'text-red-400 bg-red-500/20'
                      )}
                    >
                      {employee.positionChange > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3 mr-0.5" />
                          {employee.positionChange}
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-3 h-3 mr-0.5" />
                          {Math.abs(employee.positionChange)}
                        </>
                      )}
                    </motion.span>
                  )}
                </div>

                {/* XP Progress Bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
                    <motion.div
                      className={cn(
                        'h-full rounded-full relative',
                        levelConfig?.bg || 'bg-emerald-500'
                      )}
                      initial={{ width: 0 }}
                      animate={{ width: `${employee.progress}%` }}
                      transition={{ duration: 0.6, delay: index * 0.05, ease: 'easeOut' }}
                    >
                      {/* Shine effect on progress bar */}
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                    </motion.div>
                  </div>
                  <span className="text-xs font-medium text-slate-400 w-10 text-right">
                    {Math.round(employee.progress)}%
                  </span>
                </div>

                {employee.nextRank && employee.salesUntilNext > 0 && (
                  <p className="text-xs text-slate-500 mt-1">
                    До <span className="text-slate-400">{employee.nextRank}</span>:{' '}
                    <span className="text-emerald-400">{formatMoneyShort(employee.salesUntilNext)}</span>
                  </p>
                )}
              </div>

              {/* Sales & Salary */}
              <div className="text-right">
                <p
                  className={cn(
                    'font-black text-xl tracking-tight',
                    isTop3 ? rankStyle.numberColor : 'text-white'
                  )}
                >
                  {formatMoneyShort(employee.netSales)}
                </p>
                <p className="text-sm font-semibold text-emerald-400">
                  {formatMoney(employee.salary)}
                </p>
                <div className="flex items-center justify-end gap-1 text-xs text-slate-500 mt-0.5">
                  <Swords className="w-3 h-3" />
                  <span>{employee.salesCount}</span>
                  {employee.shiftCount && (
                    <span className="text-slate-400">• {employee.shiftCount} см</span>
                  )}
                  {employee.returnsCount > 0 && (
                    <span className="text-red-400">• -{employee.returnsCount}</span>
                  )}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
