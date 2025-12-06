import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateSalary } from '@/lib/calculations'
import { LOCATIONS, DEPARTMENT_ROLE_CONFIG } from '@/config/salary-scales'
import { DEPARTMENT_STORE_IDS, RETAIL_STORES } from '@/config/stores'
import { calculateStreak } from '@/lib/streak'
import type { DepartmentType, Employee, Sale, Return, Achievement, EmployeeAchievement, MonthlyRanking } from '@/lib/supabase/types'

/**
 * GET /api/employee/[moyskladId]
 * Детальные данные сотрудника с сравнением периодов
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moyskladId: string }> }
) {
  try {
    const { moyskladId } = await params
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') // YYYY-MM

    if (!period) {
      return NextResponse.json({ error: 'Укажите period (YYYY-MM)' }, { status: 400 })
    }

    // Находим сотрудника
    const { data: employeeData, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('moysklad_id', moyskladId)
      .single()

    const employee = employeeData as Employee | null

    if (empError || !employee) {
      return NextResponse.json({ error: 'Сотрудник не найден' }, { status: 404 })
    }

    // Парсим период
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    // Предыдущий период
    const prevMonth = parseInt(month) === 1 ? 12 : parseInt(month) - 1
    const prevYear = parseInt(month) === 1 ? parseInt(year) - 1 : parseInt(year)
    const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`
    const prevEndDate = startDate

    type SaleWithDate = Pick<Sale, 'amount' | 'sale_date' | 'retail_store_id' | 'retail_store_name'>
    type ReturnWithDate = Pick<Return, 'amount' | 'return_date' | 'retail_store_id'>
    type ReturnAmount = Pick<Return, 'amount'>

    // Store IDs "домашнего" отдела сотрудника (для расчёта позиции в рейтинге)
    const employeeStoreIds = DEPARTMENT_STORE_IDS[employee.department as DepartmentType]

    // ========================================================================
    // ВАЖНО: Для личного профиля показываем ВСЕ продажи сотрудника
    // по ВСЕМ магазинам (не фильтруем по отделу)
    // Это даёт полную картину работы сотрудника если он работает на нескольких точках
    // ========================================================================

    // Получаем продажи за текущий период (ВСЕ магазины) С ИНФОРМАЦИЕЙ О МАГАЗИНЕ
    const { data: currentSalesData } = await supabaseAdmin
      .from('sales')
      .select('amount, sale_date, retail_store_id, retail_store_name')
      .eq('moysklad_employee_id', moyskladId)
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
    const currentSales = currentSalesData as SaleWithDate[] | null

    // Получаем продажи за прошлый период (ВСЕ магазины)
    const { data: prevSalesData } = await supabaseAdmin
      .from('sales')
      .select('amount, sale_date, retail_store_id, retail_store_name')
      .eq('moysklad_employee_id', moyskladId)
      .gte('sale_date', prevStartDate)
      .lt('sale_date', prevEndDate)
    const prevSales = prevSalesData as SaleWithDate[] | null

    // Получаем возвраты за текущий период (ВСЕ магазины) С ИНФОРМАЦИЕЙ О МАГАЗИНЕ
    const { data: currentReturnsData } = await supabaseAdmin
      .from('returns')
      .select('amount, return_date, retail_store_id')
      .eq('moysklad_employee_id', moyskladId)
      .gte('return_date', startDate)
      .lt('return_date', endDate)
    const currentReturns = currentReturnsData as ReturnWithDate[] | null

    // Получаем возвраты за прошлый период (ВСЕ магазины)
    const { data: prevReturnsData } = await supabaseAdmin
      .from('returns')
      .select('amount')
      .eq('moysklad_employee_id', moyskladId)
      .gte('return_date', prevStartDate)
      .lt('return_date', prevEndDate)
    const prevReturns = prevReturnsData as ReturnAmount[] | null

    // Получаем достижения
    type EmpAchWithJoin = EmployeeAchievement & { achievements: Achievement | null }
    const { data: achievementsData } = await supabaseAdmin
      .from('employee_achievements')
      .select(`
        id,
        period,
        earned_at,
        achievements (id, code, name, description, icon)
      `)
      .eq('employee_id', employee.id)
      .order('earned_at', { ascending: false })
    const achievements = achievementsData as EmpAchWithJoin[] | null

    // Получаем все достижения для отображения незаработанных
    const { data: allAchievementsData } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('is_active', true)
    const allAchievements = allAchievementsData as Achievement[] | null

    // Рассчитываем статистику текущего периода
    const currentStats = calculatePeriodStats(currentSales || [], currentReturns || [])
    const prevStats = calculatePeriodStats(prevSales || [], prevReturns || [])

    // Группируем продажи по магазинам
    const salesByStore = groupByStore(currentSales || [], currentReturns || [])

    // Streak
    const streak = calculateStreak(
      (currentSales || []).map(s => s.sale_date),
      endDate
    )

    // Получаем конфиг роли для расчёта ЗП
    const roleConfig = DEPARTMENT_ROLE_CONFIG[employee.department as DepartmentType]
    const location = LOCATIONS.find(l => l.id === roleConfig.locationId)
    const role = location?.roles.find(r => r.id === roleConfig.roleId)

    // Рассчитываем ЗП
    const currentSalaryResult = role ? calculateSalary(currentStats.netSales, role) : null
    const prevSalaryResult = role ? calculateSalary(prevStats.netSales, role) : null

    type SaleForRank = Pick<Sale, 'moysklad_employee_id' | 'amount'>
    type ReturnForRank = Pick<Return, 'moysklad_employee_id' | 'amount'>

    // Получаем позицию в рейтинге (текущий период) - ФИЛЬТРУЕМ ПО МАГАЗИНАМ!
    const { data: allEmployeesSalesData } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount')
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', employeeStoreIds)
    const allEmployeesSales = allEmployeesSalesData as SaleForRank[] | null

    const { data: allEmployeesReturnsData } = await supabaseAdmin
      .from('returns')
      .select('moysklad_employee_id, amount')
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .in('retail_store_id', employeeStoreIds)
    const allEmployeesReturns = allEmployeesReturnsData as ReturnForRank[] | null

    // Получаем всех сотрудников того же отдела
    const { data: deptEmployeesData } = await supabaseAdmin
      .from('employees')
      .select('moysklad_id')
      .eq('department', employee.department)
    const deptEmployees = deptEmployeesData as Pick<Employee, 'moysklad_id'>[] | null

    const deptMoyskladIds = new Set((deptEmployees || []).map(e => e.moysklad_id))

    // Рассчитываем net sales для всех (уже отфильтровано по магазинам)
    const netSalesMap: Record<string, number> = {}
    for (const sale of allEmployeesSales || []) {
      if (!deptMoyskladIds.has(sale.moysklad_employee_id)) continue
      netSalesMap[sale.moysklad_employee_id] = (netSalesMap[sale.moysklad_employee_id] || 0) + Number(sale.amount)
    }
    for (const ret of allEmployeesReturns || []) {
      if (!deptMoyskladIds.has(ret.moysklad_employee_id)) continue
      netSalesMap[ret.moysklad_employee_id] = (netSalesMap[ret.moysklad_employee_id] || 0) - Number(ret.amount)
    }

    // Сортируем и находим позицию
    const rankings = Object.entries(netSalesMap)
      .sort(([, a], [, b]) => b - a)
    const currentPosition = rankings.findIndex(([id]) => id === moyskladId) + 1

    // Позиция в прошлом месяце
    const { data: prevRankingData } = await supabaseAdmin
      .from('monthly_rankings')
      .select('rank')
      .eq('employee_id', employee.id)
      .eq('period', prevPeriod)
      .single()
    const prevRanking = prevRankingData as Pick<MonthlyRanking, 'rank'> | null

    const prevPosition = prevRanking?.rank || null

    // Форматируем достижения
    const earnedAchievements = (achievements || []).map(a => ({
      id: a.id,
      period: a.period,
      earnedAt: a.earned_at,
      achievement: a.achievements,
    }))

    const earnedIds = new Set(earnedAchievements.map(a => (a.achievement as { id: string })?.id))

    return NextResponse.json({
      employee: {
        id: employee.id,
        moyskladId: employee.moysklad_id,
        firstName: employee.first_name,
        lastName: employee.last_name,
        name: `${employee.first_name} ${employee.last_name}`,
        department: employee.department,
        isActive: employee.is_active,
        hiredAt: employee.hired_at,
      },
      period,
      current: {
        ...currentStats,
        salary: currentSalaryResult?.totalSalary || 0,
        rank: currentSalaryResult?.currentTier?.levelName || 'Новичок',
        rankEmoji: currentSalaryResult?.currentTier?.levelEmoji || '🌱',
        position: currentPosition,
        streak: streak.currentStreak,
        maxStreak: streak.maxStreak,
      },
      previous: {
        period: prevPeriod,
        ...prevStats,
        salary: prevSalaryResult?.totalSalary || 0,
        position: prevPosition,
      },
      changes: {
        sales: prevStats.totalSales > 0
          ? Math.round((currentStats.totalSales - prevStats.totalSales) / prevStats.totalSales * 100)
          : null,
        netSales: prevStats.netSales > 0
          ? Math.round((currentStats.netSales - prevStats.netSales) / prevStats.netSales * 100)
          : null,
        salary: prevSalaryResult?.totalSalary && prevSalaryResult.totalSalary > 0
          ? Math.round(((currentSalaryResult?.totalSalary || 0) - prevSalaryResult.totalSalary) / prevSalaryResult.totalSalary * 100)
          : null,
        position: prevPosition ? prevPosition - currentPosition : null,
        salesCount: currentStats.salesCount - prevStats.salesCount,
      },
      achievements: {
        earned: earnedAchievements,
        all: allAchievements || [],
        earnedIds: Array.from(earnedIds),
      },
      returns: (currentReturns || []).map(r => ({
        amount: Number(r.amount),
        date: r.return_date,
      })),
      salesByStore, // Разбивка по магазинам
    })

  } catch (error) {
    console.error('Employee API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}

function calculatePeriodStats(
  sales: Array<{ amount: number; sale_date: string }>,
  returns: Array<{ amount: number }>
) {
  const totalSales = sales.reduce((sum, s) => sum + Number(s.amount), 0)
  const totalReturns = returns.reduce((sum, r) => sum + Number(r.amount), 0)
  const salesCount = sales.length
  const returnsCount = returns.length
  const netSales = totalSales - totalReturns
  const avgCheck = salesCount > 0 ? totalSales / salesCount : 0
  const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0

  return {
    totalSales,
    totalReturns,
    salesCount,
    returnsCount,
    netSales,
    avgCheck: Math.round(avgCheck),
    returnRate: Math.round(returnRate * 10) / 10,
  }
}

/**
 * Группирует продажи и возвраты по магазинам
 */
