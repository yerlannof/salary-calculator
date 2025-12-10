/**
 * GET /api/play/leaderboard
 * Публичный лидерборд с Power Rating БЕЗ денег
 *
 * Query params:
 * - department: almaty | astana (required)
 * - period: YYYY-MM (required)
 * - store: store ID (optional)
 * - date: YYYY-MM-DD (optional, для конкретного дня)
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { DEPARTMENT_STORE_IDS, RETAIL_STORES } from '@/config/stores'
import { calculateStreak } from '@/lib/streak'
import { calculatePowerRating } from '@/lib/gamification/power'
import type { PlayerProfile, Badge } from '@/lib/gamification/types'
import type { DepartmentType, Employee, Sale, Return, EmployeeAchievement, SyncLog } from '@/lib/supabase/types'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department') as DepartmentType | null
    const period = searchParams.get('period') // YYYY-MM
    const store = searchParams.get('store')
    const date = searchParams.get('date') // YYYY-MM-DD

    if (!department || !period) {
      return NextResponse.json(
        { error: 'Укажите department и period' },
        { status: 400 }
      )
    }

    const [year, month] = period.split('-')

    // Даты для фильтрации
    let startDate: string
    let endDate: string
    let yesterdayStart: string | null = null
    let yesterdayEnd: string | null = null

    if (date) {
      startDate = date
      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)
      endDate = nextDay.toISOString().slice(0, 10)

      const yesterday = new Date(date)
      yesterday.setDate(yesterday.getDate() - 1)
      yesterdayStart = yesterday.toISOString().slice(0, 10)
      yesterdayEnd = date
    } else {
      startDate = `${year}-${month}-01`
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
      endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
    }

    // Референс-дата для streak
    const today = new Date().toISOString().slice(0, 10)
    const lastDayOfPeriod = new Date(new Date(endDate).getTime() - 86400000).toISOString().slice(0, 10)
    const streakReferenceDate = lastDayOfPeriod < today ? lastDayOfPeriod : today

    // Магазины для фильтрации
    const storeIds = store && store !== 'all' ? [store] : DEPARTMENT_STORE_IDS[department]
    const isAllStores = store === 'all'

    // Получаем продажи с пагинацией
    type SaleForTeam = Pick<Sale, 'moysklad_employee_id' | 'amount' | 'sale_date'> & { retail_store_id: string }
    let allSales: SaleForTeam[] = []
    let offset = 0
    const pageSize = 1000

    while (true) {
      const { data: salesPage, error: salesError } = await supabaseAdmin
        .from('sales')
        .select('moysklad_employee_id, amount, sale_date, retail_store_id', { count: 'exact' })
        .gte('sale_date', startDate)
        .lt('sale_date', endDate)
        .in('retail_store_id', storeIds)
        .order('id')
        .range(offset, offset + pageSize - 1)

      if (salesError) {
        console.error('Error fetching sales:', salesError)
        return NextResponse.json({ error: 'Ошибка загрузки продаж' }, { status: 500 })
      }

      if (!salesPage || salesPage.length === 0) break
      allSales = allSales.concat(salesPage as SaleForTeam[])
      if (salesPage.length < pageSize) break
      offset += pageSize
    }

    const sales = allSales

    // Получаем сотрудников
    const uniqueEmployeeMoyskladIds = Array.from(new Set(sales.map(s => s.moysklad_employee_id)))
    let employees: Employee[] = []

    if (uniqueEmployeeMoyskladIds.length > 0) {
      const { data: employeesData, error: empError } = await supabaseAdmin
        .from('employees')
        .select('*')
        .in('moysklad_id', uniqueEmployeeMoyskladIds)

      if (empError) {
        console.error('Error fetching employees:', empError)
        return NextResponse.json({ error: 'Ошибка загрузки сотрудников' }, { status: 500 })
      }
      employees = (employeesData as Employee[] | null) || []
    }

    // Получаем достижения
    const employeeIds = employees.map(e => e.id)
    type EmpAchWithJoin = Pick<EmployeeAchievement, 'employee_id'> & {
      achievements: { id: string; code: string; name: string; icon: string | null } | null
    }
    const { data: achievementsData } = await supabaseAdmin
      .from('employee_achievements')
      .select(`
        employee_id,
        achievements (id, code, name, icon)
      `)
      .in('employee_id', employeeIds)
      .eq('period', period)

    const achievements = achievementsData as EmpAchWithJoin[] | null

    // Получаем возвраты
    type ReturnForTeam = Pick<Return, 'moysklad_employee_id' | 'amount'>
    let returnsData: ReturnForTeam[] = []
    let returnsOffset = 0

    while (true) {
      const { data: returnsPage, error: returnsError } = await supabaseAdmin
        .from('returns')
        .select('moysklad_employee_id, amount', { count: 'exact' })
        .gte('return_date', startDate)
        .lt('return_date', endDate)
        .in('retail_store_id', storeIds)
        .order('id')
        .range(returnsOffset, returnsOffset + pageSize - 1)

      if (returnsError) break
      if (!returnsPage || returnsPage.length === 0) break

      returnsData = returnsData.concat(returnsPage as ReturnForTeam[])
      if (returnsPage.length < pageSize) break
      returnsOffset += pageSize
    }

    // Группируем продажи
    const salesByEmployee: Record<string, { total: number; count: number; dates: string[]; storeIds: Set<string> }> = {}
    for (const sale of sales) {
      if (!salesByEmployee[sale.moysklad_employee_id]) {
        salesByEmployee[sale.moysklad_employee_id] = { total: 0, count: 0, dates: [], storeIds: new Set() }
      }
      salesByEmployee[sale.moysklad_employee_id].total += Number(sale.amount)
      salesByEmployee[sale.moysklad_employee_id].count++
      salesByEmployee[sale.moysklad_employee_id].dates.push(sale.sale_date)
      salesByEmployee[sale.moysklad_employee_id].storeIds.add(sale.retail_store_id)
    }

    // Группируем возвраты
    const returnsByEmployee: Record<string, { total: number; count: number }> = {}
    for (const ret of returnsData) {
      if (!returnsByEmployee[ret.moysklad_employee_id]) {
        returnsByEmployee[ret.moysklad_employee_id] = { total: 0, count: 0 }
      }
      returnsByEmployee[ret.moysklad_employee_id].total += Number(ret.amount)
      returnsByEmployee[ret.moysklad_employee_id].count++
    }

    // Группируем достижения
    const achievementsByEmployee: Record<string, Badge[]> = {}
    for (const ach of achievements || []) {
      if (!achievementsByEmployee[ach.employee_id]) {
        achievementsByEmployee[ach.employee_id] = []
      }
      if (ach.achievements) {
        achievementsByEmployee[ach.employee_id].push(ach.achievements as Badge)
      }
    }

    // Вычисляем средний чек по отделу (для качественного бонуса)
    let departmentAvgCheck = 0
    const totalSalesAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0)
    const totalSalesCount = sales.length
    if (totalSalesCount > 0) {
      departmentAvgCheck = totalSalesAmount / totalSalesCount
    }

    // Формируем результат
    const players: PlayerProfile[] = employees.map(emp => {
      const empSales = salesByEmployee[emp.moysklad_id] || { total: 0, count: 0, dates: [], storeIds: new Set<string>() }
      const empReturns = returnsByEmployee[emp.moysklad_id] || { total: 0, count: 0 }
      const empAchievements = achievementsByEmployee[emp.id] || []
      const empStreak = calculateStreak(empSales.dates, streakReferenceDate)

      const netSales = empSales.total - empReturns.total
      const avgCheck = empSales.count > 0 ? empSales.total / empSales.count : 0

      // РАСЧЁТ POWER RATING
      const power = calculatePowerRating({
        netSales,
        salesCount: empSales.count,
        returnsCount: empReturns.count,
        avgCheck,
        departmentAvgCheck,
        streak: empStreak.currentStreak,
        // completedChallenges пока не реализованы
      })

      return {
        id: emp.id,
        moyskladId: emp.moysklad_id,
        name: `${emp.first_name} ${emp.last_name}`,
        firstName: emp.first_name,
        lastName: emp.last_name,
        photoUrl: emp.photo_url || emp.photo_tiny_url || null,
        isActive: emp.is_active,

        // Power Rating (ПУБЛИЧНО)
        power,

        // Позиция (заполним после сортировки)
        position: 0,
        prevPosition: null,
        positionChange: 0,

        // Streak и badges
        streak: empStreak.currentStreak,
        maxStreak: empStreak.maxStreak,
        badges: empAchievements,

        // Challenger статус (заполним для топ-3)
        isChallenger: false,

        // Количества (БЕЗ ДЕНЕГ!)
        salesCount: empSales.count,
        shiftCount: new Set(empSales.dates).size,
        returnsCount: empReturns.count,

        // Магазины
        stores: isAllStores ? Array.from(empSales.storeIds).map(id => ({
          id,
          name: RETAIL_STORES[id]?.name || 'Неизвестный магазин'
        })) : [],
      }
    })

    // Сортируем по totalPower
    players.sort((a, b) => b.power.totalPower - a.power.totalPower)

    // Заполняем позиции и Challenger статус
    players.forEach((player, idx) => {
      player.position = idx + 1
      player.isChallenger = player.position <= 3
      if (player.isChallenger) {
        player.challengerRank = player.position as 1 | 2 | 3
      }
    })

    // Информация о синхронизации
    const { data: lastSyncData } = await supabaseAdmin
      .from('sync_log')
      .select('*')
      .eq('sync_type', 'sales')
      .eq('period', period)
      .order('completed_at', { ascending: false })
      .limit(1)
      .single()

    const lastSync = lastSyncData as SyncLog | null

    return NextResponse.json({
      players,
      period,
      date: date || null,
      department,
      lastSync: lastSync ? {
        at: lastSync.completed_at,
        status: lastSync.status,
        recordsSynced: lastSync.records_synced,
      } : null,
      totals: {
        players: players.length,
        totalPower: players.reduce((sum, p) => sum + p.power.totalPower, 0),
      }
    })

  } catch (error) {
    console.error('Play Leaderboard API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
