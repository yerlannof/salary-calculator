import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Achievement, EmployeeAchievement } from '@/lib/supabase/types'

/**
 * GET /api/achievements
 * Получить достижения сотрудника или все достижения
 *
 * Query params:
 * - employee_id: UUID сотрудника (опционально)
 * - moysklad_id: ID сотрудника в МойСклад (опционально)
 * - period: период YYYY-MM (опционально)
 * - all: если true - вернуть все достижения (справочник)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employeeId = searchParams.get('employee_id')
    const moyskladId = searchParams.get('moysklad_id')
    const period = searchParams.get('period')
    const all = searchParams.get('all')

    // Если запрошен справочник всех достижений
    if (all === 'true') {
      const { data: achievementsData, error } = await supabaseAdmin
        .from('achievements')
        .select('*')
        .eq('is_active', true)
        .order('created_at')

      const achievements = achievementsData as Achievement[] | null

      if (error) {
        return NextResponse.json({ error: 'Ошибка загрузки достижений' }, { status: 500 })
      }

      return NextResponse.json({ achievements })
    }

    // Находим сотрудника
    let empId = employeeId
    if (!empId && moyskladId) {
      const { data: empData } = await supabaseAdmin
        .from('employees')
        .select('id')
        .eq('moysklad_id', moyskladId)
        .single()

      const emp = empData as { id: string } | null
      empId = emp?.id || null
    }

    if (!empId) {
      return NextResponse.json(
        { error: 'Укажите employee_id или moysklad_id' },
        { status: 400 }
      )
    }

    // Получаем достижения сотрудника
    let query = supabaseAdmin
      .from('employee_achievements')
      .select(`
        id,
        period,
        earned_at,
        metadata,
        achievements (
          id,
          code,
          name,
          description,
          icon,
          criteria
        )
      `)
      .eq('employee_id', empId)
      .order('earned_at', { ascending: false })

    if (period) {
      query = query.eq('period', period)
    }

    const { data: earnedData, error } = await query

    if (error) {
      console.error('Error fetching employee achievements:', error)
      return NextResponse.json({ error: 'Ошибка загрузки достижений' }, { status: 500 })
    }

    type EarnedWithAchievement = EmployeeAchievement & { achievements: Achievement | null }
    const earned = earnedData as EarnedWithAchievement[] | null

    // Форматируем ответ
    const achievements = (earned || []).map(e => ({
      id: e.id,
      period: e.period,
      earnedAt: e.earned_at,
      metadata: e.metadata,
      achievement: e.achievements,
    }))

    return NextResponse.json({
      employeeId: empId,
      achievements,
      total: achievements.length,
    })

  } catch (error) {
    console.error('Get achievements error:', error)
    return NextResponse.json(
      { error: 'Ошибка получения достижений' },
      { status: 500 }
    )
  }
}
