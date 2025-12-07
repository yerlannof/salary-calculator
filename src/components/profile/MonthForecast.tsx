'use client'

import { cn } from '@/lib/utils'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
import { TrendingUp, Target, Calendar } from 'lucide-react'

interface MonthForecastProps {
  currentSales: number
  daysWithSales: number
  period: string // YYYY-MM
}

export function MonthForecast({ currentSales, daysWithSales, period }: MonthForecastProps) {
  const [year, month] = period.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
  const currentDay = isCurrentMonth ? today.getDate() : daysInMonth

  // Average per shift day
  const avgPerDay = daysWithSales > 0 ? currentSales / daysWithSales : 0

  // Estimate remaining work days (assume ~20 work days per month)
  const workDaysPerMonth = 20
  const remainingWorkDays = isCurrentMonth
    ? Math.max(0, Math.round((workDaysPerMonth / daysInMonth) * (daysInMonth - currentDay)))
    : 0

  // Forecast
  const forecastSales = currentSales + (avgPerDay * remainingWorkDays)

  // Calculate forecast salary (simple linear projection ~8% average)
  const forecastSalary = Math.round(forecastSales * 0.08)

  // Progress through month
  const monthProgress = Math.round((currentDay / daysInMonth) * 100)

  // Pace indicator
  const expectedSalesAtThisPoint = (forecastSales / daysInMonth) * currentDay
  const paceRatio = expectedSalesAtThisPoint > 0 ? (currentSales / expectedSalesAtThisPoint) : 1
  const paceStatus = paceRatio >= 1 ? 'ahead' : paceRatio >= 0.8 ? 'on-track' : 'behind'

  if (!isCurrentMonth) {
    return null // Don't show forecast for past months
  }

  return (
    <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-esports-border">
        <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-neon-yellow" />
          Прогноз на месяц
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between text-xs text-esports-muted mb-1">
            <span>Прошло месяца</span>
            <span className="font-mono">{monthProgress}%</span>
          </div>
          <div className="h-2 bg-esports-elevated rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta transition-all duration-500"
              style={{ width: `${monthProgress}%` }}
            />
          </div>
        </div>

        {/* Pace indicator */}
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          paceStatus === 'ahead' && "bg-green-900/30 text-green-400",
          paceStatus === 'on-track' && "bg-cyan-900/30 text-cyan-400",
          paceStatus === 'behind' && "bg-red-900/30 text-red-400"
        )}>
          <Target className="w-4 h-4" />
          <span>
            {paceStatus === 'ahead' && 'Опережаешь темп!'}
            {paceStatus === 'on-track' && 'Идёшь по плану'}
            {paceStatus === 'behind' && 'Отстаёшь от темпа'}
          </span>
          <span className="ml-auto font-mono font-bold">
            {Math.round(paceRatio * 100)}%
          </span>
        </div>

        {/* Forecast stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-esports-elevated rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-esports-muted mb-1">
              <Calendar className="w-3 h-3" />
              Осталось смен
            </div>
            <p className="text-lg font-bold text-esports-text font-score">
              ~{remainingWorkDays}
            </p>
          </div>

          <div className="bg-esports-elevated rounded-lg p-3">
            <div className="flex items-center gap-1 text-xs text-esports-muted mb-1">
              <TrendingUp className="w-3 h-3" />
              В среднем/смену
            </div>
            <p className="text-lg font-bold text-neon-cyan font-score">
              {formatMoneyShort(avgPerDay)}
            </p>
          </div>
        </div>

        {/* Forecast result */}
        <div className="bg-gradient-to-r from-neon-cyan/10 to-neon-magenta/10 border border-neon-cyan/30 rounded-lg p-4">
          <p className="text-xs text-esports-muted mb-2">При текущем темпе к концу месяца:</p>
          <div className="flex items-baseline gap-4">
            <div>
              <p className="text-2xl font-black text-neon-yellow font-score text-glow-yellow">
                {formatMoneyShort(forecastSales)}
              </p>
              <p className="text-xs text-esports-muted">продажи</p>
            </div>
            <div>
              <p className="text-xl font-bold text-emerald-400 font-score">
                {formatMoney(forecastSalary)}
              </p>
              <p className="text-xs text-esports-muted">зарплата</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
