"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { calculateSalary, formatMoney, formatMoneyShort } from '@/lib/calculations'
import { ONLINE_MANAGER_CONFIG } from '@/config/salary-scales'
import type { User as DbUser, SalesCache, SalesDetail } from '@/types/database'
import {
  TrendingUp,
  RefreshCw,
  Calendar,
  Target,
  Wallet,
  Clock,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SalesTabProps {
  userId: string | undefined
  profile: DbUser | null
}

export function SalesTab({ userId, profile }: SalesTabProps) {
  const [salesCache, setSalesCache] = useState<SalesCache | null>(null)
  const [recentSales, setRecentSales] = useState<SalesDetail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  const getCurrentPeriod = () => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  }

  const fetchSalesData = useCallback(async () => {
    if (!userId) return

    try {
      setError(null)
      const period = getCurrentPeriod()

      // Fetch cached sales for current month
      const { data: cache, error: cacheError } = await supabase
        .from('sales_cache')
        .select('*')
        .eq('user_id', userId)
        .eq('period', period)
        .single()

      if (cacheError && cacheError.code !== 'PGRST116') {
        throw cacheError
      }

      setSalesCache(cache as SalesCache | null)

      // Fetch recent sales details
      const { data: sales, error: salesError } = await supabase
        .from('sales_details')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(10)

      if (salesError) throw salesError

      setRecentSales((sales || []) as SalesDetail[])
      const cacheData = cache as SalesCache | null
      setLastUpdate(cacheData?.updated_at ? new Date(cacheData.updated_at) : null)
    } catch (err) {
      console.error('Error fetching sales:', err)
      setError('Не удалось загрузить данные о продажах')
    } finally {
      setLoading(false)
    }
  }, [userId, supabase])

  const refreshFromMoysklad = async () => {
    if (!userId) return

    setRefreshing(true)
    try {
      const response = await fetch('/api/sales/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Sync failed')
      }

      await fetchSalesData()
    } catch (err) {
      console.error('Error syncing:', err)
      setError('Не удалось обновить данные из МойСклад')
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSalesData()

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchSalesData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchSalesData])

  const totalSales = salesCache?.total_sales || 0
  const result = calculateSalary(totalSales, ONLINE_MANAGER_CONFIG)

  // Calculate days progress in month
  const now = new Date()
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const currentDay = now.getDate()
  const monthProgress = (currentDay / daysInMonth) * 100

  // Forecast based on current pace
  const dailyAverage = currentDay > 0 ? totalSales / currentDay : 0
  const forecastedSales = Math.round(dailyAverage * daysInMonth)
  const forecastedResult = calculateSalary(forecastedSales, ONLINE_MANAGER_CONFIG)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Show setup message if no MoySklad integration
  if (!profile?.moysklad_employee_id) {
    return (
      <Card className="bg-card/80 border-border/50">
        <CardContent className="py-12 text-center">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Интеграция не настроена</h3>
          <p className="text-muted-foreground text-sm max-w-sm mx-auto">
            Ваш аккаунт ещё не связан с МойСклад.
            Обратитесь к администратору для настройки интеграции.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Current Sales Summary */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshFromMoysklad}
              disabled={refreshing}
              className="h-8 text-xs"
            >
              <RefreshCw className={cn("w-3 h-3 mr-1", refreshing && "animate-spin")} />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatMoney(totalSales)}
              </p>
              <p className="text-sm text-muted-foreground">
                продаж за {currentDay} {currentDay === 1 ? 'день' : currentDay < 5 ? 'дня' : 'дней'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Wallet className="w-3.5 h-3.5" />
                  <span className="text-xs">Текущий бонус</span>
                </div>
                <p className="text-lg font-semibold text-foreground">
                  {formatMoney(result.totalBonus)}
                </p>
              </div>
              <div className="p-3 bg-background/50 rounded-lg">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-3.5 h-3.5" />
                  <span className="text-xs">Итого ЗП</span>
                </div>
                <p className="text-lg font-semibold text-primary">
                  {formatMoney(result.totalSalary)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Forecast */}
      <Card className="bg-card/80 border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Прогноз на конец месяца
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Прогресс месяца</span>
              <span className="text-sm font-medium">{currentDay} из {daysInMonth} дней</span>
            </div>
            <Progress value={monthProgress} className="h-2" />

            <div className="pt-2 border-t border-border/50">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-muted-foreground">Прогноз продаж</span>
                <span className="font-semibold">{formatMoney(forecastedSales)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Прогноз ЗП</span>
                <span className="font-bold text-primary">{formatMoney(forecastedResult.totalSalary)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Sales */}
      {recentSales.length > 0 && (
        <Card className="bg-card/80 border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Последние продажи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <motion.div
                  key={sale.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {sale.customer_name || 'Покупатель'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <span className="font-semibold text-primary">
                    +{formatMoneyShort(sale.amount)}
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Last Update */}
      {lastUpdate && (
        <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Обновлено {lastUpdate.toLocaleTimeString('ru-RU', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm text-center"
        >
          {error}
        </motion.div>
      )}
    </div>
  )
}
