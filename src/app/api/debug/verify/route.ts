import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const period = searchParams.get('period') || '2025-11'
  const storeId = searchParams.get('store') || 'b9585357-b51b-11ee-0a80-15c6000bc3b8' // Moscow TRC

  const [year, month] = period.split('-')
  const startDate = `${year}-${month}-01`
  const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
  const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

  // Считаем точное количество и сумму напрямую из базы
  const { count, error: countError } = await supabaseAdmin
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('retail_store_id', storeId)
    .gte('sale_date', startDate)
    .lt('sale_date', endDate)

  // Получаем все записи с пагинацией для подсчета суммы
  let allRecords: { moysklad_employee_id: string; amount: number; moysklad_id: string }[] = []
  let offset = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('sales')
      .select('moysklad_employee_id, amount, moysklad_id')
      .eq('retail_store_id', storeId)
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .range(offset, offset + pageSize - 1)

    if (error || !data || data.length === 0) break
    allRecords = allRecords.concat(data as typeof allRecords)
    offset += pageSize
    if (data.length < pageSize) break
  }

  // Проверка на дубликаты по moysklad_id (sale ID)
  const saleIds = allRecords.map(r => r.moysklad_id)
  const uniqueSaleIds = new Set(saleIds)
  const duplicates = saleIds.length - uniqueSaleIds.size

  // Группировка по сотруднику
  const byEmployee: Record<string, { count: number; total: number }> = {}
  for (const rec of allRecords) {
    if (!byEmployee[rec.moysklad_employee_id]) {
      byEmployee[rec.moysklad_employee_id] = { count: 0, total: 0 }
    }
    byEmployee[rec.moysklad_employee_id].count++
    byEmployee[rec.moysklad_employee_id].total += Number(rec.amount)
  }

  // Получаем имена сотрудников
  const empIds = Object.keys(byEmployee)
  const { data: empsData } = await supabaseAdmin
    .from('employees')
    .select('moysklad_id, first_name, last_name')
    .in('moysklad_id', empIds)

  const empMap: Record<string, string> = {}
  for (const e of empsData || []) {
    empMap[e.moysklad_id] = `${e.first_name} ${e.last_name}`
  }

  return NextResponse.json({
    period,
    storeId,
    dbCount: count,
    loadedCount: allRecords.length,
    duplicateSaleIds: duplicates,
    totalAmount: allRecords.reduce((sum, r) => sum + Number(r.amount), 0),
    byEmployee: Object.entries(byEmployee)
      .map(([id, data]) => ({
        name: empMap[id] || id,
        moyskladId: id,
        count: data.count,
        total: data.total,
      }))
      .sort((a, b) => b.total - a.total),
  })
}
