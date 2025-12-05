import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { DepartmentType } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

interface EmpRow {
  moysklad_id: string
  first_name: string
  last_name: string
  department: DepartmentType
  is_active: boolean
}

export async function GET() {
  const { data } = await supabaseAdmin
    .from('employees')
    .select('moysklad_id, first_name, last_name, department, is_active')
    .order('department')

  const emps = data as EmpRow[] | null

  return NextResponse.json({
    total: emps?.length,
    byDepartment: {
      moscow: emps?.filter(e => e.department === 'moscow').length,
      online: emps?.filter(e => e.department === 'online').length,
      tsum: emps?.filter(e => e.department === 'tsum').length,
    },
    employees: emps
  })
}
