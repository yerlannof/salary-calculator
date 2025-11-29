import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

interface MoySkladSale {
  id: string
  moment: string
  sum: number
  name: string
}

interface MoySkladResponse {
  rows: MoySkladSale[]
  meta: {
    size: number
    limit: number
    offset: number
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!MOYSKLAD_TOKEN) {
      return NextResponse.json(
        { error: 'МойСклад токен не настроен' },
        { status: 500 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employeeId')
    const period = searchParams.get('period') // format: YYYY-MM

    if (!employeeId) {
      return NextResponse.json(
        { error: 'employeeId обязателен' },
        { status: 400 }
      )
    }

    // Build filter
    let filter = `owner=https://api.moysklad.ru/api/remap/1.2/entity/employee/${employeeId}`

    // Add period filter if specified
    if (period) {
      const [year, month] = period.split('-')
      const startDate = `${year}-${month}-01`
      const nextMonth = parseInt(month) === 12 ? 1 : parseInt(month) + 1
      const nextYear = parseInt(month) === 12 ? parseInt(year) + 1 : parseInt(year)
      const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`
      filter += `;moment>=${startDate};moment<${endDate}`
    }

    // Fetch all sales (up to 1000)
    const response = await fetch(
      `${MOYSKLAD_API_URL}/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=1000&order=moment,desc`,
      {
        headers: {
          'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
          'Accept-Encoding': 'gzip',
        },
        cache: 'no-store',
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('MoySklad API error:', response.status, errorText)
      return NextResponse.json(
        { error: `Ошибка МойСклад API: ${response.status}` },
        { status: response.status }
      )
    }

    const data: MoySkladResponse = await response.json()

    // Calculate totals
    const totalSales = data.rows.reduce((sum, sale) => sum + sale.sum, 0) / 100
    const salesCount = data.rows.length

    // Group by day
    const byDay: Record<string, { count: number; sum: number }> = {}
    for (const sale of data.rows) {
      const day = sale.moment.slice(0, 10)
      if (!byDay[day]) {
        byDay[day] = { count: 0, sum: 0 }
      }
      byDay[day].count++
      byDay[day].sum += sale.sum / 100
    }

    // Convert to array and sort
    const dailySales = Object.entries(byDay)
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => b.date.localeCompare(a.date))

    return NextResponse.json({
      employeeId,
      period: period || 'all',
      totalSales,
      salesCount,
      dailySales,
    })
  } catch (error) {
    console.error('Error fetching MoySklad sales:', error)
    return NextResponse.json(
      { error: 'Не удалось получить продажи' },
      { status: 500 }
    )
  }
}
