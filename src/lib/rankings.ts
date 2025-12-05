import { supabaseAdmin } from '@/lib/supabase/server'
import type { DepartmentType, MonthlyRanking } from '@/lib/supabase/types'

export interface RankingData {
  employeeId: string
  moyskladId: string
  totalSales: number
  totalReturns: number
  netSales: number
  salesCount: number
  returnsCount: number
  avgCheck: number
  bestDaySales: number
}

/**
 * Вычисляет предыдущий период (месяц)
 */
export function getPreviousPeriod(period: string): string {
  const [year, month] = period.split('-').map(Number)
  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  return `${prevYear}-${String(prevMonth).padStart(2, '0')}`
}

/**
 * Сохраняет рейтинг за период
 */
export async function saveMonthlyRankings(
  period: string,
  department: DepartmentType,
  data: RankingData[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    // Сортируем по netSales для определения рангов
    const sorted = [...data].sort((a, b) => b.netSales - a.netSales)

    const rankings = sorted.map((item, index) => ({
      employee_id: item.employeeId,
      period,
      department,
      rank: index + 1,
      total_sales: item.totalSales,
      total_returns: item.totalReturns,
      net_sales: item.netSales,
      sales_count: item.salesCount,
      returns_count: item.returnsCount,
      avg_check: item.avgCheck,
      best_day_sales: item.bestDaySales,
      calculated_at: new Date().toISOString(),
    }))

    // Upsert (обновить или вставить)
    const { error } = await supabaseAdmin
      .from('monthly_rankings')
      .upsert(rankings as never, { onConflict: 'employee_id,period' })

    if (error) {
      return { success: false, count: 0, error: error.message }
    }

    return { success: true, count: rankings.length }
  } catch (err) {
    return { success: false, count: 0, error: String(err) }
  }
}

/**
 * Получает данные прошлого периода для сравнения
 */
export async function getPreviousPeriodData(
  period: string,
  employeeIds: string[]
): Promise<Map<string, MonthlyRanking>> {
  const prevPeriod = getPreviousPeriod(period)

  const { data } = await supabaseAdmin
    .from('monthly_rankings')
    .select('*')
    .eq('period', prevPeriod)
    .in('employee_id', employeeIds)

  const rankings = data as MonthlyRanking[] | null

  const map = new Map<string, MonthlyRanking>()
  for (const ranking of rankings || []) {
    map.set(ranking.employee_id, ranking)
  }
  return map
}

/**
 * Получает исторический рекорд лучшего дня для сотрудника
 * (максимум best_day_sales из всех предыдущих периодов)
 */
export async function getPersonalBestDay(
  employeeId: string,
  excludePeriod?: string
): Promise<number> {
  let query = supabaseAdmin
    .from('monthly_rankings')
    .select('best_day_sales')
    .eq('employee_id', employeeId)
    .order('best_day_sales', { ascending: false })
    .limit(1)

  if (excludePeriod) {
    query = query.neq('period', excludePeriod)
  }

  const { data } = await query
  const rows = data as { best_day_sales: number }[] | null

  return rows?.[0]?.best_day_sales || 0
}

/**
 * Получает исторические рекорды для нескольких сотрудников
 */
interface BestDayRow {
  employee_id: string
  best_day_sales: number
}

export async function getPersonalBestDays(
  employeeIds: string[],
  excludePeriod?: string
): Promise<Map<string, number>> {
  // Получаем все записи для этих сотрудников
  let query = supabaseAdmin
    .from('monthly_rankings')
    .select('employee_id, best_day_sales')
    .in('employee_id', employeeIds)

  if (excludePeriod) {
    query = query.neq('period', excludePeriod)
  }

  const { data } = await query
  const rows = data as BestDayRow[] | null

  // Находим максимум для каждого сотрудника
  const map = new Map<string, number>()
  for (const row of rows || []) {
    const current = map.get(row.employee_id) || 0
    if (row.best_day_sales > current) {
      map.set(row.employee_id, row.best_day_sales)
    }
  }

  return map
}

/**
 * Вычисляет лучший день продаж из словаря дата -> сумма
 */
export function calculateBestDaySales(
  salesByDate: Record<string, number>
): number {
  const values = Object.values(salesByDate)
  if (values.length === 0) return 0
  return Math.max(...values)
}

/**
 * Получает рейтинг сотрудника за конкретный период
 */
export async function getEmployeeRanking(
  employeeId: string,
  period: string
): Promise<MonthlyRanking | null> {
  const { data } = await supabaseAdmin
    .from('monthly_rankings')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('period', period)
    .single()

  return data as MonthlyRanking | null
}
