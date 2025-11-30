"use client"

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { calculateSalary, formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LOCATIONS } from '@/config/salary-scales'
import { LevelBadge, LEVEL_CONFIG } from '@/components/calculator/LevelIcon'
import {
  Users,
  TrendingUp,
  RefreshCw,
  Trophy,
  Wallet,
  ChevronDown,
  ArrowLeft,
  Medal,
  Target,
  Crown,
  Store,
  Globe,
  Building2,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface Employee {
  id: string
  name: string
  email: string | null
}

interface EmployeeSales {
  employee: Employee
  totalSales: number
  salesCount: number
  salary: number
  rank: string
  progress: number
  nextRank: string | null
  salesUntilNext: number
}

const DEPARTMENTS = [
  { id: 'moscow', name: 'ТРЦ Москва', icon: Store, color: 'text-orange-400', roleId: 'trc-seller', locationId: 'trc-moscow', baseSalary: 40000 },
  { id: 'online', name: 'Онлайн', icon: Globe, color: 'text-blue-400', roleId: 'online-manager', locationId: 'online', baseSalary: 50000 },
  { id: 'tsum', name: 'ТД ЦУМ', icon: Building2, color: 'text-purple-400', roleId: 'tsum-admin', locationId: 'td-tsum', baseSalary: 80000 },
]

// Позиции в топе
const POSITION_STYLES = {
  0: { bg: 'from-yellow-500/30 to-amber-500/20', border: 'border-yellow-500/50', icon: Crown, iconColor: 'text-yellow-400' },
  1: { bg: 'from-slate-400/30 to-slate-500/20', border: 'border-slate-400/50', icon: Medal, iconColor: 'text-slate-300' },
  2: { bg: 'from-orange-500/30 to-amber-600/20', border: 'border-orange-500/50', icon: Medal, iconColor: 'text-orange-400' },
}

// Функция для получения сотрудников
async function fetchEmployees(departmentId: string): Promise<Employee[]> {
  const response = await fetch(`/api/moysklad/employees?department=${departmentId}`)
  const data = await response.json()
  return data.employees || []
}

// Функция для получения продаж сотрудника
async function fetchEmployeeSales(employeeId: string, period: string) {
  const response = await fetch(`/api/moysklad/sales?employeeId=${employeeId}&period=${period}`)
  return response.json()
}

export default function TeamSalesPage() {
  const queryClient = useQueryClient()
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['employees', department.id] })
    queryClient.invalidateQueries({ queryKey: ['sales', department.id, period] })
  }

  const getRoleConfig = () => {
    const location = LOCATIONS.find(l => l.id === department.locationId)
    return location?.roles.find(r => r.id === department.roleId)
  }

  // Fetch employees с кэшированием (5 минут)
  const { data: employees = [], isLoading: loadingEmployees } = useQuery({
    queryKey: ['employees', department.id],
    queryFn: () => fetchEmployees(department.id),
    staleTime: 5 * 60 * 1000,
  })

  // Fetch sales для всех сотрудников с кэшированием
  const { data: salesData = [], isLoading: loadingSales } = useQuery({
    queryKey: ['sales', department.id, period, employees.map(e => e.id).join(',')],
    queryFn: async () => {
      if (employees.length === 0) return []

      const roleConfig = getRoleConfig()

      const results = await Promise.all(
        employees.map(async (emp) => {
          const data = await fetchEmployeeSales(emp.id, period)

          const salaryResult = roleConfig
            ? calculateSalary(data.totalSales || 0, roleConfig)
            : null

          const currentTier = salaryResult?.currentTier
          const nextTier = salaryResult?.nextTier

          // Прогресс внутри текущего уровня
          let progress = 0
          if (currentTier) {
            const tierSize = currentTier.maxSales - currentTier.minSales
            const salesInTier = (data.totalSales || 0) - currentTier.minSales
            progress = Math.min(100, Math.max(0, (salesInTier / tierSize) * 100))
          }

          return {
            employee: emp,
            totalSales: data.totalSales || 0,
            salesCount: data.salesCount || 0,
            salary: salaryResult?.totalSalary || 0,
            rank: currentTier?.levelName || 'Новичок',
            progress,
            nextRank: nextTier?.levelName || null,
            salesUntilNext: salaryResult?.salesUntilNextTier || 0,
          }
        })
      )

      return results.sort((a, b) => b.totalSales - a.totalSales)
    },
    enabled: employees.length > 0,
    staleTime: 5 * 60 * 1000,
  })

  const totalSales = useMemo(() => salesData.reduce((sum, s) => sum + s.totalSales, 0), [salesData])
  const totalFOT = useMemo(() => salesData.reduce((sum, s) => sum + s.salary, 0), [salesData])

  const formatPeriod = (p: string) => {
    const [year, month] = p.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const isLoading = loadingEmployees || loadingSales

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-yellow-500" />
                  Лидерборд
                </h1>
                <p className="text-xs text-muted-foreground">{formatPeriod(period)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isLoading}
              className="rounded-full"
            >
              <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Department Tabs */}
        <div className="flex gap-2 p-1 bg-muted/50 rounded-xl">
          {DEPARTMENTS.map((dept) => {
            const DeptIcon = dept.icon
            return (
              <Button
                key={dept.id}
                variant="ghost"
                size="sm"
                onClick={() => setDepartment(dept)}
                className={cn(
                  "flex-1 rounded-lg transition-all gap-2",
                  department.id === dept.id
                    ? "bg-background shadow-md"
                    : "hover:bg-background/50"
                )}
              >
                <DeptIcon className={cn("w-4 h-4", dept.color)} />
                <span className="hidden sm:inline">{dept.name}</span>
              </Button>
            )
          })}
        </div>

        {/* Period Select */}
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-muted/30 border border-border/50 rounded-xl appearance-none cursor-pointer font-medium"
          >
            {Array.from({ length: 12 }, (_, i) => {
              const date = new Date()
              date.setMonth(date.getMonth() - i)
              const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
              return (
                <option key={value} value={value}>{formatPeriod(value)}</option>
              )
            })}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="text-xs font-medium">Продажи</span>
                </div>
                <p className="text-2xl font-bold">{formatMoneyShort(totalSales)}</p>
                <p className="text-xs text-muted-foreground mt-1">{salesData.length} сотрудников</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-violet-500/20 to-violet-600/10 border-violet-500/30">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-violet-400 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-xs font-medium">ФОТ команды</span>
                </div>
                <p className="text-2xl font-bold">{formatMoneyShort(totalFOT)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {totalSales > 0 ? ((totalFOT / totalSales) * 100).toFixed(1) : 0}% от продаж
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Loading Skeletons */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-2 w-full rounded-full" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-6 w-20 ml-auto" />
                      <Skeleton className="h-4 w-16 ml-auto" />
                      <Skeleton className="h-3 w-14 ml-auto" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Leaderboard */}
        {!isLoading && (
          <div className="space-y-3">
            <AnimatePresence>
              {salesData.map((item, index) => {
                const posStyle = POSITION_STYLES[index as keyof typeof POSITION_STYLES]
                const levelConfig = LEVEL_CONFIG[item.rank]
                const isTop3 = index < 3
                const PositionIcon = posStyle?.icon || Target

                return (
                  <motion.div
                    key={item.employee.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    layout
                  >
                    <Link href={`/team-sales/${item.employee.id}?period=${period}&dept=${department.id}`}>
                      <Card className={cn(
                        "overflow-hidden transition-all hover:scale-[1.02] cursor-pointer group",
                        isTop3
                          ? `bg-gradient-to-r ${posStyle.bg} ${posStyle.border} border`
                          : "bg-card/50 border-border/50 hover:border-primary/30"
                      )}>
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            {/* Position */}
                            <div className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg",
                              isTop3 ? posStyle.bg : "bg-muted/50"
                            )}>
                              {isTop3 ? (
                                <PositionIcon className={cn("w-5 h-5", posStyle?.iconColor)} />
                              ) : (
                                <span className="text-muted-foreground">#{index + 1}</span>
                              )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold truncate group-hover:text-primary transition-colors">{item.employee.name}</p>
                                <LevelBadge levelName={item.rank} className="shrink-0" />
                              </div>

                              {/* Progress to next rank */}
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
                                  <motion.div
                                    className={cn("h-full rounded-full", levelConfig?.bg || "bg-primary")}
                                    initial={{ width: 0 }}
                                    animate={{ width: `${item.progress}%` }}
                                    transition={{ duration: 0.5, delay: index * 0.05 }}
                                    style={{
                                      background: `linear-gradient(90deg, ${levelConfig?.color?.replace('text-', 'rgb(var(--') || 'hsl(var(--primary))'} 0%, transparent 200%)`
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-muted-foreground w-8">{Math.round(item.progress)}%</span>
                              </div>

                              {item.nextRank && item.salesUntilNext > 0 && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  До {item.nextRank}: {formatMoneyShort(item.salesUntilNext)}
                                </p>
                              )}
                            </div>

                            {/* Sales & Salary */}
                            <div className="text-right">
                              <p className="font-bold text-lg">{formatMoneyShort(item.totalSales)}</p>
                              <p className="text-sm text-primary font-medium">{formatMoney(item.salary)}</p>
                              <p className="text-xs text-muted-foreground">{item.salesCount} продаж</p>
                            </div>

                            {/* Arrow indicator */}
                            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && salesData.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Нет данных за этот период</p>
            </CardContent>
          </Card>
        )}

        {/* Role Info */}
        {!isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>
                    <strong>{department.name}</strong> •
                    Оклад: {formatMoney(department.baseSalary)} •
                    Шкала: 5% → 13%
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
