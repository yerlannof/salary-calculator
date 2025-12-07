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
import { ActivityCalendar } from '@/components/profile/ActivityCalendar'
import { MonthForecast } from '@/components/profile/MonthForecast'
import { PersonalRecords } from '@/components/profile/PersonalRecords'
import { LevelProgressWidget } from '@/components/profile/LevelProgressWidget'

const DEPARTMENT_INFO: Record<string, { name: string; icon: typeof Store; color: string }> = {
  almaty: { name: 'Алматы', icon: Store, color: 'text-neon-cyan' },
  astana: { name: 'Астана', icon: Store, color: 'text-neon-magenta' },
  // Старые отделы (для совместимости)
  moscow: { name: 'ТРЦ Москва', icon: Store, color: 'text-neon-cyan' },
  online: { name: 'Онлайн', icon: Globe, color: 'text-neon-yellow' },
  tsum: { name: 'ТД ЦУМ', icon: Building2, color: 'text-neon-magenta' },
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
    nextRank: string | null
    salesUntilNext: number
    progress: number
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
      <div className="min-h-screen bg-esports-bg flex items-center justify-center">
        <div className="max-w-md bg-esports-card border border-esports-border rounded-lg p-8 text-center">
          <p className="text-esports-muted mb-4">Не удалось загрузить данные</p>
          <Link href={`/team-sales?dept=${dept}`}>
            <Button variant="outline" className="bg-esports-elevated border-esports-border hover:bg-esports-card text-esports-text">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к списку
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const { employee, current, previous, changes, achievements, returns } = data
  const deptInfo = DEPARTMENT_INFO[employee.department] || DEPARTMENT_INFO.moscow
  const DeptIcon = deptInfo.icon

  return (
    <div className="min-h-screen bg-esports-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-esports-bg/95 backdrop-blur-lg border-b border-esports-border">
        <div className="max-w-2xl mx-auto px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <Link href={`/team-sales?dept=${employee.department}`}>
              <Button variant="ghost" size="icon" className="rounded-lg bg-esports-card border border-esports-border hover:bg-esports-elevated hover:border-esports-muted">
                <ArrowLeft className="w-5 h-5 text-esports-text" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-white">{employee.name}</h1>
              <p className="text-xs text-esports-muted flex items-center gap-1">
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
          className="flex items-center gap-4 p-4 bg-esports-card border border-esports-border rounded-lg"
        >
          {/* Avatar */}
          <div className="relative">
            <button
              onClick={() => setShowPhotoModal(true)}
              className={cn(
                "w-24 h-24 rounded-lg overflow-hidden transition-all cursor-pointer group",
                "ring-2 ring-esports-border hover:ring-neon-cyan/50",
                current.position === 1 && "ring-neon-cyan/50 border-glow-cyan"
              )}
            >
              <img
                src={`/api/photo/${moyskladId}`}
                alt={employee.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                style={{ objectPosition: 'center 35%', transform: 'scale(1.15)' }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.style.display = 'none'
                  if (target.nextElementSibling) {
                    (target.nextElementSibling as HTMLElement).style.display = 'flex'
                  }
                }}
              />
              <div className="w-full h-full bg-esports-elevated items-center justify-center text-esports-muted text-3xl font-bold hidden">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
            </button>
            {/* Position badge - esports style */}
            {current.position > 0 && current.position <= 3 && (
              <div className={cn(
                "absolute -bottom-2 -right-2 w-8 h-8 rounded-lg bg-esports-bg border-2 flex items-center justify-center font-mono font-black text-sm pointer-events-none",
                current.position === 1 && "border-neon-cyan text-neon-cyan",
                current.position === 2 && "border-rank-2 text-rank-2",
                current.position === 3 && "border-rank-3 text-rank-3"
              )}>
                #{current.position}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <LevelBadge levelName={current.rank} />
              {current.streak >= 3 && (
                <span className="bg-neon-magenta/20 text-neon-magenta text-xs px-2 py-1 rounded flex items-center gap-1 font-bold border border-neon-magenta/30">
                  <Flame className="w-3 h-3" />
                  {current.streak}
                </span>
              )}
            </div>
            <p className="text-3xl font-black font-score text-neon-yellow text-glow-yellow">{formatMoneyShort(current.netSales)}</p>
            <p className="text-lg text-emerald-400 font-semibold font-score">{formatMoney(current.salary)}</p>
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
            iconColor="text-neon-cyan"
          />
          <StatCard
            icon={Calendar}
            label="Смены"
            value={dailyData?.stats.daysWithSales || 0}
            suffix="дней"
            iconColor="text-neon-magenta"
          />
          <StatCard
            icon={Target}
            label="Средний чек"
            value={formatMoneyShort(current.avgCheck)}
            iconColor="text-neon-yellow"
          />
          <StatCard
            icon={TrendingUp}
            label="За смену"
            value={formatMoneyShort((dailyData?.stats?.daysWithSales ?? 0) > 0 ? current.netSales / (dailyData?.stats?.daysWithSales ?? 1) : 0)}
            iconColor="text-neon-cyan"
          />
          <StatCard
            icon={RotateCcw}
            label="Возвраты"
            value={current.returnsCount}
            suffix={`(${current.returnRate}%)`}
            negative
            iconColor="text-destructive"
          />
          <StatCard
            icon={Trophy}
            label="Позиция"
            value={`#${current.position}`}
            change={changes.position}
            iconColor="text-neon-yellow"
          />
        </div>

        {/* New Profile Widgets */}
        {/* Level Progress Widget */}
        <LevelProgressWidget
          currentSales={current.netSales}
          rank={current.rank}
          nextRank={current.nextRank}
          salesUntilNext={current.salesUntilNext}
          progress={current.progress}
        />

        {/* Month Forecast - only for current month */}
        <MonthForecast
          currentSales={current.netSales}
          daysWithSales={dailyData?.stats.daysWithSales || 0}
          period={period}
        />

        {/* Personal Records */}
        <PersonalRecords
          bestDay={dailyData?.stats.bestDay}
          maxStreak={current.maxStreak}
          currentStreak={current.streak}
          totalSalesCount={current.salesCount}
        />

        {/* Activity Calendar */}
        {dailyData && dailyData.daily.length > 0 && (
          <ActivityCalendar
            data={dailyData.daily}
            period={period}
          />
        )}

        {/* Comparison Table */}
        <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-esports-border">
            <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
              <Calendar className="w-4 h-4 text-neon-cyan" />
              Сравнение с прошлым месяцем
            </h3>
          </div>
          <div className="p-4">
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
          </div>
        </div>

        {/* Sales By Store */}
        {data.salesByStore && data.salesByStore.length > 0 && (
          <SalesByStore stores={data.salesByStore} />
        )}

        {/* Daily Chart */}
        {dailyData && dailyData.daily.length > 0 && (
          <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-esports-border">
              <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-neon-cyan" />
                Продажи по дням
              </h3>
            </div>
            <div className="p-4">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyData.daily}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00F5FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#00F5FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A3544" />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: '#7A8599', fontSize: 10 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: '#7A8599', fontSize: 10 }}
                      tickLine={false}
                      tickFormatter={(v) => formatMoneyShort(v)}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#111921',
                        border: '1px solid #2A3544',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatMoney(value), 'Продажи']}
                      labelFormatter={(day) => `${day} ${formatPeriod(period).split(' ')[0]}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#00F5FF"
                      fill="url(#salesGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              {dailyData.stats.bestDay && (
                <p className="text-xs text-esports-muted mt-2 text-center">
                  Лучший день: <span className="text-neon-yellow font-semibold">{new Date(dailyData.stats.bestDay.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span> — <span className="text-neon-yellow font-score">{formatMoney(dailyData.stats.bestDay.sales)}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Achievements */}
        <div className="bg-esports-card border border-esports-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-esports-border">
            <h3 className="text-sm font-bold text-esports-text flex items-center gap-2">
              <Award className="w-4 h-4 text-neon-magenta" />
              Достижения
              <span className="text-esports-muted font-normal">({achievements.earnedIds.length}/{achievements.all.length})</span>
            </h3>
          </div>
          <div className="p-4">
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
                      'flex flex-col items-center gap-1 p-2 rounded-lg transition-all border',
                      isEarned
                        ? 'bg-neon-magenta/10 border-neon-magenta/30'
                        : 'opacity-40 grayscale border-transparent bg-esports-elevated'
                    )}
                    title={`${ach.name}: ${ach.description}${isEarned && earnedData ? ` (получено ${new Date(earnedData.earnedAt).toLocaleDateString('ru-RU')})` : ''}`}
                  >
                    <span className="text-2xl">
                      {ach.icon || ACHIEVEMENT_ICONS[ach.code] || '🏅'}
                    </span>
                    <span className="text-xs text-center text-esports-muted line-clamp-2">
                      {ach.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Returns */}
        {returns.length > 0 && (
          <div className="bg-esports-card border border-destructive/30 rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-destructive/30">
              <h3 className="text-sm font-bold text-destructive flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                Возвраты за период
              </h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {returns.slice(0, 5).map((ret, idx) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-esports-border last:border-0">
                    <span className="text-esports-muted">
                      {new Date(ret.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-destructive font-mono">-{formatMoney(ret.amount)}</span>
                  </div>
                ))}
                {returns.length > 5 && (
                  <p className="text-xs text-esports-muted text-center pt-2">
                    и ещё {returns.length - 5} возвратов
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Photo Modal */}
      {showPhotoModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowPhotoModal(false)}
          className="fixed inset-0 z-50 bg-esports-bg/95 backdrop-blur-sm flex items-center justify-center p-4"
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
              className="absolute -top-12 right-0 text-esports-text hover:bg-esports-elevated rounded-lg"
            >
              <span className="text-2xl">×</span>
            </Button>
            <img
              src={`/api/photo/${moyskladId}`}
              alt={employee.name}
              className="w-full h-auto rounded-lg border border-esports-border"
            />
            <p className="text-white text-center mt-4 text-lg font-bold">
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
      <div className="bg-esports-card border border-esports-border rounded-lg p-4 hover:bg-esports-elevated transition-colors">
        <div className={cn('flex items-center gap-2 mb-1', iconColor)}>
          <Icon className="w-4 h-4" />
          <span className="text-xs font-medium text-esports-muted">{label}</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={cn('text-xl font-bold font-score', negative ? 'text-destructive' : 'text-esports-text')}>
            {value}
          </span>
          {suffix && <span className="text-xs text-esports-muted">{suffix}</span>}
          {change !== undefined && change !== null && change !== 0 && (
            <span className={cn('text-xs flex items-center font-bold', change > 0 ? 'text-neon-cyan' : 'text-destructive')}>
              {change > 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {Math.abs(change)}
            </span>
          )}
        </div>
      </div>
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
    <div className="flex items-center justify-between py-2 border-b border-esports-border last:border-0">
      <span className="text-esports-muted">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-esports-muted/60 text-xs">{previous}</span>
        <span className="font-medium text-esports-text font-score">{current}</span>
        {change !== null && change !== undefined && (
          <span className={cn(
            'text-xs flex items-center min-w-[40px] justify-end font-bold',
            isPositive ? 'text-neon-cyan' : change < 0 ? 'text-destructive' : 'text-esports-muted'
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
    <div className="min-h-screen bg-esports-bg">
      <header className="sticky top-0 z-50 bg-esports-bg/95 backdrop-blur-lg border-b border-esports-border">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-lg bg-esports-elevated" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-esports-elevated" />
              <Skeleton className="h-3 w-24 bg-esports-elevated" />
            </div>
          </div>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4 p-4 bg-esports-card border border-esports-border rounded-lg">
          <Skeleton className="w-24 h-24 rounded-lg bg-esports-elevated" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-20 bg-esports-elevated" />
            <Skeleton className="h-8 w-24 bg-esports-elevated" />
            <Skeleton className="h-6 w-32 bg-esports-elevated" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg bg-esports-card border border-esports-border" />
          ))}
        </div>
        <Skeleton className="h-48 rounded-lg bg-esports-card border border-esports-border" />
        <Skeleton className="h-64 rounded-lg bg-esports-card border border-esports-border" />
      </div>
    </div>
  )
}
