import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

// Group IDs from MoySklad
const GROUPS = {
  online: '3d2ee727-b162-11ee-0a80-0d180015051c',
  tsum: '3d2e6b45-b162-11ee-0a80-0d1800150517',
  moscow: '3d2ed203-b162-11ee-0a80-0d180015051b',
  main: '22a727f0-b129-11ee-0a80-006400003b12',
}

interface MoySkladEmployee {
  id: string
  name: string
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  archived: boolean
}

interface MoySkladResponse {
  rows: MoySkladEmployee[]
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

    // Get department filter from query params
    const searchParams = request.nextUrl.searchParams
    const department = searchParams.get('department') // 'online', 'tsum', or null for all

    // Build filter
    let filter = 'archived=false'
    if (department && GROUPS[department as keyof typeof GROUPS]) {
      const groupId = GROUPS[department as keyof typeof GROUPS]
      filter += `;group=https://api.moysklad.ru/api/remap/1.2/entity/group/${groupId}`
    }

    // Fetch employees from MoySklad
    const response = await fetch(
      `${MOYSKLAD_API_URL}/entity/employee?filter=${encodeURIComponent(filter)}&limit=100`,
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

    // Transform to simplified format and filter out service accounts
    const employees = data.rows
      .filter((emp) => {
        const name = emp.name.toLowerCase()
        // Exclude service accounts
        if (name.includes('отдел') || name.includes('склад') || name.includes('смм')) {
          return false
        }
        // Check if name starts with uppercase (real person)
        if (emp.name[0] !== emp.name[0].toUpperCase()) {
          return false
        }
        return true
      })
      .map((emp) => ({
        id: emp.id,
        // Полное имя: Имя Фамилия (если есть), иначе name из МойСклад
        name: emp.firstName && emp.lastName
          ? `${emp.firstName} ${emp.lastName}`
          : emp.name,
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
