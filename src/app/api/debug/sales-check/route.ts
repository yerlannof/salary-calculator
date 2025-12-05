import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Store ID к названию
const STORE_NAMES: Record<string, string> = {
  'b9585357-b51b-11ee-0a80-15c6000bc3b8': 'Moscow TRC',
  'b5a56c15-b162-11ee-0a80-02a00015a9f3': 'TSUM',
  'd491733b-b6f8-11ee-0a80-033a0016fb6b': 'Online 1',
  'd1b4400d-007b-11ef-0a80-14800035ff62': 'Online 2',
  'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81': 'Online Astana',
  '68d485c9-b131-11ee-0a80-066b000af5c1': 'Baytursynova',
  'b75138dd-b6f8-11ee-0a80-09610016847f': 'Astana Aruzhan',
  'c341e43f-b6f8-11ee-0a80-103e0016edda': 'Astana Auezova',
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '2025-11'

  const [year, month] = period.split('-')
  const startDate = `${year}-${month}-01`
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  // Все известные магазины
  const allStoreIds = [
    'b9585357-b51b-11ee-0a80-15c6000bc3b8', // Moscow
    'b5a56c15-b162-11ee-0a80-02a00015a9f3', // TSUM
    'd491733b-b6f8-11ee-0a80-033a0016fb6b', // Online 1
    'd1b4400d-007b-11ef-0a80-14800035ff62', // Online 2
    'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81', // Online Astana
    '68d485c9-b131-11ee-0a80-066b000af5c1', // Baytursynova (Almaty)
    'b75138dd-b6f8-11ee-0a80-09610016847f', // Astana Aruzhan
    'c341e43f-b6f8-11ee-0a80-103e0016edda', // Astana Auezova
  ]

  // Получаем все продажи за период с группировкой по магазину и сотруднику
  // Используем count для получения общего количества, а данные загружаем пагинацией
  const { count: totalCount } = await supabaseAdmin
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sale_date', startDate)
    .lt('sale_date', endDate)
    .in('retail_store_id', allStoreIds)

  // Загружаем все записи пагинацией по 1000
  let allSales: { moysklad_employee_id: string; retail_store_id: string; amount: number }[] = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data: pageData, error: pageError } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, retail_store_id, amount, moysklad_id')
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .in('retail_store_id', allStoreIds)
      .order('moysklad_id', { ascending: true }) // Важно для консистентной пагинации!
      .range(offset, offset + pageSize - 1)

    if (pageError || !pageData || pageData.length === 0) break
    allSales = allSales.concat(pageData as typeof allSales)
    offset += pageSize
    if (pageData.length < pageSize) break
  }

  // Проверка на дубликаты
  const uniqueIds = new Set(allSales.map(s => (s as { moysklad_id?: string }).moysklad_id))
  const duplicateCount = allSales.length - uniqueIds.size

  const salesData = allSales
  const salesError = null

  if (salesError) {
    console.error('Sales query error:', salesError)
    return NextResponse.json({ error: 'Sales query failed', details: salesError })
  }

  // Получаем всех сотрудников
  const { data: empsData, error: empsError } = await supabaseAdmin
    .from('employees')
    .select('moysklad_id, first_name, last_name, department')

  if (empsError) {
    console.error('Employees query error:', empsError)
  }

  const empMap: Record<string, { name: string; department: string }> = {}
  for (const e of empsData || []) {
    empMap[e.moysklad_id] = {
      name: `${e.first_name} ${e.last_name}`,
      department: e.department
    }
  }

  // Группируем по сотруднику и магазину
  const salesByEmpStore: Record<string, Record<string, { total: number; count: number }>> = {}

  for (const sale of salesData || []) {
    const empId = sale.moysklad_employee_id
    const storeId = sale.retail_store_id

    if (!salesByEmpStore[empId]) {
      salesByEmpStore[empId] = {}
    }
    if (!salesByEmpStore[empId][storeId]) {
      salesByEmpStore[empId][storeId] = { total: 0, count: 0 }
    }
    salesByEmpStore[empId][storeId].total += Number(sale.amount)
    salesByEmpStore[empId][storeId].count++
  }

  // Форматируем результат
  const result = Object.entries(salesByEmpStore).map(([empId, stores]) => {
    const emp = empMap[empId]
    return {
      employee: emp?.name || empId,
      department: emp?.department || 'unknown',
      stores: Object.entries(stores).map(([storeId, data]) => ({
        store: STORE_NAMES[storeId] || storeId,
        storeId,
        total: data.total,
        count: data.count,
      })),
      totalSales: Object.values(stores).reduce((sum, s) => sum + s.total, 0),
    }
  }).sort((a, b) => b.totalSales - a.totalSales)

  // Итоги по магазинам
  const storeStats: Record<string, number> = {}
  for (const sale of salesData || []) {
    const storeId = sale.retail_store_id
    storeStats[storeId] = (storeStats[storeId] || 0) + Number(sale.amount)
  }

  return NextResponse.json({
    period,
    totalSales: (salesData || []).reduce((sum, s) => sum + Number(s.amount), 0),
    salesCount: salesData?.length || 0,
    totalRecordsInDB: totalCount,
    duplicateCount,
    storeStats: Object.entries(storeStats).map(([id, total]) => ({
      store: STORE_NAMES[id] || id,
      storeId: id,
      total,
    })),
    employees: result,
  })
}
