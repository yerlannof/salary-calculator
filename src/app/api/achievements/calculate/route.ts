import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { checkAchievements, EmployeeStats, Achievement } from '@/lib/achievements'
import { calculateStreak } from '@/lib/streak'
import { getPreviousPeriodData, getPersonalBestDays, calculateBestDaySales } from '@/lib/rankings'
import type { DepartmentType, Employee, Sale, Return, Achievement as DbAchievement, EmployeeAchievement } from '@/lib/supabase/types'

/**
 * POST /api/achievements/calculate
 * Рассчитывает и начисляет достижения для периода
 */
export async function POST(request: NextRequest) {
  try {
    const { period, department } = await request.json()

    if (!period) {
      return NextResponse.json({ error: 'Укажите period (YYYY-MM)' }, { status: 400 })
    }

    // Парсим период
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    // Референс-дата для streak: последний день периода или сегодня (что раньше)
    const today = new Date().toISOString().slice(0, 10)
    const lastDayOfPeriod = new Date(new Date(endDate).getTime() - 86400000).toISOString().slice(0, 10)
    const streakReferenceDate = lastDayOfPeriod < today ? lastDayOfPeriod : today

    // Получаем все достижения
    const { data: achievementsData, error: achError } = await supabaseAdmin
      .from('achievements')
      .select('*')
      .eq('is_active', true)

    const achievements = achievementsData as DbAchievement[] | null

    if (achError || !achievements) {
      return NextResponse.json({ error: 'Ошибка загрузки достижений' }, { status: 500 })
    }

    // Получаем сотрудников
    let employeesQuery = supabaseAdmin.from('employees').select('*')
    if (department) {
      employeesQuery = employeesQuery.eq('department', department as DepartmentType)
    }

    const { data: employeesData, error: empError } = await employeesQuery
    const employees = employeesData as Employee[] | null
    if (empError || !employees) {
      return NextResponse.json({ error: 'Ошибка загрузки сотрудников' }, { status: 500 })
    }

    // Получаем продажи за период
    const { data: salesData } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount, sale_date')
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)

    const sales = salesData as Pick<Sale, 'moysklad_employee_id' | 'amount' | 'sale_date'>[] | null

    // Получаем возвраты за период
    const { data: returnsData } = await supabaseAdmin
      .from('returns')
      .select('moysklad_employee_id, amount')
      .gte('return_date', startDate)
      .lt('return_date', endDate)

    const returns = returnsData as Pick<Return, 'moysklad_employee_id' | 'amount'>[] | null

    // Получаем уже начисленные достижения за этот период
    type EmpAchWithJoin = EmployeeAchievement & { achievements: { code: string } | null }
    const { data: existingAchievementsData } = await supabaseAdmin
      .from('employee_achievements')
      .select('employee_id, achievement_id, achievements(code)')
      .eq('period', period)

    const existingAchievements = existingAchievementsData as EmpAchWithJoin[] | null

    // Группируем данные по сотрудникам (включая продажи по датам)
    const salesByEmployee: Record<string, { total: number; count: number; dates: string[]; byDate: Record<string, number> }> = {}
    const returnsByEmployee: Record<string, { total: number; count: number }> = {}

    for (const sale of sales || []) {
      if (!salesByEmployee[sale.moysklad_employee_id]) {
        salesByEmployee[sale.moysklad_employee_id] = { total: 0, count: 0, dates: [], byDate: {} }
      }
      const amount = Number(sale.amount)
      salesByEmployee[sale.moysklad_employee_id].total += amount
      salesByEmployee[sale.moysklad_employee_id].count++
      salesByEmployee[sale.moysklad_employee_id].dates.push(sale.sale_date)
      // Группируем по датам для расчёта лучшего дня
      if (!salesByEmployee[sale.moysklad_employee_id].byDate[sale.sale_date]) {
        salesByEmployee[sale.moysklad_employee_id].byDate[sale.sale_date] = 0
      }
      salesByEmployee[sale.moysklad_employee_id].byDate[sale.sale_date] += amount
    }

    for (const ret of returns || []) {
      if (!returnsByEmployee[ret.moysklad_employee_id]) {
        returnsByEmployee[ret.moysklad_employee_id] = { total: 0, count: 0 }
      }
      returnsByEmployee[ret.moysklad_employee_id].total += Number(ret.amount)
      returnsByEmployee[ret.moysklad_employee_id].count++
    }

    // Получаем данные прошлого периода для сравнения
    const employeeIds = employees.map(e => e.id)
    const prevPeriodData = await getPreviousPeriodData(period, employeeIds)
    const personalBestDays = await getPersonalBestDays(employeeIds, period)

    // Рассчитываем рейтинг
    const rankings = employees.map(emp => ({
      employeeId: emp.id,
      moyskladId: emp.moysklad_id,
      netSales: (salesByEmployee[emp.moysklad_id]?.total || 0) -
        (returnsByEmployee[emp.moysklad_id]?.total || 0),
    }))
      .sort((a, b) => b.netSales - a.netSales)

    const rankMap: Record<string, number> = {}
    rankings.forEach((r, idx) => {
      rankMap[r.employeeId] = idx + 1
    })

    // Собираем существующие достижения по сотрудникам
    const existingByEmployee: Record<string, string[]> = {}
    for (const ea of existingAchievements || []) {
      if (!existingByEmployee[ea.employee_id]) {
        existingByEmployee[ea.employee_id] = []
      }
      const achCode = (ea.achievements as { code: string } | null)?.code
      if (achCode) {
        existingByEmployee[ea.employee_id].push(achCode)
      }
    }

    // Конвертируем достижения в нужный формат
    const achievementsList: Achievement[] = achievements.map(a => ({
      id: a.id,
      code: a.code,
      name: a.name,
      description: a.description,
      icon: a.icon,
      criteria: a.criteria as { type: string; value: number },
      isActive: a.is_active,
    }))

    // Проверяем достижения для каждого сотрудника
    let totalEarned = 0
    const errors: string[] = []

    for (const emp of employees) {
      const empSales = salesByEmployee[emp.moysklad_id] || { total: 0, count: 0, dates: [], byDate: {} }
      const empReturns = returnsByEmployee[emp.moysklad_id] || { total: 0, count: 0 }

      // Данные прошлого периода для этого сотрудника
      const prevData = prevPeriodData.get(emp.id)
      const personalBest = personalBestDays.get(emp.id) || 0

      // Средний чек текущего периода
      const avgCheck = empSales.count > 0 ? empSales.total / empSales.count : 0

      // Лучший день текущего периода
      const bestDaySales = calculateBestDaySales(empSales.byDate)

      // Определяем wasOutOfTop5
      const wasOutOfTop5 = prevData ? prevData.rank > 5 : true // Новичок = был вне топа

      const stats: EmployeeStats = {
        employeeId: emp.id,
        moyskladId: emp.moysklad_id,
        totalSales: empSales.total,
        salesCount: empSales.count,
        totalReturns: empReturns.total,
        returnsCount: empReturns.count,
        netSales: empSales.total - empReturns.total,
        rank: rankMap[emp.id] || 0,
        streak: calculateStreak(empSales.dates, streakReferenceDate),
        // Новые поля для дополнительных достижений
        avgCheck,
        prevAvgCheck: prevData?.avg_check || null,
        bestDaySales,
        personalBestDay: personalBest || null,
        prevRank: prevData?.rank || null,
        wasOutOfTop5,
      }

      const existing = existingByEmployee[emp.id] || []
      const earned = checkAchievements(stats, achievementsList, existing)

      // Сохраняем новые достижения
      for (const achievement of earned) {
        const insertData = {
          employee_id: emp.id,
          achievement_id: achievement.achievementId,
          period,
          earned_at: achievement.earnedAt,
          metadata: achievement.metadata,
        }
        const { error } = await supabaseAdmin
          .from('employee_achievements')
          .insert(insertData as never)

        if (error) {
          errors.push(`Ошибка сохранения ${achievement.achievementCode} для ${emp.first_name}: ${error.message}`)
        } else {
          totalEarned++
        }
      }
    }

    return NextResponse.json({
      success: true,
      period,
      earned: totalEarned,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Calculate achievements error:', error)
    return NextResponse.json(
      { error: 'Ошибка расчёта достижений' },
      { status: 500 }
    )
  }
}
