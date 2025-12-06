"use client"

import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LevelBadge, LEVEL_CONFIG } from '@/components/calculator/LevelIcon'
import { getDepartmentStores } from '@/config/stores'
import type { DepartmentType } from '@/lib/supabase/types'
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
  ShoppingBag,
  Laptop,
  Home,
  X,
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
  { id: 'almaty', name: 'Алматы', icon: Store, color: 'text-emerald-400', baseSalary: 50000 },
  { id: 'astana', name: 'Астана', icon: Store, color: 'text-cyan-400', baseSalary: 50000 },
]

const POSITION_STYLES = {
  0: { bg: 'from-yellow-500/30 to-amber-500/20', border: 'border-yellow-500/50', icon: Crown, iconColor: 'text-yellow-400' },
  1: { bg: 'from-slate-400/30 to-slate-500/20', border: 'border-slate-400/50', icon: Medal, iconColor: 'text-slate-300' },
  2: { bg: 'from-orange-500/30 to-amber-600/20', border: 'border-orange-500/50', icon: Medal, iconColor: 'text-orange-400' },
}

// Получить данные команды из Supabase
async function fetchTeamData(department: string, period: string, store?: string): Promise<TeamData> {
  const url = store && store !== 'all'
    ? `/api/team?department=${department}&period=${period}&store=${store}`
    : `/api/team?department=${department}&period=${period}`
  const response = await fetch(url)
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

// Дефолтные магазины для каждого отдела
const DEFAULT_STORES: Record<string, string> = {
  almaty: 'b9585357-b51b-11ee-0a80-15c6000bc3b8', // ТРЦ Москва
  astana: 'b75138dd-b6f8-11ee-0a80-09610016847f', // ТРЦ Аружан
}

// Иконки для магазинов
const STORE_ICONS: Record<string, typeof Store> = {
  'b9585357-b51b-11ee-0a80-15c6000bc3b8': Building2, // ТРЦ Москва
  'b5a56c15-b162-11ee-0a80-02a00015a9f3': ShoppingBag, // ТД ЦУМ
  '68d485c9-b131-11ee-0a80-066b000af5c1': Store, // Байтурсынова
  'd1b4400d-007b-11ef-0a80-14800035ff62': Laptop, // Online New
  'd491733b-b6f8-11ee-0a80-033a0016fb6b': Globe, // Онлайн Продажи (Legacy)
  'b75138dd-b6f8-11ee-0a80-09610016847f': Home, // ТРЦ Аружан
  'c341e43f-b6f8-11ee-0a80-103e0016edda': Store, // Астана Стрит
  'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81': Laptop, // Онлайн Астана
}

export default function TeamSalesPage() {
  const queryClient = useQueryClient()
  const [department, setDepartment] = useState(DEPARTMENTS[0])
  const [selectedStore, setSelectedStore] = useState<string>(DEFAULT_STORES[DEPARTMENTS[0].id] || 'all')
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
  const [photoModalEmployee, setPhotoModalEmployee] = useState<{ moyskladId: string; name: string } | null>(null)

  // Сбрасываем выбор магазина при смене отдела на дефолтный
  const handleDepartmentChange = (dept: typeof DEPARTMENTS[0]) => {
    setDepartment(dept)
    setSelectedStore(DEFAULT_STORES[dept.id] || 'all')
  }

  // Получаем список магазинов для текущего отдела
  const departmentStores = useMemo(() =>
    getDepartmentStores(department.id as DepartmentType),
    [department.id]
  )

  // Один запрос — все данные (с фильтром по магазину)
  const { data, isLoading, error } = useQuery({
    queryKey: ['team', department.id, period, selectedStore],
    queryFn: () => fetchTeamData(department.id, period, selectedStore),
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

        {/* Department Tabs - Gaming Style */}
        <div className="flex gap-2 p-1.5 bg-slate-900/80 rounded-xl border border-slate-800/50">
          {DEPARTMENTS.map((dept) => {
            const DeptIcon = dept.icon
            const isActive = department.id === dept.id
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentChange(dept)}
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

        {/* Store Filter - Beautiful Buttons */}
        {departmentStores.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">Магазины</p>
            <div className="grid grid-cols-2 gap-2">
              {departmentStores.map((store) => {
                const StoreIcon = STORE_ICONS[store.id] || Store
                const isActive = selectedStore === store.id
                return (
                  <motion.button
                    key={store.id}
                    onClick={() => setSelectedStore(store.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "relative overflow-hidden rounded-lg p-3 transition-all duration-200 text-left",
                      isActive
                        ? "bg-gradient-to-br from-emerald-600/30 to-emerald-700/20 border-2 border-emerald-500/50 shadow-lg shadow-emerald-500/20"
                        : "bg-slate-900/60 border border-slate-700/50 hover:border-slate-600/70 hover:bg-slate-800/60"
                    )}
                  >
                    {/* Shine effect */}
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0" />
                    )}

                    <div className="relative flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        isActive ? "bg-emerald-500/20" : "bg-slate-800/50"
                      )}>
                        <StoreIcon className={cn(
                          "w-4 h-4",
                          isActive ? "text-emerald-400" : "text-slate-400"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isActive ? "text-emerald-100" : "text-slate-200"
                        )}>
                          {store.name}
                        </p>
                      </div>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                        />
                      )}
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        )}

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
                  onAvatarClick={() => setPhotoModalEmployee({ moyskladId: item.moysklad_id, name: item.name })}
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

        {/* Photo Modal */}
        <AnimatePresence>
          {photoModalEmployee && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setPhotoModalEmployee(null)}
            >
              <button
                onClick={() => setPhotoModalEmployee(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-800/80 hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.8 }}
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={`/api/photo/${photoModalEmployee.moyskladId}`}
                  alt={photoModalEmployee.name}
                  className="w-full h-auto rounded-lg shadow-2xl"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 rounded-b-lg">
                  <h3 className="text-2xl font-bold text-white">{photoModalEmployee.name}</h3>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
