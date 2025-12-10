/**
 * GET /api/play/profile/[moyskladId]
 * Приватный профиль игрока С ПОЛНОЙ информацией включая ЗП
 *
 * Query params:
 * - period: YYYY-MM (required)
 * - department: almaty | astana (optional, для определения магазинов)
 */

import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateSalary } from '@/lib/calculations'
import { DEPARTMENT_ROLE_CONFIG } from '@/config/salary-scales'
import { LOCATIONS } from '@/config/salary-scales'
import { DEPARTMENT_STORE_IDS } from '@/config/stores'
import { calculateStreak } from '@/lib/streak'
import { calculatePowerRating, getPowerBreakdown } from '@/lib/gamification/power'
import type { PlayerStats, Badge } from '@/lib/gamification/types'
import type { DepartmentType, Employee, Sale, Return, EmployeeAchievement } from '@/lib/supabase/types'

export async function GET(
  request: NextRequest,
  { params }: { params: { moyskladId: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') // YYYY-MM
    const department = searchParams.get('department') as DepartmentType | null

    if (!period) {
      return NextResponse.json(
        { error: 'Укажите period' },
        { status: 400 }
      )
    }

    const moyskladId = params.moyskladId
    const [year, month] = period.split('-')

    // Даты периода
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    // Референс-дата для streak
    const today = new Date().toISOString().slice(0, 10)
    const lastDayOfPeriod = new Date(new Date(endDate).getTime() - 86400000).toISOString().slice(0, 10)
    const streakReferenceDate = lastDayOfPeriod < today ? lastDayOfPeriod : today

    // Получаем сотрудника
    const { data: employeeData, error: empError } = await supabaseAdmin
      .from('employees')
      .select('*')
      .eq('moysklad_id', moyskladId)
      .single()

    if (empError || !employeeData) {
      return NextResponse.json(
        { error: 'Сотрудник не найден' },
        { status: 404 }
      )
    }

    const employee = employeeData as Employee

    // Определяем отдел сотрудника (или используем переданный)
    const empDepartment = (department || employee.department) as DepartmentType
    const storeIds = DEPARTMENT_STORE_IDS[empDepartment] || []

    // Получаем продажи сотрудника за период
    type SaleData = Pick<Sale, 'amount' | 'sale_date'>
    const { data: salesData } = await supabaseAdmin
      .from('sales')
      .select('amount, sale_date')
      .eq('moysklad_employee_id', moyskladId)
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', storeIds)

    const sales = (salesData as SaleData[] | null) || []

    // Получаем возвраты
    type ReturnData = Pick<Return, 'amount'>
    const { data: returnsData } = await supabaseAdmin
      .from('returns')
      .select('amount')
      .eq('moysklad_employee_id', moyskladId)
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .in('retail_store_id', storeIds)

    const returns = (returnsData as ReturnData[] | null) || []

    // Получаем достижения
    type EmpAchWithJoin = Pick<EmployeeAchievement, 'employee_id'> & {
      achievements: { id: string; code: string; name: string; icon: string | null } | null
    }
    const { data: achievementsData } = await supabaseAdmin
      .from('employee_achievements')
      .select(`
        employee_id,
        achievements (id, code, name, icon)
      `)
      .eq('employee_id', employee.id)
      .eq('period', period)

    const achievements = achievementsData as EmpAchWithJoin[] | null

    // Вычисляем статистику
    const totalSales = sales.reduce((sum, s) => sum + Number(s.amount), 0)
    const totalReturns = returns.reduce((sum, r) => sum + Number(r.amount), 0)
    const netSales = totalSales - totalReturns
    const salesCount = sales.length
    const returnsCount = returns.length

    const avgCheck = salesCount > 0 ? totalSales / salesCount : 0
    const returnRate = totalSales > 0 ? (totalReturns / totalSales) * 100 : 0

    const salesDates = sales.map(s => s.sale_date)
    const empStreak = calculateStreak(salesDates, streakReferenceDate)
    const shiftCount = new Set(salesDates).size

    const badges: Badge[] = []
    for (const ach of achievements || []) {
      if (ach.achievements) {
        badges.push(ach.achievements as Badge)
      }
    }

    // Вычисляем ЗП
    const roleConfig = DEPARTMENT_ROLE_CONFIG[empDepartment]
    const location = LOCATIONS.find(l => l.id === roleConfig.locationId)
    const role = location?.roles.find(r => r.id === roleConfig.roleId)
    const salaryResult = role ? calculateSalary(netSales, role) : null

    // Вычисляем Power Rating
    const power = calculatePowerRating({
      netSales,
      salesCount,
      returnsCount,
      avgCheck,
      streak: empStreak.currentStreak,
    })

    // Получаем позицию в рейтинге (нужно запросить всех игроков за период)
    // Упрощённо: получим всех сотрудников отдела и отсортируем
    const { data: allSalesData } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount')
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', storeIds)

    const allSales = (allSalesData as { moysklad_employee_id: string; amount: number }[] | null) || []

    const { data: allReturnsData } = await supabaseAdmin
      .from('returns')
      .select('moysklad_employee_id, amount')
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .in('retail_store_id', storeIds)

    const allReturns = (allReturnsData as { moysklad_employee_id: string; amount: number }[] | null) || []

    // Группируем по сотрудникам
    const netSalesByEmployee: Record<string, number> = {}
    for (const sale of allSales) {
      netSalesByEmployee[sale.moysklad_employee_id] = (netSalesByEmployee[sale.moysklad_employee_id] || 0) + Number(sale.amount)
    }
    for (const ret of allReturns) {
      netSalesByEmployee[ret.moysklad_employee_id] = (netSalesByEmployee[ret.moysklad_employee_id] || 0) - Number(ret.amount)
    }

    // Вычисляем позицию
    const sortedEmployees = Object.entries(netSalesByEmployee)
      .map(([id, sales]) => ({ id, sales }))
      .sort((a, b) => b.sales - a.sales)

    const position = sortedEmployees.findIndex(e => e.id === moyskladId) + 1

    // Формируем ответ
    const player: PlayerStats = {
      id: employee.id,
      moyskladId: employee.moysklad_id,
      name: `${employee.first_name} ${employee.last_name}`,
      firstName: employee.first_name,
      lastName: employee.last_name,
      photoUrl: employee.photo_url || employee.photo_tiny_url || null,
      isActive: employee.is_active,

      // Power Rating
      power,

      // Позиция
      position,
      prevPosition: null, // TODO: получить из monthly_rankings
      positionChange: 0,

      // Streak и badges
      streak: empStreak.currentStreak,
      maxStreak: empStreak.maxStreak,
      badges,

      // Challenger
      isChallenger: position <= 3,
      challengerRank: position <= 3 ? position as 1 | 2 | 3 : undefined,

      // Количества
      salesCount,
      shiftCount,
      returnsCount,

      // === ПРИВАТНЫЕ ДАННЫЕ ===

      // Зарплата
      salary: {
        base: role?.baseSalary || 0,
        bonus: salaryResult?.totalBonus || 0,
        total: salaryResult?.totalSalary || 0,
      },

      // Продажи в деньгах
      sales: {
        gross: totalSales,
        returns: totalReturns,
        net: netSales,
      },

      // Чеки
      checks: {
        count: salesCount,
        avgCheck,
        maxCheck: salesCount > 0 ? Math.max(...sales.map(s => Number(s.amount))) : 0,
        minCheck: salesCount > 0 ? Math.min(...sales.map(s => Number(s.amount))) : 0,
      },

      // Return rate
      returnRate: Math.round(returnRate * 10) / 10,

      // Power breakdown
      powerBreakdown: getPowerBreakdown(power),
    }

    return NextResponse.json({
      player,
      period,
      department: empDepartment,
    })

  } catch (error) {
    console.error('Play Profile API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
