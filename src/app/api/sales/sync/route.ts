import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'

interface MoySkladDemand {
  id: string
  name: string
  moment: string
  sum: number
  agent?: {
    name: string
  }
  description?: string
}

interface MoySkladResponse {
  rows: MoySkladDemand[]
  meta: {
    size: number
    limit: number
    offset: number
  }
}

async function createSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignored
          }
        },
      },
    }
  )
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const supabase = await createSupabaseClient()

    // Get user's MoySklad employee ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('moysklad_employee_id')
      .eq('id', userId)
      .single()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const moyskladEmployeeId = (user as { moysklad_employee_id: string | null }).moysklad_employee_id
    if (!moyskladEmployeeId) {
      return NextResponse.json(
        { error: 'MoySklad integration not configured' },
        { status: 400 }
      )
    }

    const moyskladToken = process.env.MOYSKLAD_TOKEN
    if (!moyskladToken) {
      return NextResponse.json(
        { error: 'MoySklad token not configured' },
        { status: 500 }
      )
    }

    // Calculate current month date range
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const startDate = startOfMonth.toISOString().split('T')[0]
    const endDate = endOfMonth.toISOString().split('T')[0]
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

    // Fetch retail demands from MoySklad
    const filter = [
      `moment>=${startDate} 00:00:00`,
      `moment<=${endDate} 23:59:59`,
      `owner=https://api.moysklad.ru/api/remap/1.2/entity/employee/${moyskladEmployeeId}`,
    ].join(';')

    const response = await fetch(
      `${MOYSKLAD_API_URL}/entity/retaildemand?filter=${encodeURIComponent(filter)}&limit=1000`,
      {
        headers: {
          'Authorization': `Bearer ${moyskladToken}`,
          'Accept-Encoding': 'gzip',
        },
      }
    )

    if (!response.ok) {
      console.error('MoySklad API error:', await response.text())
      return NextResponse.json(
        { error: 'MoySklad API error' },
        { status: 500 }
      )
    }

    const data: MoySkladResponse = await response.json()

    // Calculate totals
    const totalSales = data.rows.reduce((sum, row) => sum + (row.sum / 100), 0)
    const salesCount = data.rows.length

    // Update sales cache using raw SQL-like upsert
    const { error: upsertError } = await supabase
      .from('sales_cache')
      .upsert(
        {
          user_id: userId,
          period,
          total_sales: Math.round(totalSales),
          sales_count: salesCount,
          updated_at: new Date().toISOString(),
        } as Record<string, unknown>,
        { onConflict: 'user_id,period' }
      )

    if (upsertError) {
      console.error('Error upserting sales cache:', upsertError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    // Upsert individual sales details
    for (const row of data.rows) {
      await supabase
        .from('sales_details')
        .upsert(
          {
            user_id: userId,
            moysklad_id: row.id,
            date: row.moment,
            amount: Math.round(row.sum / 100),
            customer_name: row.agent?.name || null,
            description: row.description || null,
          } as Record<string, unknown>,
          { onConflict: 'moysklad_id' }
        )
    }

    return NextResponse.json({
      success: true,
      totalSales,
      salesCount,
      period,
    })
  } catch (error) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
