"use client"

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
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
  Download,
  ArrowUp,
  ArrowDown,
  Minus,
  RotateCcw,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { Podium } from '@/components/leaderboard/Podium'
import { EmployeeCard } from '@/components/leaderboard/EmployeeCard'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'

interface AchievementBadge {
  id: string
  code: string
  name: string
  icon: string | null
}

interface TeamEmployee {
  id: string
  moysklad_id: string
  name: string
  firstName: string
  lastName: string
  isActive: boolean
  photoUrl: string | null
  // Продажи
  totalSales: number
  salesCount: number
  shiftCount?: number // Количество смен (уникальных дней)
  // Возвраты
  totalReturns: number
  returnsCount: number
  returnRate: number
  // Чистые продажи
  netSales: number
  avgCheck: number
  // ЗП и ранг
  salary: number
  rank: string
  rankEmoji: string
  progress: number
  nextRank: string | null
  salesUntilNext: number
  // Позиция
  position: number
  prevPosition: number | null
  positionChange: number
  // Streak и достижения
  streak: number
  maxStreak: number
  achievements: AchievementBadge[]
}

interface TeamData {
  employees: TeamEmployee[]
  period: string
  department: string
  lastSync: {
    at: string
    status: string
    recordsSynced: number
  } | null
  totals: {
    sales: number
    returns: number
    netSales: number
    fot: number
    employees: number
    avgReturnRate: number
  }
}

const DEPARTMENTS = [
  { id: 'moscow', name: 'ТРЦ Москва', icon: Store, color: 'text-orange-400', baseSalary: 40000 },
  { id: 'online', name: 'Онлайн', icon: Globe, color: 'text-blue-400', baseSalary: 50000 },
  { id: 'tsum', name: 'ТД ЦУМ', icon: Building2, color: 'text-purple-400', baseSalary: 80000 },
  { id: 'almaty', name: 'Алматы', icon: Store, color: 'text-emerald-400', baseSalary: 50000 },
  { id: 'astana', name: 'Астана', icon: Store, color: 'text-cyan-400', baseSalary: 50000 },
]

const POSITION_STYLES = {
  0: { bg: 'from-yellow-500/30 to-amber-500/20', border: 'border-yellow-500/50', icon: Crown, iconColor: 'text-yellow-400' },
  1: { bg: 'from-slate-400/30 to-slate-500/20', border: 'border-slate-400/50', icon: Medal, iconColor: 'text-slate-300' },
  2: { bg: 'from-orange-500/30 to-amber-600/20', border: 'border-orange-500/50', icon: Medal, iconColor: 'text-orange-400' },
}

// Получить данные команды из Supabase
async function fetchTeamData(department: string, period: string): Promise<TeamData> {
  const response = await fetch(`/api/team?department=${department}&period=${period}`)
  if (!response.ok) throw new Error('Ошибка загрузки данных')
  return response.json()
}

