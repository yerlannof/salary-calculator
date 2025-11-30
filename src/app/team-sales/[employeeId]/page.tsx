"use client"

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { calculateSalary, formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LOCATIONS } from '@/config/salary-scales'
import { LevelBadge, LEVEL_CONFIG } from '@/components/calculator/LevelIcon'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Target,
  Award,
  BarChart3,
  Minus,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const DEPARTMENTS: Record<string, { name: string; roleId: string; locationId: string; baseSalary: number }> = {
  moscow: { name: 'ТРЦ Москва', roleId: 'trc-seller', locationId: 'trc-moscow', baseSalary: 40000 },
  online: { name: 'Онлайн', roleId: 'online-manager', locationId: 'online', baseSalary: 50000 },
  tsum: { name: 'ТД ЦУМ', roleId: 'tsum-admin', locationId: 'td-tsum', baseSalary: 80000 },
}

interface DailySales {
  date: string
  sales: number
  count: number
}

interface SalesData {
  totalSales: number
  salesCount: number
  dailySales: DailySales[]
}

// Animated number counter
function AnimatedNumber({ value, format = 'money' }: { value: number; format?: 'money' | 'number' }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000
    const steps = 30
    const stepValue = value / steps
    let current = 0
    const interval = setInterval(() => {
      current += stepValue
      if (current >= value) {
        setDisplayValue(value)
        clearInterval(interval)
      } else {
        setDisplayValue(Math.floor(current))
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [value])

  if (format === 'money') {
    return <>{formatMoneyShort(displayValue)}</>
  }
  return <>{displayValue}</>
}

// Mini bar chart for daily sales
function DailyChart({ data, maxValue }: { data: DailySales[]; maxValue: number }) {
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((day, i) => {
        const height = maxValue > 0 ? (day.sales / maxValue) * 100 : 0
        const isToday = new Date(day.date).toDateString() === new Date().toDateString()
        return (
          <motion.div
            key={day.date}
            initial={{ height: 0 }}
            animate={{ height: `${Math.max(height, 2)}%` }}
            transition={{ duration: 0.5, delay: i * 0.02 }}
            className={cn(
              "flex-1 rounded-t-sm min-h-[2px] relative group cursor-pointer",
              day.sales > 0
                ? isToday
                  ? "bg-primary"
                  : "bg-primary/60 hover:bg-primary/80"
                : "bg-muted/30"
            )}
          >
            {/* Tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
              <div className="bg-popover border rounded-lg px-2 py-1 shadow-lg whitespace-nowrap text-xs">
                <p className="font-medium">{new Date(day.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</p>
                <p className="text-primary">{formatMoneyShort(day.sales)}</p>
                <p className="text-muted-foreground">{day.count} продаж</p>
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

async function fetchSales(employeeId: string, period: string): Promise<SalesData> {
  const response = await fetch(`/api/moysklad/sales?employeeId=${employeeId}&period=${period}`)
  return response.json()
}

async function fetchEmployee(employeeId: string) {
  const response = await fetch(`/api/moysklad/employees`)
  const data = await response.json()
  return data.employees?.find((e: { id: string }) => e.id === employeeId) || null
}

export default function EmployeeDetailPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const employeeId = params.employeeId as string
  const period = searchParams.get('period') || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const deptId = searchParams.get('dept') || 'online'
  const dept = DEPARTMENTS[deptId]

  // Get previous month
  const [year, month] = period.split('-').map(Number)
  const prevDate = new Date(year, month - 2)
  const prevPeriod = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`

  const getRoleConfig = () => {
    const location = LOCATIONS.find(l => l.id === dept.locationId)
    return location?.roles.find(r => r.id === dept.roleId)
  }

  // Fetch employee info
  const { data: employee, isLoading: loadingEmployee } = useQuery({
    queryKey: ['employee', employeeId],
    queryFn: () => fetchEmployee(employeeId),
  })

  // Fetch current month sales
  const { data: currentSales, isLoading: loadingSales } = useQuery({
    queryKey: ['sales', employeeId, period],
    queryFn: () => fetchSales(employeeId, period),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch previous month sales for comparison
  const { data: prevSales } = useQuery({
    queryKey: ['sales', employeeId, prevPeriod],
    queryFn: () => fetchSales(employeeId, prevPeriod),
    staleTime: 5 * 60 * 1000,
  })

  const roleConfig = getRoleConfig()
  const salaryResult = currentSales && roleConfig
    ? calculateSalary(currentSales.totalSales, roleConfig)
    : null

  const prevSalaryResult = prevSales && roleConfig
    ? calculateSalary(prevSales.totalSales, roleConfig)
    : null

  const currentTier = salaryResult?.currentTier
  const levelConfig = currentTier ? LEVEL_CONFIG[currentTier.levelName] : null

  // Calculate comparison
  const salesDiff = currentSales && prevSales
    ? currentSales.totalSales - prevSales.totalSales
    : 0
  const salesDiffPercent = prevSales?.totalSales
    ? ((salesDiff / prevSales.totalSales) * 100).toFixed(1)
    : '0'

  // Daily chart data
  const dailyData = currentSales?.dailySales || []
  const maxDailySales = Math.max(...dailyData.map(d => d.sales), 0)

  // Best day
  const bestDay = dailyData.length > 0
    ? dailyData.reduce((best, day) => day.sales > best.sales ? day : best, dailyData[0])
    : null

  // Average daily
  const daysWithSales = dailyData.filter(d => d.sales > 0).length
  const avgDaily = daysWithSales > 0 ? (currentSales?.totalSales || 0) / daysWithSales : 0

  const formatPeriod = (p: string) => {
    const [y, m] = p.split('-')
    const date = new Date(parseInt(y), parseInt(m) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const isLoading = loadingEmployee || loadingSales

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Link href={`/team-sales?dept=${deptId}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              {isLoading ? (
                <Skeleton className="h-6 w-32" />
              ) : (
                <>
                  <h1 className="text-lg font-bold flex items-center gap-2">
                    {employee?.name || 'Сотрудник'}
                    {currentTier && <LevelBadge levelName={currentTier.levelName} />}
                  </h1>
                  <p className="text-xs text-muted-foreground">{formatPeriod(period)}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Loading */}
        {isLoading && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[1, 2].map(i => (
                <Card key={i} className="bg-card/50">
                  <CardContent className="p-4">
                    <Skeleton className="h-4 w-16 mb-2" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
            <Card className="bg-card/50">
              <CardContent className="p-4">
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          </div>
        )}

        {!isLoading && currentSales && (
          <>
            {/* Main Stats */}
            <div className="grid grid-cols-2 gap-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-emerald-400 mb-1">
                      <TrendingUp className="w-4 h-4" />
                      <span className="text-xs font-medium">Продажи</span>
                    </div>
                    <p className="text-2xl font-bold">
                      <AnimatedNumber value={currentSales.totalSales} />
                    </p>
                    {/* Comparison */}
                    <div className={cn(
                      "flex items-center gap-1 text-xs mt-1",
                      salesDiff > 0 ? "text-emerald-400" : salesDiff < 0 ? "text-red-400" : "text-muted-foreground"
                    )}>
                      {salesDiff > 0 ? <TrendingUp className="w-3 h-3" /> : salesDiff < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                      <span>{salesDiff >= 0 ? '+' : ''}{salesDiffPercent}% vs прошлый месяц</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-violet-500/30">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-violet-400 mb-1">
                      <Wallet className="w-4 h-4" />
                      <span className="text-xs font-medium">Зарплата</span>
                    </div>
                    <p className="text-2xl font-bold">
                      <AnimatedNumber value={salaryResult?.totalSalary || 0} />
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Оклад {formatMoney(dept.baseSalary)} + бонус
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Level Progress */}
            {currentTier && salaryResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card className={cn("border", levelConfig?.bg?.replace('bg-', 'border-') + '/30')}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Award className={cn("w-5 h-5", levelConfig?.color)} />
                        <span className="font-semibold">{currentTier.levelName}</span>
                      </div>
                      {salaryResult.nextTier && (
                        <span className="text-xs text-muted-foreground">
                          До {salaryResult.nextTier.levelName}: {formatMoneyShort(salaryResult.salesUntilNextTier)}
                        </span>
                      )}
                    </div>
                    <div className="h-3 bg-muted/30 rounded-full overflow-hidden">
                      <motion.div
                        className={cn("h-full rounded-full", levelConfig?.bg || "bg-primary")}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, ((currentSales.totalSales - currentTier.minSales) / (currentTier.maxSales - currentTier.minSales)) * 100)}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground mt-2">
                      <span>{formatMoneyShort(currentTier.minSales)}</span>
                      <span className="text-primary font-medium">{currentTier.percent}%</span>
                      <span>{formatMoneyShort(currentTier.maxSales)}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Daily Chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">Продажи по дням</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{currentSales.salesCount} продаж</span>
                  </div>

                  {dailyData.length > 0 ? (
                    <DailyChart data={dailyData} maxValue={maxDailySales} />
                  ) : (
                    <div className="h-24 flex items-center justify-center text-muted-foreground text-sm">
                      Нет данных
                    </div>
                  )}

                  {/* Day labels */}
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    {dailyData.length > 0 && (
                      <>
                        <span>{new Date(dailyData[0].date).getDate()}</span>
                        <span>{new Date(dailyData[Math.floor(dailyData.length / 2)]?.date || dailyData[0].date).getDate()}</span>
                        <span>{new Date(dailyData[dailyData.length - 1].date).getDate()}</span>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-3">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <Calendar className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{daysWithSales}</p>
                    <p className="text-xs text-muted-foreground">Дней с продажами</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <Target className="w-4 h-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold">{formatMoneyShort(avgDaily)}</p>
                    <p className="text-xs text-muted-foreground">Средняя/день</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                <Card className="bg-card/50">
                  <CardContent className="p-3 text-center">
                    <Award className="w-4 h-4 mx-auto text-yellow-500 mb-1" />
                    <p className="text-lg font-bold">{bestDay ? formatMoneyShort(bestDay.sales) : '-'}</p>
                    <p className="text-xs text-muted-foreground">Лучший день</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Previous Month Comparison */}
            {prevSales && prevSalaryResult && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
                <Card className="bg-muted/20 border-dashed">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium mb-3">Сравнение с {formatPeriod(prevPeriod)}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Продажи</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatMoneyShort(prevSales.totalSales)}</span>
                          <span className={cn(
                            "text-xs",
                            salesDiff > 0 ? "text-emerald-400" : salesDiff < 0 ? "text-red-400" : ""
                          )}>
                            {salesDiff >= 0 ? '+' : ''}{formatMoneyShort(salesDiff)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Зарплата</p>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatMoney(prevSalaryResult.totalSalary)}</span>
                          <span className={cn(
                            "text-xs",
                            (salaryResult?.totalSalary || 0) > prevSalaryResult.totalSalary ? "text-emerald-400" : (salaryResult?.totalSalary || 0) < prevSalaryResult.totalSalary ? "text-red-400" : ""
                          )}>
                            {(salaryResult?.totalSalary || 0) >= prevSalaryResult.totalSalary ? '+' : ''}{formatMoney((salaryResult?.totalSalary || 0) - prevSalaryResult.totalSalary)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
