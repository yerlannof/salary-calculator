import { NextResponse } from 'next/server'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

interface MoySkladEmployee {
  id: string
  name: string
  email?: string
  phone?: string
  archived: boolean
  group?: {
    meta: {
      href: string
    }
    name?: string
  }
}

interface MoySkladResponse {
  rows: MoySkladEmployee[]
  meta: {
    size: number
    limit: number
    offset: number
  }
}

export async function GET() {
  try {
    if (!MOYSKLAD_TOKEN) {
      return NextResponse.json(
        { error: 'МойСклад токен не настроен' },
        { status: 500 }
      )
    }

    // Fetch employees from MoySklad
    // Filter: only active (not archived) employees
    const response = await fetch(
      `${MOYSKLAD_API_URL}/entity/employee?filter=archived=false&limit=100`,
      {
        headers: {
          'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
          'Accept-Encoding': 'gzip',
          'Content-Type': 'application/json',
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

    // Transform to simplified format
    const employees = data.rows.map((emp) => ({
      id: emp.id,
      name: emp.name,
      email: emp.email || null,
      phone: emp.phone || null,
    }))

    // Sort by name
    employees.sort((a, b) => a.name.localeCompare(b.name, 'ru'))

    return NextResponse.json({
      employees,
      total: data.meta.size,
    })
  } catch (error) {
    console.error('Error fetching MoySklad employees:', error)
    return NextResponse.json(
      { error: 'Не удалось получить список сотрудников' },
      { status: 500 }
    )
  }
}
