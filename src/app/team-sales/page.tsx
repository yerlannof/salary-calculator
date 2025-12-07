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
import DateSelector from '@/components/leaderboard/DateSelector'
import PositionChange from '@/components/leaderboard/PositionChange'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'

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
  // Магазины (для режима "Все магазины")
  stores?: StoreInfo[]
}

interface TeamData {
  employees: TeamEmployee[]
  period: string
  date: string | null
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
  { id: 'almaty', name: 'Алматы', icon: Store, color: 'text-neon-cyan', baseSalary: 50000 },
  { id: 'astana', name: 'Астана', icon: Store, color: 'text-neon-magenta', baseSalary: 50000 },
]

// Получить данные команды из Supabase
async function fetchTeamData(department: string, period: string, store?: string, date?: string | null): Promise<TeamData> {
  let url = `/api/team?department=${department}&period=${period}`
  if (store === 'all') {
    url += '&store=all' // Запрашиваем все магазины с информацией о точках
  } else if (store) {
    url += `&store=${store}`
  }
  if (date) {
    url += `&date=${date}` // Конкретный день
  }
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
  const [selectedDate, setSelectedDate] = useState<string | null>(null) // null = весь месяц

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

  // Один запрос — все данные (с фильтром по магазину и дате)
  const { data, isLoading, error } = useQuery({
    queryKey: ['team', department.id, period, selectedStore, selectedDate],
    queryFn: () => fetchTeamData(department.id, period, selectedStore, selectedDate),
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
    <div className="min-h-screen bg-esports-bg">
      {/* Header - Esports Style */}
      <header className="sticky top-0 z-50 bg-esports-bg/95 backdrop-blur-lg border-b border-esports-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/">
                <Button variant="ghost" size="icon" className="rounded-lg hover:bg-esports-elevated">
                  <ArrowLeft className="w-5 h-5 text-esports-muted" />
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-black flex items-center gap-2 tracking-tight">
                  <Trophy className="w-5 h-5 text-neon-cyan" />
                  <span className="text-white">LEADERBOARD</span>
                </h1>
                <p className="text-xs text-esports-muted font-medium">{formatPeriod(period)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSync}
              disabled={syncing || isLoading}
              className="rounded-lg hover:bg-esports-elevated"
              title="Синхронизировать с МойСклад"
            >
              <Download className={cn("w-4 h-4 text-esports-muted", syncing && "animate-bounce text-neon-cyan")} />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
        {/* Period Select - Esports Style */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <select
              value={period}
              onChange={(e) => { setPeriod(e.target.value); setSelectedDate(null) }}
              className="w-full px-4 py-3 text-sm bg-esports-card border border-esports-border rounded-lg appearance-none cursor-pointer font-semibold text-esports-text focus:outline-none focus:border-neon-cyan/50"
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
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-esports-muted" />
          </div>
          <DateSelector
            period={period}
            selectedDate={selectedDate}
            onChange={setSelectedDate}
          />
        </div>

        {/* Department Tabs - Esports Style */}
        <div className="flex gap-2 p-1 bg-esports-card rounded-lg border border-esports-border">
          {DEPARTMENTS.map((dept) => {
            const DeptIcon = dept.icon
            const isActive = department.id === dept.id
            return (
              <button
                key={dept.id}
                onClick={() => handleDepartmentChange(dept)}
                className={cn(
                  "flex-1 rounded-md transition-all duration-200 flex items-center justify-center gap-2 py-2.5 px-3 font-semibold text-sm",
                  isActive
                    ? "bg-esports-elevated border border-esports-border text-white"
                    : "text-esports-muted hover:text-esports-text hover:bg-esports-elevated/50"
                )}
              >
                <DeptIcon className={cn("w-4 h-4", isActive ? dept.color : "text-esports-muted")} />
                <span className="hidden sm:inline">{dept.name}</span>
              </button>
            )
          })}
        </div>

        {/* Store Filter - Esports Style */}
        {departmentStores.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-esports-muted uppercase tracking-wider px-1">Магазины</p>
            <div className="grid grid-cols-2 gap-2">
              {/* Все магазины */}
              <button
                onClick={() => setSelectedStore('all')}
                className={cn(
                  "relative rounded-lg p-3 transition-all duration-200 text-left col-span-2",
                  "bg-esports-card border",
                  selectedStore === 'all'
                    ? "border-neon-cyan border-l-4 border-l-neon-cyan"
                    : "border-esports-border hover:border-esports-muted hover:bg-esports-elevated"
                )}
              >
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "p-2 rounded-md transition-colors",
                    selectedStore === 'all' ? "bg-neon-cyan/10" : "bg-esports-elevated"
                  )}>
                    <Globe className={cn(
                      "w-4 h-4",
                      selectedStore === 'all' ? "text-neon-cyan" : "text-esports-muted"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "text-sm font-semibold",
                      selectedStore === 'all' ? "text-white" : "text-esports-text"
                    )}>
                      Все магазины
                    </p>
                    <p className="text-xs text-esports-muted">Общий рейтинг {department.name}</p>
                  </div>
                </div>
              </button>

              {/* Отдельные магазины */}
              {departmentStores.map((store) => {
                const StoreIcon = STORE_ICONS[store.id] || Store
                const isActive = selectedStore === store.id
                return (
                  <button
                    key={store.id}
                    onClick={() => setSelectedStore(store.id)}
                    className={cn(
                      "relative rounded-lg p-3 transition-all duration-200 text-left",
                      "bg-esports-card border",
                      isActive
                        ? "border-neon-cyan border-l-4 border-l-neon-cyan"
                        : "border-esports-border hover:border-esports-muted hover:bg-esports-elevated"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "p-2 rounded-md transition-colors",
                        isActive ? "bg-neon-cyan/10" : "bg-esports-elevated"
                      )}>
                        <StoreIcon className={cn(
                          "w-4 h-4",
                          isActive ? "text-neon-cyan" : "text-esports-muted"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-semibold truncate",
                          isActive ? "text-white" : "text-esports-text"
                        )}>
                          {store.name}
                        </p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Stats Cards - Esports Style */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="bg-esports-card border border-esports-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-esports-muted mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">Продажи</span>
              </div>
              <p className="text-2xl font-black text-neon-yellow font-score">
                {formatMoneyShort(totals.netSales)}
              </p>
              <p className="text-xs text-esports-muted mt-1">
                {totals.returns > 0 && (
                  <span className="text-destructive">-{formatMoneyShort(totals.returns)} возвр.</span>
                )}
                {totals.returns === 0 && <span>{totals.employees} человек</span>}
              </p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div className="bg-esports-card border border-esports-border rounded-lg p-4">
              <div className="flex items-center gap-2 text-esports-muted mb-2">
                <Wallet className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wide">ФОТ</span>
              </div>
              <p className="text-2xl font-black text-emerald-400 font-score">
                {formatMoneyShort(totals.fot)}
              </p>
              <p className="text-xs text-esports-muted mt-1">
                {totals.netSales > 0 ? ((totals.fot / totals.netSales) * 100).toFixed(1) : 0}% от продаж
              </p>
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
              <div key={i} className="bg-esports-card border border-esports-border rounded-lg p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-10 h-10 rounded-lg bg-esports-elevated" />
                  <Skeleton className="w-12 h-12 rounded-lg bg-esports-elevated" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32 bg-esports-elevated" />
                    <Skeleton className="h-1.5 w-full rounded-full bg-esports-elevated" />
                  </div>
                  <Skeleton className="h-6 w-20 bg-esports-elevated" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-esports-card border border-destructive/30 rounded-lg p-8 text-center">
            <p className="text-destructive mb-4">Ошибка загрузки. Попробуйте синхронизировать данные.</p>
            <Button onClick={handleSync} variant="outline" className="border-esports-border hover:bg-esports-elevated">
              <Download className="w-4 h-4 mr-2" />
              Синхронизировать
            </Button>
          </div>
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
                  showStores={selectedStore === 'all'}
                  onAvatarClick={() => setPhotoModalEmployee({ moyskladId: item.moysklad_id, name: item.name })}
                />
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && employees.length === 0 && (
          <div className="bg-esports-card border border-esports-border rounded-lg py-12 text-center">
            <Users className="w-12 h-12 text-esports-muted mx-auto mb-4" />
            <p className="text-esports-muted mb-4">Нет данных за этот период</p>
            <Button onClick={handleSync} variant="outline" className="border-esports-border hover:bg-esports-elevated">
              <Download className="w-4 h-4 mr-2" />
              Синхронизировать с МойСклад
            </Button>
          </div>
        )}

        {/* Role Info */}
        {!isLoading && employees.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="bg-esports-card/50 border border-esports-border border-dashed rounded-lg p-4">
              <div className="flex items-center gap-2 text-xs text-esports-muted">
                <Target className="w-4 h-4" />
                <span>
                  <strong className="text-esports-text">{department.name}</strong> • Оклад: {formatMoney(department.baseSalary)} • Шкала: 5% → 13%
                </span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Photo Modal */}
        <AnimatePresence>
          {photoModalEmployee && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-esports-bg/95 p-4"
              onClick={() => setPhotoModalEmployee(null)}
            >
              <button
                onClick={() => setPhotoModalEmployee(null)}
                className="absolute top-4 right-4 p-2 rounded-lg bg-esports-card hover:bg-esports-elevated border border-esports-border transition-colors"
              >
                <X className="w-6 h-6 text-esports-text" />
              </button>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="relative max-w-4xl w-full"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={`/api/photo/${photoModalEmployee.moyskladId}`}
                  alt={photoModalEmployee.name}
                  className="w-full h-auto rounded-lg border border-esports-border"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-esports-bg to-transparent p-6 rounded-b-lg">
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
