import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { calculateSalary } from '@/lib/calculations'
import { LOCATIONS } from '@/config/salary-scales'
import { calculateStreak } from '@/lib/streak'
import type { DepartmentType, Employee, Sale, Return, MonthlyRanking, EmployeeAchievement, SyncLog } from '@/lib/supabase/types'

// Маппинг отделов на конфиги ролей
const DEPARTMENT_ROLE_CONFIG: Record<DepartmentType, { locationId: string; roleId: string }> = {
  moscow: { locationId: 'trc-moscow', roleId: 'trc-seller' },
  online: { locationId: 'online', roleId: 'online-manager' },
  tsum: { locationId: 'td-tsum', roleId: 'tsum-admin' },
  almaty: { locationId: 'almaty', roleId: 'almaty-seller' },
  astana: { locationId: 'astana', roleId: 'astana-seller' },
}

// Маппинг отделов на retail store IDs
const DEPARTMENT_STORE_IDS: Record<DepartmentType, string[]> = {
  moscow: ['b9585357-b51b-11ee-0a80-15c6000bc3b8'],
  tsum: ['b5a56c15-b162-11ee-0a80-02a00015a9f3'],
  online: [
    'd491733b-b6f8-11ee-0a80-033a0016fb6b',
    'd1b4400d-007b-11ef-0a80-14800035ff62',
    'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81'
  ],
  almaty: ['68d485c9-b131-11ee-0a80-066b000af5c1'], // Байтурсынова
  astana: [
    'b75138dd-b6f8-11ee-0a80-09610016847f', // Аружан
    'c341e43f-b6f8-11ee-0a80-103e0016edda'  // Ауэзова (Астана Стрит)
  ],
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department') as DepartmentType | null
    const period = searchParams.get('period') // YYYY-MM

    if (!department || !period) {
      return NextResponse.json(
        { error: 'Укажите department и period' },
        { status: 400 }
      )
    }

    // Парсим период для фильтрации продаж
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    // Референс-дата для streak: последний день периода или сегодня (что раньше)
    const today = new Date().toISOString().slice(0, 10)
    const lastDayOfPeriod = new Date(new Date(endDate).getTime() - 86400000).toISOString().slice(0, 10)
    const streakReferenceDate = lastDayOfPeriod < today ? lastDayOfPeriod : today

    // Вычисляем предыдущий период для сравнения рангов
    const prevMonth = parseInt(month) === 1 ? 12 : parseInt(month) - 1
    const prevYear = parseInt(month) === 1 ? parseInt(year) - 1 : parseInt(year)
    const prevPeriod = `${prevYear}-${String(prevMonth).padStart(2, '0')}`

    // ========================================================================
    // ВАЖНО: Логика "продажи по магазину, а не по отделу сотрудника"
    //
    // 1. Сначала получаем ВСЕ продажи в магазинах этого отдела
    // 2. Затем находим ВСЕХ сотрудников кто продавал (независимо от их отдела)
    // 3. Это позволяет видеть продажи Ибрагимова в Online, даже если он в TSUM
    // ========================================================================

    type SaleForTeam = Pick<Sale, 'moysklad_employee_id' | 'amount' | 'sale_date'>
    // 1. Получаем продажи за период (фильтруем по магазинам отдела)
    const storeIds = DEPARTMENT_STORE_IDS[department]
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount, sale_date', { count: 'exact' })
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', storeIds)
      .limit(10000)

    const sales = salesData as SaleForTeam[] | null

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json({ error: 'Ошибка загрузки продаж' }, { status: 500 })
    }

    // 2. Собираем уникальные moysklad_id сотрудников из продаж
    const uniqueEmployeeMoyskladIds = [...new Set((sales || []).map(s => s.moysklad_employee_id))]

    // 3. Получаем данные ВСЕХ сотрудников кто продавал в этих магазинах
    // (независимо от их "домашнего" отдела!)
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

    // Получаем достижения сотрудников за период
    const employeeIds = employees.map(e => e.id)
    type EmpAchWithJoin = Pick<EmployeeAchievement, 'employee_id'> & { achievements: { id: string; code: string; name: string; icon: string | null } | null }
    const { data: achievementsData } = await supabaseAdmin
      .from('employee_achievements')
      .select(`
        employee_id,
        achievements (id, code, name, icon)
      `)
      .in('employee_id', employeeIds)
      .eq('period', period)

    const achievements = achievementsData as EmpAchWithJoin[] | null

    // Получаем возвраты за период (фильтруем по магазинам отдела)
    type ReturnForTeam = Pick<Return, 'moysklad_employee_id' | 'amount'>
    const { data: returnsRaw, error: returnsError } = await supabaseAdmin
      .from('returns')
      .select('moysklad_employee_id, amount', { count: 'exact' })
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .in('retail_store_id', storeIds)
      .limit(10000)

    // Если таблица returns ещё не создана, игнорируем ошибку
    const returnsData: ReturnForTeam[] = returnsError ? [] : ((returnsRaw as ReturnForTeam[] | null) || [])

    // Получаем рейтинги прошлого месяца для сравнения
    type RankingEntry = Pick<MonthlyRanking, 'employee_id' | 'rank'>
    const { data: prevRankingsData } = await supabaseAdmin
      .from('monthly_rankings')
      .select('employee_id, rank')
      .eq('period', prevPeriod)
      .eq('department', department)

    const prevRankings = prevRankingsData as RankingEntry[] | null

    const prevRankMap: Record<string, number> = {}
    for (const r of prevRankings || []) {
      prevRankMap[r.employee_id] = r.rank
    }

    // Группируем продажи по сотруднику (с датами для streak)
    const salesByEmployee: Record<string, { total: number; count: number; dates: string[] }> = {}
    for (const sale of sales || []) {
      if (!salesByEmployee[sale.moysklad_employee_id]) {
        salesByEmployee[sale.moysklad_employee_id] = { total: 0, count: 0, dates: [] }
      }
      salesByEmployee[sale.moysklad_employee_id].total += Number(sale.amount)
      salesByEmployee[sale.moysklad_employee_id].count++
      salesByEmployee[sale.moysklad_employee_id].dates.push(sale.sale_date)
    }

    // Группируем достижения по сотрудникам
    const achievementsByEmployee: Record<string, Array<{ id: string; code: string; name: string; icon: string | null }>> = {}
    for (const ach of achievements || []) {
      if (!achievementsByEmployee[ach.employee_id]) {
        achievementsByEmployee[ach.employee_id] = []
      }
      if (ach.achievements) {
        achievementsByEmployee[ach.employee_id].push(ach.achievements as { id: string; code: string; name: string; icon: string | null })
      }
    }

    // Группируем возвраты по сотруднику
    const returnsByEmployee: Record<string, { total: number; count: number }> = {}
    for (const ret of returnsData) {
      if (!returnsByEmployee[ret.moysklad_employee_id]) {
        returnsByEmployee[ret.moysklad_employee_id] = { total: 0, count: 0 }
      }
      returnsByEmployee[ret.moysklad_employee_id].total += Number(ret.amount)
      returnsByEmployee[ret.moysklad_employee_id].count++
    }

    // Получаем конфиг роли для расчёта ЗП
    const roleConfig = DEPARTMENT_ROLE_CONFIG[department]
    const location = LOCATIONS.find(l => l.id === roleConfig.locationId)
    const role = location?.roles.find(r => r.id === roleConfig.roleId)

    // Формируем результат
    const result = employees.map(emp => {
      const empSales = salesByEmployee[emp.moysklad_id] || { total: 0, count: 0, dates: [] }
      const empReturns = returnsByEmployee[emp.moysklad_id] || { total: 0, count: 0 }
      const empAchievements = achievementsByEmployee[emp.id] || []
      const empStreak = calculateStreak(empSales.dates, streakReferenceDate)

      // Чистые продажи = продажи - возвраты
      const netSales = empSales.total - empReturns.total

      // ЗП считаем от чистых продаж
      const salaryResult = role ? calculateSalary(netSales, role) : null

      const currentTier = salaryResult?.currentTier
      const nextTier = salaryResult?.nextTier

      // Прогресс внутри текущего уровня
      let progress = 0
      if (currentTier) {
        const tierSize = currentTier.maxSales - currentTier.minSales
        const salesInTier = netSales - currentTier.minSales
        progress = Math.min(100, Math.max(0, (salesInTier / tierSize) * 100))
      }

      // Средний чек
      const avgCheck = empSales.count > 0 ? empSales.total / empSales.count : 0

      // Return rate (% возвратов от продаж)
      const returnRate = empSales.total > 0 ? (empReturns.total / empSales.total) * 100 : 0

      // Количество смен (уникальных дней продаж)
      const shiftCount = new Set(empSales.dates).size

      return {
        id: emp.id,
        moysklad_id: emp.moysklad_id,
        name: `${emp.first_name} ${emp.last_name}`,
        firstName: emp.first_name,
        lastName: emp.last_name,
        isActive: emp.is_active,
        photoUrl: emp.photo_url || emp.photo_tiny_url || null,
        // Продажи
        totalSales: empSales.total,
        salesCount: empSales.count,
        shiftCount, // Количество смен (уникальных дней)
        // Возвраты
        totalReturns: empReturns.total,
        returnsCount: empReturns.count,
        returnRate: Math.round(returnRate * 10) / 10,
        // Чистые продажи
        netSales,
        avgCheck: Math.round(avgCheck),
        // ЗП и ранг
        salary: salaryResult?.totalSalary || 0,
        rank: currentTier?.levelName || 'Новичок',
        rankEmoji: currentTier?.levelEmoji || '🌱',
        progress,
        nextRank: nextTier?.levelName || null,
        salesUntilNext: salaryResult?.salesUntilNextTier || 0,
        // Позиция в рейтинге (заполним после сортировки)
        position: 0,
        prevPosition: prevRankMap[emp.id] || null,
        positionChange: 0,
        // Streak и достижения
        streak: empStreak.currentStreak,
        maxStreak: empStreak.maxStreak,
        achievements: empAchievements,
      }
    })

    // Сортируем по чистым продажам (больше → выше)
    result.sort((a, b) => b.netSales - a.netSales)

    // Заполняем позиции и изменения
    result.forEach((emp, idx) => {
      emp.position = idx + 1
      if (emp.prevPosition !== null) {
        emp.positionChange = emp.prevPosition - emp.position // положительное = поднялся
      }
    })

    // Также получаем информацию о последней синхронизации
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
      employees: result,
      period,
      department,
      lastSync: lastSync ? {
        at: lastSync.completed_at,
        status: lastSync.status,
        recordsSynced: lastSync.records_synced,
      } : null,
      totals: {
        sales: result.reduce((sum, e) => sum + e.totalSales, 0),
        returns: result.reduce((sum, e) => sum + e.totalReturns, 0),
        netSales: result.reduce((sum, e) => sum + e.netSales, 0),
        fot: result.reduce((sum, e) => sum + e.salary, 0),
        employees: result.length,
        avgReturnRate: result.length > 0
          ? Math.round(result.reduce((sum, e) => sum + e.returnRate, 0) / result.length * 10) / 10
          : 0,
      }
    })

  } catch (error) {
    console.error('Team API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