function groupByStore(
  sales: Array<{ amount: number; retail_store_id: string | null; retail_store_name?: string | null }>,
  returns: Array<{ amount: number; retail_store_id: string | null }>
) {
  const storeMap: Record<string, {
    storeId: string
    storeName: string
    sales: number
    salesCount: number
    returns: number
    returnsCount: number
    netSales: number
  }> = {}

  // Группируем продажи
  sales.forEach(sale => {
    const storeId = sale.retail_store_id || 'unknown'
    if (!storeMap[storeId]) {
      const storeInfo = RETAIL_STORES[storeId]
      storeMap[storeId] = {
        storeId,
        storeName: storeInfo?.name || sale.retail_store_name || storeId,
        sales: 0,
        salesCount: 0,
        returns: 0,
        returnsCount: 0,
        netSales: 0,
      }
    }
    storeMap[storeId].sales += Number(sale.amount)
    storeMap[storeId].salesCount++
  })

  // Группируем возвраты
  returns.forEach(ret => {
    const storeId = ret.retail_store_id || 'unknown'
    if (!storeMap[storeId]) {
      const storeInfo = RETAIL_STORES[storeId]
      storeMap[storeId] = {
        storeId,
        storeName: storeInfo?.name || storeId,
        sales: 0,
        salesCount: 0,
        returns: 0,
        returnsCount: 0,
        netSales: 0,
      }
    }
    storeMap[storeId].returns += Number(ret.amount)
    storeMap[storeId].returnsCount++
  })

  // Вычисляем netSales для каждого магазина
  Object.values(storeMap).forEach(store => {
    store.netSales = store.sales - store.returns
  })

  // Сортируем по объему продаж (больше → первый)
  const stores = Object.values(storeMap).sort((a, b) => b.sales - a.sales)

  return stores
}
