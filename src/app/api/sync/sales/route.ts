import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { DepartmentType } from '@/lib/supabase/types'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

// Точки продаж → отделы
const RETAIL_STORES: Record<string, { name: string; department: DepartmentType }> = {
  'b9585357-b51b-11ee-0a80-15c6000bc3b8': { name: 'Москва', department: 'moscow' },
  'b5a56c15-b162-11ee-0a80-02a00015a9f3': { name: 'ЦУМ', department: 'tsum' },
  'd491733b-b6f8-11ee-0a80-033a0016fb6b': { name: 'Онлайн Продажи', department: 'online' },
  'd1b4400d-007b-11ef-0a80-14800035ff62': { name: 'Online New', department: 'online' },
  'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81': { name: 'Онлайн Астана', department: 'online' },
  '68d485c9-b131-11ee-0a80-066b000af5c1': { name: 'Байтурсынова', department: 'almaty' },
  'b75138dd-b6f8-11ee-0a80-09610016847f': { name: 'Аружан', department: 'astana' },
  'c341e43f-b6f8-11ee-0a80-103e0016edda': { name: 'Ауэзова', department: 'astana' },
}

interface MoySkladSale {
  id: string
  moment: string
  sum: number
  owner?: { meta?: { href?: string } }
  retailStore?: { meta?: { href?: string } }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!MOYSKLAD_TOKEN) {
      return NextResponse.json({ error: 'МойСклад токен не настроен' }, { status: 500 })
    }

    const { period, department } = await request.json()

    if (!period) {
      return NextResponse.json({ error: 'Укажите period (YYYY-MM)' }, { status: 400 })
    }

    // Создаём лог синхронизации
    const insertLog = {
      sync_type: 'sales',
      period,
      department: department || 'all',
      status: 'running',
      started_at: new Date().toISOString(),
    }
    const { data: syncLogData } = await supabaseAdmin
      .from('sync_log')
      .insert(insertLog as never)
      .select()
      .single()
    const syncLog = syncLogData as { id: string } | null

    // Парсим период
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    let totalSynced = 0
    const errors: string[] = []
    let offset = 0
    const limit = 1000
    let hasMore = true

    // Фильтр по периоду
    let filter = `moment>=${startDate};moment<${endDate}`

    // Если указан отдел, фильтруем по точкам продаж
    if (department) {
      const storeIds = Object.entries(RETAIL_STORES)
        .filter(([_, store]) => store.department === department)
        .map(([id]) => id)

      if (storeIds.length > 0) {
        // МойСклад не поддерживает OR в фильтрах, поэтому делаем несколько запросов
        for (const storeId of storeIds) {
          const storeFilter = `${filter};retailStore=https://api.moysklad.ru/api/remap/1.2/entity/retailstore/${storeId}`
          const result = await syncSalesWithFilter(storeFilter, errors)
          totalSynced += result
          await new Promise(resolve => setTimeout(resolve, 300)) // Пауза между запросами
        }
        hasMore = false // Уже обработали все
      }
    }

    // Если отдел не указан - грузим все продажи
    if (hasMore) {
      while (hasMore) {
        try {
          const response = await fetch(
            `${MOYSKLAD_API_URL}/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=${limit}&offset=${offset}&order=moment,desc`,
            {
              headers: {
                'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
                'Accept-Encoding': 'gzip',
              },
            }
          )

          if (!response.ok) {
            if (response.status === 429) {
              // Rate limit - ждём и пробуем снова
              await new Promise(resolve => setTimeout(resolve, 2000))
              continue
            }
            errors.push(`Ошибка API: ${response.status}`)
            break
          }

          const data = await response.json()
          const sales: MoySkladSale[] = data.rows || []

          if (sales.length === 0) {
            hasMore = false
            break
          }

          // Обрабатываем продажи
          for (const sale of sales) {
            const result = await processSale(sale, errors)
            if (result) totalSynced++
          }

          offset += sales.length
          hasMore = sales.length === limit

          // Пауза между страницами
          await new Promise(resolve => setTimeout(resolve, 300))

        } catch (err) {
          errors.push(`Ошибка загрузки: ${err}`)
          break
        }
      }
    }

    // Обновляем лог синхронизации
    if (syncLog) {
      const updateLog = {
        status: errors.length > 0 ? 'partial' : 'success',
        records_synced: totalSynced,
        error_message: errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
        completed_at: new Date().toISOString(),
      }
      await supabaseAdmin
        .from('sync_log')
        .update(updateLog as never)
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      period,
      synced: totalSynced,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      duration: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Sync sales error:', error)
    return NextResponse.json(
      { error: 'Ошибка синхронизации продаж' },
      { status: 500 }
    )
  }
}

async function syncSalesWithFilter(filter: string, errors: string[]): Promise<number> {
  let synced = 0
  let offset = 0
  const limit = 1000
  let hasMore = true

  while (hasMore) {
    try {
      const response = await fetch(
        `${MOYSKLAD_API_URL}/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=${limit}&offset=${offset}`,
        {
          headers: {
            'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
            'Accept-Encoding': 'gzip',
          },
        }
      )

      if (!response.ok) {
        if (response.status === 429) {
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue
        }
        break
      }

      const data = await response.json()
      const sales: MoySkladSale[] = data.rows || []

      if (sales.length === 0) break

      for (const sale of sales) {
        const result = await processSale(sale, errors)
        if (result) synced++
      }

      offset += sales.length
      hasMore = sales.length === limit

    } catch {
      break
    }
  }

  return synced
}

async function processSale(sale: MoySkladSale, errors: string[]): Promise<boolean> {
  const ownerId = sale.owner?.meta?.href?.split('/').pop()
  const storeId = sale.retailStore?.meta?.href?.split('/').pop()
  const storeInfo = storeId ? RETAIL_STORES[storeId] : null

  // Ищем сотрудника в нашей БД
  let employeeId: string | null = null
  if (ownerId) {
    const { data: empData } = await supabaseAdmin
      .from('employees')
      .select('id')
      .eq('moysklad_id', ownerId)
      .single()

    const employee = empData as { id: string } | null
    employeeId = employee?.id || null
  }

  const upsertData = {
    moysklad_id: sale.id,
    employee_id: employeeId,
    moysklad_employee_id: ownerId || 'unknown',
    amount: sale.sum / 100,
    sale_date: sale.moment.slice(0, 10),
    retail_store_id: storeId || null,
    retail_store_name: storeInfo?.name || null,
  }
  const { error } = await supabaseAdmin
    .from('sales')
    .upsert(upsertData as never, {
      onConflict: 'moysklad_id'
    })

  if (error) {
    errors.push(`Ошибка сохранения продажи ${sale.id}: ${error.message}`)
    return false
  }

  return true
}