// Синхронизировать с МойСклад
async function syncData(period: string) {
  // Сначала сотрудников
  await fetch('/api/sync/employees', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
  // Продажи и возвраты параллельно
  const [salesRes, returnsRes] = await Promise.all([
    fetch('/api/sync/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    }),
    fetch('/api/sync/returns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ period })
    })
  ])
  return {
    sales: await salesRes.json(),
    returns: await returnsRes.json()
  }
}

export default function TeamSalesPage() {
  const queryClient = useQueryClient()
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [period, setPeriod] = useState(() => {
    const now = new Date()
    // По умолчанию показываем прошлый месяц если сегодня 1-5 число
    if (now.getDate() <= 5) {
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      return `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`
    }
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [syncing, setSyncing] = useState(false)

  // Один запрос — все данные
  const { data, isLoading, error } = useQuery({
    queryKey: ['team', department.id, period],
    queryFn: () => fetchTeamData(department.id, period),
    staleTime: 60 * 1000, // 1 минута
  })

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncData(period)
      queryClient.invalidateQueries({ queryKey: ['team', department.id, period] })
    } finally {
      setSyncing(false)
    }
  }

  const formatPeriod = (p: string) => {
    const [year, month] = p.split('-')
    const date = new Date(parseInt(year), parseInt(month) - 1)
    return date.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
  }

  const formatSyncTime = (isoString: string) => {
    const date = new Date(isoString)
    return date.toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }

  const employees = data?.employees || []
  const totals = data?.totals || { sales: 0, returns: 0, netSales: 0, fot: 0, employees: 0, avgReturnRate: 0 }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header - Gaming Style */}
      <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-slate-800/50">
                  <ArrowLeft className="w-5 h-5 text-slate-400" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  <div className="relative">
                    <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                  </div>
                  <span className="bg-gradient-to-r from-yellow-200 via-yellow-400 to-amber-500 bg-clip-text text-transparent">
                    ARENA
                  </span>
                </h1>
                <p className="text-xs text-slate-500 font-medium">{formatPeriod(period)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={syncing || isLoading}
              className="rounded-full hover:bg-slate-800/50"
              title="Синхронизировать с МойСклад"
            >
              <Download className={cn("w-4 h-4 text-slate-400", syncing && "animate-bounce text-emerald-400")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Department Tabs - Gaming Style */}
        <div className="flex gap-2 p-1.5 bg-slate-900/80 rounded-xl border border-slate-800/50">
          {DEPARTMENTS.map((dept) => {
            const DeptIcon = dept.icon
            const isActive = department.id === dept.id
            return (
              <button
                key={dept.id}
                onClick={() => setDepartment(dept)}
                className={cn(
                  "flex-1 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 py-2.5 px-3 font-semibold text-sm",
                  isActive
                    ? "bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg border border-slate-600/50 text-white"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                )}
              >
                <DeptIcon className={cn("w-4 h-4", isActive ? dept.color : "text-slate-500")} />
                <span className="hidden sm:inline">{dept.name}</span>
              </button>
            )
          })}
        </div>

        {/* Period Select - Gaming Style */}
        <div className="relative">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full px-4 py-3 text-sm bg-slate-900/80 border border-slate-800/50 rounded-xl appearance-none cursor-pointer font-semibold text-slate-200 focus:outline-none focus:border-slate-600"
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
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        </div>

        {/* Stats Cards - Gaming Style */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-900/50 via-emerald-800/30 to-emerald-900/20 border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 text-emerald-400 mb-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/20">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide">Чистые продажи</span>
                </div>
                <p className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]">
                  {formatMoneyShort(totals.netSales)}
                </p>
                <p className="text-xs text-emerald-300/70 mt-1">
                  {totals.returns > 0 && (
                    <span className="text-red-400">-{formatMoneyShort(totals.returns)} возвр.</span>
                  )}
                  {totals.returns === 0 && <span>{totals.employees} бойцов в строю</span>}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.1 }}>
            <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-violet-900/50 via-violet-800/30 to-violet-900/20 border border-violet-500/40 shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0" />
              <div className="relative p-4">
                <div className="flex items-center gap-2 text-violet-400 mb-2">
                  <div className="p-1.5 rounded-lg bg-violet-500/20">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide">ФОТ команды</span>
                </div>
                <p className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(139,92,246,0.5)]">
                  {formatMoneyShort(totals.fot)}
                </p>
                <p className="text-xs text-violet-300/70 mt-1">
                  {totals.netSales > 0 ? ((totals.fot / totals.netSales) * 100).toFixed(1) : 0}% от добычи
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sync Status */}
        {data?.lastSync && (
          <p className="text-xs text-muted-foreground text-center">
            Обновлено: {formatSyncTime(data.lastSync.at)} ({data.lastSync.recordsSynced} записей)
          </p>
        )}

        {/* Podium Top-3 */}
        {!isLoading && !error && employees.length >= 3 && (
          <Podium
            employees={employees.slice(0, 3).map(e => ({
              id: e.id,
              moysklad_id: e.moysklad_id,
              name: e.name,
              firstName: e.firstName,
              lastName: e.lastName,
              netSales: e.netSales,
              salary: e.salary,
              photoUrl: e.photoUrl,
              streak: e.streak,
            }))}
            period={period}
            department={department.id}
          />
        )}

        {/* Loading */}
        {isLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-card/50 border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-2 w-full rounded-full" />
                    </div>
                    <Skeleton className="h-6 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="bg-red-500/10 border-red-500/30">
            <CardContent className="py-8 text-center">
              <p className="text-red-400">Ошибка загрузки. Попробуйте синхронизировать данные.</p>
              <Button onClick={handleSync} variant="outline" className="mt-4">
                <Download className="w-4 h-4 mr-2" />
                Синхронизировать
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Leaderboard */}
        {!isLoading && !error && (
          <div className="space-y-3">
            <AnimatePresence>
              {employees.map((item, index) => (
                <EmployeeCard
                  key={item.id}
                  employee={item}
                  index={index}
                  period={period}
                  departmentId={department.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
          <Card className="bg-muted/30">
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Нет данных за этот период</p>
              <Button onClick={handleSync} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Синхронизировать с МойСклад
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Role Info */}
        {!isLoading && employees.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <Card className="bg-muted/20 border-dashed">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Target className="w-4 h-4" />
                  <span>
                    <strong>{department.name}</strong> • Оклад: {formatMoney(department.baseSalary)} • Шкала: 5% → 13%
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
