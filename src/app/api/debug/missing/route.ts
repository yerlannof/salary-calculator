import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { DepartmentType } from '@/lib/supabase/types'

const MOSCOW_STORE_ID = 'b9585357-b51b-11ee-0a80-15c6000bc3b8'

export const dynamic = 'force-dynamic'

interface SaleRow {
  moysklad_employee_id: string
  amount: number
}

interface EmpRow {
  moysklad_id: string
  first_name: string
  last_name: string
  department: DepartmentType
}

export async function GET() {
  // Все уникальные moysklad_employee_id из продаж Москвы за сентябрь
  const { data: salesData } = await supabaseAdmin
    .from('sales')
    .select('moysklad_employee_id, amount', { count: 'exact' })
    .eq('retail_store_id', MOSCOW_STORE_ID)
    .gte('sale_date', '2025-09-01')
    .lt('sale_date', '2025-10-01')
    .limit(10000)

  const sales = salesData as SaleRow[] | null

  // Группируем по сотруднику
  const salesByEmp: Record<string, number> = {}
  for (const s of sales || []) {
    salesByEmp[s.moysklad_employee_id] = (salesByEmp[s.moysklad_employee_id] || 0) + Number(s.amount)
  }

  // Все сотрудники
  const { data: empsData } = await supabaseAdmin
    .from('employees')
    .select('moysklad_id, first_name, last_name, department', { count: 'exact' })

  const emps = empsData as EmpRow[] | null

  const empMap: Record<string, string> = {}
  for (const e of emps || []) {
    empMap[e.moysklad_id] = `${e.first_name} ${e.last_name} (${e.department})`
  }

  // Найти отсутствующих
  const missing = Object.entries(salesByEmp)
    .filter(([id]) => !empMap[id])
    .map(([id, total]) => ({ moysklad_id: id, total, formatted: `${(total/1000).toFixed(0)}K` }))
    .sort((a, b) => b.total - a.total)

  const missingTotal = missing.reduce((sum, m) => sum + m.total, 0)

  return NextResponse.json({
    totalSalesInDb: Object.values(salesByEmp).reduce((s, v) => s + v, 0),
    uniqueEmployees: Object.keys(salesByEmp).length,
    knownEmployees: Object.keys(salesByEmp).filter(id => empMap[id]).length,
    missingEmployees: missing.length,
    missingTotal,
    missing
  })
}
