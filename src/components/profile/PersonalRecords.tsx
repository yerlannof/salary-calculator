'use client'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/calculations'
import { Trophy, Flame, Calendar, Star } from 'lucide-react'

interface PersonalRecordsProps {
  bestDay?: { date: string; sales: number } | null
  maxStreak: number
  currentStreak: number
  totalSalesCount: number
  bestMonth?: { period: string; sales: number } | null
}

export function PersonalRecords({
  bestDay,
  maxStreak,
  currentStreak,
  totalSalesCount,
  bestMonth
}: PersonalRecordsProps) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  }

  const formatPeriod = (periodStr: string) => {
    const [year, month] = periodStr.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const records = [
    {
      icon: Trophy,
      label: 'Лучший день',
      value: bestDay ? formatMoney(bestDay.sales) : '—',
      sublabel: bestDay ? formatDate(bestDay.date) : 'Нет данных',
      color: 'text-neon-yellow',
      bgColor: 'bg-neon-yellow/10',
      borderColor: 'border-neon-yellow/30',
    },
    {
      icon: Flame,
      label: 'Макс. streak',
      value: `${maxStreak} дн.`,
      sublabel: currentStreak >= 3 ? `Сейчас: ${currentStreak} дн.` : 'Продолжай работать!',
      color: 'text-neon-magenta',
      bgColor: 'bg-neon-magenta/10',
      borderColor: 'border-neon-magenta/30',
      highlight: currentStreak >= maxStreak && currentStreak >= 3,
    },
    {
      icon: Calendar,
      label: 'Всего чеков',
      value: totalSalesCount.toString(),
      sublabel: 'За период',
      color: 'text-neon-cyan',
      bgColor: 'bg-neon-cyan/10',
      borderColor: 'border-neon-cyan/30',
    },
  ]

  // Add best month if available
  if (bestMonth) {
    records.push({
      icon: Star,
      label: 'Лучший месяц',
      value: formatMoney(bestMonth.sales),
      sublabel: formatPeriod(bestMonth.period),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      borderColor: 'border-emerald-400/30',
    })
  }

  return (
    <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-esports-border">
        <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
          <Trophy className="w-4 h-4 text-neon-yellow" />
          Личные рекорды
        </h3>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {records.map((record, idx) => {
            const Icon = record.icon
            return (
              <div
                key={idx}
                className={cn(
                  "rounded-lg p-3 border transition-all",
                  record.bgColor,
                  record.borderColor,
                  record.highlight && "ring-2 ring-neon-magenta animate-pulse"
                )}
              >
                <div className={cn("flex items-center gap-1 mb-1", record.color)}>
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{record.label}</span>
                </div>
                <p className={cn("text-lg font-bold font-score", record.color)}>
                  {record.value}
                </p>
                <p className="text-xs text-esports-muted">{record.sublabel}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
