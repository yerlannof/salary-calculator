'use client'

import { cn } from '@/lib/utils'
import { formatMoney } from '@/lib/calculations'

interface DayData {
  date: string
  day: number
  sales: number
  netSales: number
  salesCount: number
}

interface ActivityCalendarProps {
  data: DayData[]
  period: string // YYYY-MM
  onDayClick?: (day: DayData) => void
}

export function ActivityCalendar({ data, period, onDayClick }: ActivityCalendarProps) {
  const [year, month] = period.split('-').map(Number)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() // 0 = Sunday

  // Adjust to Monday-first week (0 = Monday, 6 = Sunday)
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1

  // Create map for quick lookup
  const salesByDay: Record<number, DayData> = {}
  let maxSales = 0
  data.forEach(d => {
    salesByDay[d.day] = d
    if (d.sales > maxSales) maxSales = d.sales
  })

  // Generate calendar grid
  const weeks: (number | null)[][] = []
  let currentWeek: (number | null)[] = []

  // Empty cells before first day
  for (let i = 0; i < adjustedFirstDay; i++) {
    currentWeek.push(null)
  }

  // Days of month
  for (let day = 1; day <= daysInMonth; day++) {
    currentWeek.push(day)
    if (currentWeek.length === 7) {
      weeks.push(currentWeek)
      currentWeek = []
    }
  }

  // Fill remaining cells
  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null)
    }
    weeks.push(currentWeek)
  }

  // Get intensity color (0-4 levels)
  const getIntensity = (sales: number): number => {
    if (sales === 0 || !maxSales) return 0
    const ratio = sales / maxSales
    if (ratio >= 0.8) return 4
    if (ratio >= 0.5) return 3
    if (ratio >= 0.25) return 2
    return 1
  }

  const intensityColors: Record<number, string> = {
    0: 'bg-zinc-800/50',
    1: 'bg-cyan-900/60',
    2: 'bg-cyan-700/60',
    3: 'bg-cyan-500/60',
    4: 'bg-neon-cyan/80',
  }

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

  return (
    <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-esports-border">
        <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
          <svg className="w-4 h-4 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Календарь активности
        </h3>
      </div>

      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map((day, i) => (
            <div
              key={day}
              className={cn(
                "text-center text-xs font-medium py-1",
                i >= 5 ? "text-zinc-500" : "text-esports-muted"
              )}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="space-y-1">
          {weeks.map((week, weekIdx) => (
            <div key={weekIdx} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIdx) => {
                if (day === null) {
                  return <div key={dayIdx} className="aspect-square" />
                }

                const dayData = salesByDay[day]
                const hasSales = dayData && dayData.sales > 0
                const intensity = hasSales ? getIntensity(dayData.sales) : 0

                return (
                  <button
                    key={dayIdx}
                    onClick={() => dayData && onDayClick?.(dayData)}
                    disabled={!dayData}
                    className={cn(
                      "aspect-square rounded-md flex items-center justify-center text-xs font-medium relative transition-all",
                      intensityColors[intensity],
                      hasSales && "cursor-pointer hover:ring-2 hover:ring-neon-cyan/50",
                      !hasSales && "cursor-default",
                      intensity === 4 && "text-black font-bold",
                      intensity === 0 && "text-zinc-600"
                    )}
                    title={dayData ? `${day} числа: ${formatMoney(dayData.sales)} (${dayData.salesCount} чеков)` : `${day} числа: нет продаж`}
                  >
                    {day}
                    {hasSales && dayData.salesCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-neon-magenta" />
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 mt-4 text-xs text-esports-muted">
          <span>Меньше</span>
          {[0, 1, 2, 3, 4].map(level => (
            <div
              key={level}
              className={cn("w-4 h-4 rounded-sm", intensityColors[level])}
            />
          ))}
          <span>Больше</span>
        </div>
      </div>
    </div>
  )
}
