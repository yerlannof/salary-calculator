import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Sale, Return } from '@/lib/supabase/types'

/**
 * GET /api/employee/[moyskladId]/daily
 * Продажи по дням за период (для графика)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ moyskladId: string }> }
) {
  try {
    const { moyskladId } = await params
    const searchParams = request.nextUrl.searchParams
    const period = searchParams.get('period') // YYYY-MM

    if (!period) {
      return NextResponse.json({ error: 'Укажите period (YYYY-MM)' }, { status: 400 })
    }

    // Парсим период
    const [year, month] = period.split('-')
    const startDate = `${year}-${month}-01`
    const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
    const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`

    // Получаем продажи за период
    const { data: salesData, error: salesError } = await supabaseAdmin
      .from('sales')
      .select('amount, sale_date')
      .eq('moysklad_employee_id', moyskladId)
      .gte('sale_date', startDate)
      .lt('sale_date', endDate)
      .order('sale_date')

    const sales = salesData as Pick<Sale, 'amount' | 'sale_date'>[] | null

    if (salesError) {
      console.error('Error fetching daily sales:', salesError)
      return NextResponse.json({ error: 'Ошибка загрузки продаж' }, { status: 500 })
    }

    // Получаем возвраты за период
    const { data: returnsData } = await supabaseAdmin
      .from('returns')
      .select('amount, return_date')
      .eq('moysklad_employee_id', moyskladId)
      .gte('return_date', startDate)
      .lt('return_date', endDate)
      .order('return_date')

    const returns = returnsData as Pick<Return, 'amount' | 'return_date'>[] | null

    // Группируем по дням
    const salesByDay: Record<string, { sales: number; returns: number; salesCount: number; returnsCount: number }> = {}

    // Инициализируем все дни месяца
    const daysInMonth = new Date(parseInt(year), parseInt(month), 0).getDate()
    for (let day = 1; day <= daysInMonth; day++) {
      const date = `${year}-${month}-${String(day).padStart(2, '0')}`
      salesByDay[date] = { sales: 0, returns: 0, salesCount: 0, returnsCount: 0 }
    }

    // Заполняем продажи
    for (const sale of sales || []) {
      if (salesByDay[sale.sale_date]) {
        salesByDay[sale.sale_date].sales += Number(sale.amount)
        salesByDay[sale.sale_date].salesCount++
      }
    }

    // Заполняем возвраты
    for (const ret of returns || []) {
      if (salesByDay[ret.return_date]) {
        salesByDay[ret.return_date].returns += Number(ret.amount)
        salesByDay[ret.return_date].returnsCount++
      }
    }

    // Конвертируем в массив для графика
    const dailyData = Object.entries(salesByDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, data]) => ({
        date,
        day: parseInt(date.split('-')[2]),
        sales: data.sales,
        returns: data.returns,
        netSales: data.sales - data.returns,
        salesCount: data.salesCount,
        returnsCount: data.returnsCount,
      }))

    // Статистика
    const totalSales = dailyData.reduce((sum, d) => sum + d.sales, 0)
    const totalReturns = dailyData.reduce((sum, d) => sum + d.returns, 0)
    const daysWithSales = dailyData.filter(d => d.salesCount > 0).length
    const maxDaySales = Math.max(...dailyData.map(d => d.sales))
    const bestDay = dailyData.find(d => d.sales === maxDaySales && maxDaySales > 0)

    return NextResponse.json({
      period,
      daily: dailyData,
      stats: {
        totalSales,
        totalReturns,
        netSales: totalSales - totalReturns,
        daysWithSales,
        daysInMonth,
        maxDaySales,
        bestDay: bestDay ? {
          date: bestDay.date,
          sales: bestDay.sales,
          salesCount: bestDay.salesCount,
        } : null,
        avgDailySales: daysWithSales > 0 ? Math.round(totalSales / daysWithSales) : 0,
      },
    })

  } catch (error) {
    console.error('Daily sales API error:', error)
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    )
  }
}
