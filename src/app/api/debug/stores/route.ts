import { NextResponse } from 'next/server'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!MOYSKLAD_TOKEN) {
      return NextResponse.json({ error: 'No token' }, { status: 500 })
    }

    const response = await fetch(`${MOYSKLAD_API_URL}/entity/retailstore`, {
      headers: {
        'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
        'Accept-Encoding': 'gzip',
      },
    })

    if (!response.ok) {
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: 500 })
    }

    const data = await response.json()

    const stores = data.rows.map((store: { id: string; name: string; address?: string }) => ({
      id: store.id,
      name: store.name,
      address: store.address || null,
    }))

    return NextResponse.json({ stores })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}
