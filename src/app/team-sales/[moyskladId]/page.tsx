'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatMoney, formatMoneyShort } from '@/lib/calculations'
import { LevelBadge } from '@/components/calculator/LevelIcon'
import { ACHIEVEMENT_ICONS } from '@/lib/achievements'
import { SalesByStore } from '@/components/leaderboard/SalesByStore'
import { PeriodSelector, getCurrentPeriod } from '@/components/leaderboard/PeriodSelector'
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Wallet,
  ShoppingCart,
  RotateCcw,
  Trophy,
  Target,
  Calendar,
  ArrowUp,
  ArrowDown,
  Minus,
  Flame,
  Award,
  Store,
  Globe,
  Building2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const DEPARTMENT_INFO: Record<string, { name: string; icon: typeof Store; color: string }> = {
  almaty: { name: 'Алматы', icon: Store, color: 'text-emerald-400' },
  astana: { name: 'Астана', icon: Store, color: 'text-cyan-400' },
  // Старые отделы (для совместимости)
  moscow: { name: 'ТРЦ Москва', icon: Store, color: 'text-orange-400' },
  online: { name: 'Онлайн', icon: Globe, color: 'text-blue-400' },
  tsum: { name: 'ТД ЦУМ', icon: Building2, color: 'text-purple-400' },
}

interface EmployeeData {
  employee: {
    id: string
    moyskladId: string
    firstName: string
    lastName: string
    name: string
    department: string
    isActive: boolean
  }
  period: string
  current: {
    totalSales: number
    totalReturns: number
    salesCount: number
    returnsCount: number
    netSales: number
    avgCheck: number
    returnRate: number
    salary: number
    rank: string
    rankEmoji: string
    position: number
    streak: number
    maxStreak: number
  }
  previous: {
    period: string
    totalSales: number
    netSales: number
    salesCount: number
    salary: number
    position: number | null
  }
  changes: {
    sales: number | null
    netSales: number | null
    salary: number | null
    position: number | null
    salesCount: number
  }
  achievements: {
    earned: Array<{
      id: string
      period: string
      earnedAt: string
      achievement: { id: string; code: string; name: string; description: string; icon: string }
    }>
    all: Array<{ id: string; code: string; name: string; description: string; icon: string }>
    earnedIds: string[]
  }
  returns: Array<{ amount: number; date: string }>
  salesByStore: Array<{
    storeId: string
    storeName: string
    sales: number
    salesCount: number
    returns: number
    returnsCount: number
    netSales: number
  }>
}

interface DailyData {
  daily: Array<{
    date: string
    day: number
    sales: number
    returns: number
    netSales: number
    salesCount: number
  }>
  stats: {
    bestDay: { date: string; sales: number } | null
    avgDailySales: number
    daysWithSales: number
  }
}

async function fetchEmployeeData(moyskladId: string, period: string): Promise<EmployeeData> {
  const res = await fetch(`/api/employee/${moyskladId}?period=${period}`)
  if (!res.ok) throw new Error('Ошибка загрузки данных')
  return res.json()
}

async function fetchDailyData(moyskladId: string, period: string): Promise<DailyData> {
  const res = await fetch(`/api/employee/${moyskladId}/daily?period=${period}`)
  if (!res.ok) throw new Error('Ошибка загрузки данных')
  return res.json()
}

