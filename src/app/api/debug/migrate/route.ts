import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    // Добавляем новые значения в enum department_type
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'almaty';
        ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'astana';
      `
    })

    if (error) {
      // Если RPC не работает, попробуем через прямой SQL запрос
      console.error('RPC error:', error)

      // Альтернативный способ - через REST API Supabase
      return NextResponse.json({
        error: 'RPC exec_sql не доступен. Выполните SQL вручную в Supabase Dashboard',
        sql: `ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'almaty'; ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'astana';`
      }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: 'Enum updated' })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: String(error),
      sql: `ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'almaty'; ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'astana';`
    }, { status: 500 })
  }
}
