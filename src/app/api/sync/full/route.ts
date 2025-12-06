import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import { saveMonthlyRankings, calculateBestDaySales, type RankingData } from '@/lib/rankings'
import type { DepartmentType } from '@/lib/supabase/types'

interface SaleRow {
  moysklad_employee_id: string
  amount: number
  sale_date: string
}

interface ReturnRow {
  moysklad_employee_id: string
  amount: number
}

interface EmployeeRow {
  id: string
  moysklad_id: string
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

interface SyncStep {
  name: string
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  startedAt?: string
  completedAt?: string
  result?: unknown
  error?: string
}

/**
 * POST /api/sync/full
 * Полная синхронизация за период:
 * 1. Employees (если нужно)
 * 2. Sales за период
 * 3. Link sales → employees
 * 4. Returns за период
 * 5. Link returns → employees
 * 6. Calculate monthly rankings
 * 7. Calculate achievements
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const steps: SyncStep[] = []

  try {
    const body = await request.json()
    const { period, syncEmployees = false } = body

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json({ error: 'Укажите period в формате YYYY-MM' }, { status: 400 })
    }

    const baseUrl = request.nextUrl.origin

    // Шаг 1: Синхронизация сотрудников (опционально)
    if (syncEmployees) {
      steps.push({ name: 'employees', status: 'running', startedAt: new Date().toISOString() })
      try {
        const empRes = await fetch(`${baseUrl}/api/sync/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        })
        const empData = await empRes.json()
        steps[steps.length - 1].status = empData.success ? 'success' : 'failed'
        steps[steps.length - 1].result = empData
        steps[steps.length - 1].completedAt = new Date().toISOString()
      } catch (err) {
        steps[steps.length - 1].status = 'failed'
        steps[steps.length - 1].error = String(err)
      }
    }

    // Шаг 2: Синхронизация продаж
    steps.push({ name: 'sales', status: 'running', startedAt: new Date().toISOString() })
    try {
      const salesRes = await fetch(`${baseUrl}/api/sync/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const salesData = await salesRes.json()
      steps[steps.length - 1].status = salesData.success ? 'success' : 'failed'
      steps[steps.length - 1].result = salesData
      steps[steps.length - 1].completedAt = new Date().toISOString()
    } catch (err) {
      steps[steps.length - 1].status = 'failed'
      steps[steps.length - 1].error = String(err)
    }

    // Шаг 3: Связывание sales → employees
    steps.push({ name: 'link-sales', status: 'running', startedAt: new Date().toISOString() })
    try {
      const linkRes = await fetch(`${baseUrl}/api/sync/link-employees`, {
        method: 'POST',
      })
      const linkData = await linkRes.json()
      steps[steps.length - 1].status = linkData.success !== false ? 'success' : 'failed'
      steps[steps.length - 1].result = linkData
      steps[steps.length - 1].completedAt = new Date().toISOString()
    } catch (err) {
      steps[steps.length - 1].status = 'failed'
      steps[steps.length - 1].error = String(err)
    }

    // Шаг 4: Синхронизация возвратов
    steps.push({ name: 'returns', status: 'running', startedAt: new Date().toISOString() })
    try {
      const returnsRes = await fetch(`${baseUrl}/api/sync/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const returnsData = await returnsRes.json()
      steps[steps.length - 1].status = returnsData.success ? 'success' : 'failed'
      steps[steps.length - 1].result = returnsData
      steps[steps.length - 1].completedAt = new Date().toISOString()
    } catch (err) {
      steps[steps.length - 1].status = 'failed'
      steps[steps.length - 1].error = String(err)
    }

    // Шаг 5: Расчёт и сохранение monthly_rankings
    steps.push({ name: 'rankings', status: 'running', startedAt: new Date().toISOString() })
    try {
      const rankingsResult = await calculateAndSaveRankings(period)
      steps[steps.length - 1].status = rankingsResult.success ? 'success' : 'failed'
      steps[steps.length - 1].result = rankingsResult
      steps[steps.length - 1].completedAt = new Date().toISOString()
    } catch (err) {
      steps[steps.length - 1].status = 'failed'
      steps[steps.length - 1].error = String(err)
    }

    // Шаг 6: Расчёт достижений
    steps.push({ name: 'achievements', status: 'running', startedAt: new Date().toISOString() })
    try {
      const achRes = await fetch(`${baseUrl}/api/achievements/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ period }),
      })
      const achData = await achRes.json()
      steps[steps.length - 1].status = achData.success ? 'success' : 'failed'
      steps[steps.length - 1].result = achData
      steps[steps.length - 1].completedAt = new Date().toISOString()
    } catch (err) {
      steps[steps.length - 1].status = 'failed'
      steps[steps.length - 1].error = String(err)
    }

    const failedSteps = steps.filter(s => s.status === 'failed')
    const successSteps = steps.filter(s => s.status === 'success')

    return NextResponse.json({
      success: failedSteps.length === 0,
      period,
      steps,
      summary: {
        total: steps.length,
        success: successSteps.length,
        failed: failedSteps.length,
      },
      duration: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Full sync error:', error)
    return NextResponse.json(
      { error: 'Ошибка полной синхронизации', details: String(error) },
      { status: 500 }
    )
  }
}

/**
 * Рассчитывает и сохраняет monthly_rankings для всех отделов
 */
async function calculateAndSaveRankings(period: string): Promise<{ success: boolean; departments: Record<string, { count: number }> }> {
  const [year, month] = period.split('-')
  const startDate = `${year}-${month}-01`
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  const departments: DepartmentType[] = ['moscow', 'online', 'tsum', 'almaty', 'astana']
  const results: Record<string, { count: number }> = {}

  for (const dept of departments) {
    const storeIds = DEPARTMENT_STORE_IDS[dept]

    // ========================================================================
    // ВАЖНО: Сначала получаем продажи по магазинам,
    // потом находим ВСЕХ сотрудников кто продавал там
    // ========================================================================

    // 1. Получаем продажи в магазинах этого отдела
    const { data: salesData } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount, sale_date')
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', storeIds)

    const sales = salesData as SaleRow[] | null

    // 2. Получаем возвраты в магазинах этого отдела
    const { data: returnsData } = await supabaseAdmin
      .from('returns')
      .select('moysklad_employee_id, amount')
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .in('retail_store_id', storeIds)

    const returns = returnsData as ReturnRow[] | null

    // 3. Собираем уникальные moysklad_id сотрудников из продаж
    const uniqueEmployeeMoyskladIds = Array.from(new Set((sales || []).map(s => s.moysklad_employee_id)))

    if (uniqueEmployeeMoyskladIds.length === 0) {
      results[dept] = { count: 0 }
      continue
    }

    // 4. Получаем данные ВСЕХ сотрудников кто продавал в этих магазинах
    const { data: employeesData } = await supabaseAdmin
      .from('employees')
      .select('id, moysklad_id')
      .in('moysklad_id', uniqueEmployeeMoyskladIds)

    const employees = employeesData as EmployeeRow[] | null

    if (!employees?.length) {
      results[dept] = { count: 0 }
      continue
    }

    // Группируем данные
    const salesByEmployee: Record<string, { total: number; count: number; byDate: Record<string, number> }> = {}
    const returnsByEmployee: Record<string, { total: number; count: number }> = {}

    for (const sale of sales || []) {
      if (!salesByEmployee[sale.moysklad_employee_id]) {
        salesByEmployee[sale.moysklad_employee_id] = { total: 0, count: 0, byDate: {} }
      }
      const amount = Number(sale.amount)
      salesByEmployee[sale.moysklad_employee_id].total += amount
      salesByEmployee[sale.moysklad_employee_id].count++
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

    // Формируем данные для рейтинга
    const rankingData: RankingData[] = employees.map(emp => {
      const empSales = salesByEmployee[emp.moysklad_id] || { total: 0, count: 0, byDate: {} }
      const empReturns = returnsByEmployee[emp.moysklad_id] || { total: 0, count: 0 }
      const netSales = empSales.total - empReturns.total
      const avgCheck = empSales.count > 0 ? empSales.total / empSales.count : 0
      const bestDaySales = calculateBestDaySales(empSales.byDate)

      return {
        employeeId: emp.id,
        moyskladId: emp.moysklad_id,
        totalSales: empSales.total,
        totalReturns: empReturns.total,
        netSales,
        salesCount: empSales.count,
        returnsCount: empReturns.count,
        avgCheck,
        bestDaySales,
      }
    })

    // Сохраняем рейтинг
    const saveResult = await saveMonthlyRankings(period, dept, rankingData)
    results[dept] = { count: saveResult.count }
  }

  return { success: true, departments: results }
}