export default function EmployeeProfilePage({
  params,
}: {
  params: { moyskladId: string }
}) {
  const { moyskladId } = params
  const searchParams = useSearchParams()
  const period = searchParams.get('period') || getCurrentPeriod()
  const dept = searchParams.get('dept') || 'moscow'
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['employee', moyskladId, period],
    queryFn: () => fetchEmployeeData(moyskladId, period),
  })

  const { data: dailyData } = useQuery({
    queryKey: ['employee-daily', moyskladId, period],
    queryFn: () => fetchDailyData(moyskladId, period),
  })

  const formatPeriod = (p: string) => {
    const [year, month] = p.split('-')
    return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('ru-RU', {
      month: 'long',
      year: 'numeric',
    })
  }

  if (isLoading) {
    return <ProfileSkeleton />
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Не удалось загрузить данные</p>
            <Link href={`/team-sales?dept=${dept}`}>
              <Button variant="outline">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Назад к списку
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { employee, current, previous, changes, achievements, returns } = data
  const deptInfo = DEPARTMENT_INFO[employee.department] || DEPARTMENT_INFO.moscow
  const DeptIcon = deptInfo.icon

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/95">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <Link href={`/team-sales?dept=${employee.department}`}>
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold">{employee.name}</h1>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <DeptIcon className={cn('w-3 h-3', deptInfo.color)} />
                {deptInfo.name}
              </p>
            </div>
          </div>

          {/* Period Selector */}
          <div className="flex justify-center">
            <PeriodSelector
              currentPeriod={period}
              basePath={`/team-sales/${moyskladId}`}
            />
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4"
        >
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowPhotoModal(true)}
              className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-primary/20 ring-offset-2 ring-offset-background hover:ring-primary/40 transition-all cursor-pointer group"
            >
              <img
                src={`/api/photo/${moyskladId}`}
                alt={employee.name}
                className="w-full h-full object-cover group-hover:scale-125 transition-transform duration-300"
                style={{ objectPosition: 'center 35%', transform: 'scale(1.15)' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'flex'
                  }
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-primary/30 to-primary/10 items-center justify-center text-primary text-3xl font-bold hidden">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
            </button>
            {/* Position badge */}
            {current.position > 0 && current.position <= 3 && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-background border-2 border-yellow-500 flex items-center justify-center text-lg pointer-events-none">
                {current.position === 1 ? '🥇' : current.position === 2 ? '🥈' : '🥉'}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <LevelBadge levelName={current.rank} />
              {current.streak >= 3 && (
                <span className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {current.streak} дней
                </span>
              )}
            </div>
            <p className="text-3xl font-bold">{formatMoneyShort(current.netSales)}</p>
            <p className="text-lg text-primary font-semibold">{formatMoney(current.salary)}</p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={ShoppingCart}
            label="Продажи"
            value={current.salesCount}
            suffix="чеков"
            change={changes.salesCount}
            iconColor="text-emerald-400"
          />
          <StatCard
            icon={Calendar}
            label="Смены"
            value={dailyData?.stats.daysWithSales || 0}
            suffix="дней"
            iconColor="text-purple-400"
          />
          <StatCard
            icon={Target}
            label="Средний чек"
            value={formatMoneyShort(current.avgCheck)}
            iconColor="text-blue-400"
          />
          <StatCard
            icon={TrendingUp}
            label="За смену"
            value={formatMoneyShort(dailyData?.stats.daysWithSales > 0 ? current.netSales / dailyData.stats.daysWithSales : 0)}
            iconColor="text-cyan-400"
          />
          <StatCard
            icon={RotateCcw}
            label="Возвраты"
            value={current.returnsCount}
            suffix={`(${current.returnRate}%)`}
            negative
            iconColor="text-red-400"
          />
          <StatCard
            icon={Trophy}
            label="Позиция"
            value={`#${current.position}`}
            change={changes.position}
            iconColor="text-yellow-400"
          />
        </div>

        {/* Comparison Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Сравнение с прошлым месяцем
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <CompareRow
                label="Продажи"
                current={formatMoneyShort(current.totalSales)}
                previous={formatMoneyShort(previous.totalSales)}
                changePercent={changes.sales}
              />
              <CompareRow
                label="Чистые продажи"
                current={formatMoneyShort(current.netSales)}
                previous={formatMoneyShort(previous.netSales)}
                changePercent={changes.netSales}
              />
              <CompareRow
                label="Зарплата"
                current={formatMoney(current.salary)}
                previous={formatMoney(previous.salary)}
                changePercent={changes.salary}
              />
              <CompareRow
                label="Позиция"
                current={`#${current.position}`}
                previous={previous.position ? `#${previous.position}` : '-'}
                changeValue={changes.position}
                invertColors
              />
            </div>
          </CardContent>
        </Card>

        {/* Sales By Store */}
        {data.salesByStore && data.salesByStore.length > 0 && (
          <SalesByStore stores={data.salesByStore} />
        )}

        {/* Daily Chart */}
        {dailyData && dailyData.daily.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Продажи по дням
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData.daily}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#888', fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(v) => formatMoneyShort(v)}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1a1a1a',
                        border: '1px solid #333',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatMoney(value), 'Продажи']}
                      labelFormatter={(day) => `${day} ${formatPeriod(period).split(' ')[0]}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#10b981"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {dailyData.stats.bestDay && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Лучший день: {new Date(dailyData.stats.bestDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — {formatMoney(dailyData.stats.bestDay.sales)}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Achievements */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="w-4 h-4" />
              Достижения ({achievements.earnedIds.length}/{achievements.all.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {achievements.all.map((ach) => {
                const isEarned = achievements.earnedIds.includes(ach.id)
                const earnedData = achievements.earned.find(
                  (e) => (e.achievement as { id: string })?.id === ach.id
                )

                return (
                  <div
                    key={ach.id}
                    className={cn(
                      'flex flex-col items-center gap-1 p-2 rounded-lg transition-all',
                      isEarned
                        ? 'bg-primary/10'
                        : 'opacity-40 grayscale'
                    )}
                    title={`${ach.name}: ${ach.description}${isEarned && earnedData ? ` (получено ${new Date(earnedData.earnedAt).toLocaleDateString('ru-RU')})` : ''}`}
                  >
                    <span className="text-2xl">
                      {ach.icon || ACHIEVEMENT_ICONS[ach.code] || '🏅'}
                    </span>
                    <span className="text-xs text-center text-muted-foreground line-clamp-2">
                      {ach.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Returns */}
        {returns.length > 0 && (
          <Card className="border-red-500/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-red-400">
                <RotateCcw className="w-4 h-4" />
                Возвраты за период
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {returns.slice(0, 5).map((ret, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {new Date(ret.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-red-400">-{formatMoney(ret.amount)}</span>
                  </div>
                ))}
                {returns.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">
                    и ещё {returns.length - 5} возвратов
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPhotoModal(false)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl w-full"
          >
            <Button
              onClick={() => setShowPhotoModal(false)}
              variant="ghost"
              size="icon"
              className="absolute -top-12 right-0 text-white hover:bg-white/20"
            >
              <span className="text-2xl">×</span>
            </Button>
            <img
              src={`/api/photo/${moyskladId}`}
              alt={employee.name}
              className="w-full h-auto rounded-lg shadow-2xl"
            />
            <p className="text-white text-center mt-4 text-lg font-semibold">
              {employee.name}
            </p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  change,
  negative,
  iconColor,
}: {
  icon: typeof TrendingUp
  label: string
  value: string | number
  suffix?: string
  change?: number | null
  negative?: boolean
  iconColor: string
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-card/50">
        <CardContent className="p-4">
          <div className={cn('flex items-center gap-2 mb-1', iconColor)}>
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium text-muted-foreground">{label}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={cn('text-xl font-bold', negative && 'text-red-400')}>
              {value}
            </span>
            {suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
            {change !== undefined && change !== null && change !== 0 && (
              <span className={cn('text-xs flex items-center', change > 0 ? 'text-green-500' : 'text-red-500')}>
                {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
                {Math.abs(change)}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function CompareRow({
  label,
  current,
  previous,
  changePercent,
  changeValue,
  invertColors,
}: {
  label: string
  current: string
  previous: string
  changePercent?: number | null
  changeValue?: number | null
  invertColors?: boolean
}) {
  const change = changePercent ?? changeValue
  const isPositive = invertColors ? (change ?? 0) > 0 : (change ?? 0) > 0

  return (
    <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-muted-foreground/60 text-xs">{previous}</span>
        <span className="font-medium">{current}</span>
        {change !== null && change !== undefined && (
          <span className={cn(
            'text-xs flex items-center min-w-[40px] justify-end',
            isPositive ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-muted-foreground'
          )}>
            {change > 0 ? (
              <><ArrowUp className="w-3 h-3" />{changePercent !== undefined ? `${change}%` : change}</>
            ) : change < 0 ? (
              <><ArrowDown className="w-3 h-3" />{changePercent !== undefined ? `${Math.abs(change)}%` : Math.abs(change)}</>
            ) : (
              <Minus className="w-3 h-3" />
            )}
          </span>
        )}
      </div>
    </div>
  )
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    </div>
  )
}
