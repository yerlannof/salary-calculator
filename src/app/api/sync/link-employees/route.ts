import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * POST /api/sync/link-employees
 * Связывает sales и returns с employees через SQL функции
 * Вызывать ПОСЛЕ синхронизации employees и sales
 */
export async function POST() {
  const startTime = Date.now()

  try {
    // Создаём лог
    const { data: syncLog } = await supabaseAdmin
      .from('sync_log')
      .insert({
        sync_type: 'link-employees',
        status: 'running',
        started_at: new Date().toISOString(),
      } as never)
      .select()
      .single()

    let salesLinked = 0
    let returnsLinked = 0
    const errors: string[] = []

    // Связываем sales с employees
    try {
      const { data: salesResult, error: salesError } = await supabaseAdmin
        .rpc('link_sales_to_employees')

      if (salesError) {
        errors.push(`Sales linking error: ${salesError.message}`)
      } else {
        salesLinked = salesResult || 0
      }
    } catch (err) {
      errors.push(`Sales linking exception: ${err}`)
    }

    // Связываем returns с employees
    try {
      const { data: returnsResult, error: returnsError } = await supabaseAdmin
        .rpc('link_returns_to_employees')

      if (returnsError) {
        errors.push(`Returns linking error: ${returnsError.message}`)
      } else {
        returnsLinked = returnsResult || 0
      }
    } catch (err) {
      errors.push(`Returns linking exception: ${err}`)
    }

    // Обновляем лог
    if (syncLog) {
      await supabaseAdmin
        .from('sync_log')
        .update({
          status: errors.length > 0 ? 'partial' : 'success',
          records_synced: salesLinked + returnsLinked,
          error_message: errors.length > 0 ? errors.join('; ') : null,
          completed_at: new Date().toISOString(),
        } as never)
        .eq('id', (syncLog as { id: string }).id)
    }

    return NextResponse.json({
      success: true,
      salesLinked,
      returnsLinked,
      total: salesLinked + returnsLinked,
      errors: errors.length > 0 ? errors : undefined,
      duration: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Link employees error:', error)
    return NextResponse.json(
      { error: 'Ошибка связывания данных' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync/link-employees
 * Показывает статистику несвязанных записей
 */
export async function GET() {
  try {
    // Считаем несвязанные sales
    const { count: unlinkedSalesCount } = await supabaseAdmin
      .from('sales')
      .select('id', { count: 'exact', head: true })
      .is('employee_id', null)

    // Считаем несвязанные returns
    const { count: unlinkedReturnsCount } = await supabaseAdmin
      .from('returns')
      .select('id', { count: 'exact', head: true })
      .is('employee_id', null)

    // Находим orphaned moysklad_employee_id (есть в sales, но нет в employees)
    const { data: orphanedData } = await supabaseAdmin
      .rpc('find_orphaned_sales_employees')

    return NextResponse.json({
      unlinkedSales: unlinkedSalesCount || 0,
      unlinkedReturns: unlinkedReturnsCount || 0,
      orphanedEmployeeIds: orphanedData || [],
    })

  } catch (error) {
    console.error('Check unlinked error:', error)
    return NextResponse.json(
      { error: 'Ошибка проверки' },
      { status: 500 }
    )
  }
}
