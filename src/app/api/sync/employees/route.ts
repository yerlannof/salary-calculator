import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { DepartmentType } from '@/lib/supabase/types'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

// Группы МойСклад → отделы
const GROUPS: Record<string, { groupId: string; department: DepartmentType }> = {
  online: { groupId: '3d2ee727-b162-11ee-0a80-0d180015051c', department: 'online' },
  tsum: { groupId: '3d2e6b45-b162-11ee-0a80-0d1800150517', department: 'tsum' },
  moscow: { groupId: '3d2ed203-b162-11ee-0a80-0d180015051b', department: 'moscow' },
  almaty: { groupId: '2e5e69b6-b132-11ee-0a80-1399000bb675', department: 'almaty' }, // Байтурсынова
  astana_street: { groupId: '3d2e98fc-b162-11ee-0a80-0d1800150518', department: 'astana' }, // Астана Стрит (Ауэзова)
  astana_aruzhan: { groupId: '3d2eaba1-b162-11ee-0a80-0d1800150519', department: 'astana' }, // Астана Аружан
}

interface MoySkladEmployee {
  id: string
  name: string
  firstName?: string
  lastName?: string
  archived: boolean
  image?: {
    meta?: { href?: string }
    miniature?: { downloadHref?: string; href?: string }
    tiny?: { href?: string; downloadHref?: string }
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    if (!MOYSKLAD_TOKEN) {
      return NextResponse.json({ error: 'МойСклад токен не настроен' }, { status: 500 })
    }

    const { department } = await request.json().catch(() => ({}))

    // Создаём лог синхронизации
    const syncLogInsert = {
      sync_type: 'employees',
      department: department || 'all',
      status: 'running',
      started_at: new Date().toISOString(),
    }
    const { data: syncLogData, error: logError } = await supabaseAdmin
      .from('sync_log')
      .insert(syncLogInsert as never)
      .select()
      .single()

    const syncLog = syncLogData as { id: string } | null

    if (logError) {
      console.error('Error creating sync log:', logError)
    }

    let totalSynced = 0
    const errors: string[] = []

    // Синхронизируем каждый отдел
    const departmentsToSync = department
      ? [{ key: department, ...GROUPS[department] }]
      : Object.entries(GROUPS).map(([key, value]) => ({ key, ...value }))

    for (const dept of departmentsToSync) {
      try {
        // Синхронизируем всех сотрудников группы (включая уволенных для исторических данных)
        const filter = `group=https://api.moysklad.ru/api/remap/1.2/entity/group/${dept.groupId}`

        const response = await fetch(
          `${MOYSKLAD_API_URL}/entity/employee?filter=${encodeURIComponent(filter)}&limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
              'Accept-Encoding': 'gzip',
            },
          }
        )

        if (!response.ok) {
          errors.push(`Ошибка загрузки ${dept.key}: ${response.status}`)
          continue
        }

        const data = await response.json()

        // Фильтруем служебные аккаунты
        const employees = data.rows.filter((emp: MoySkladEmployee) => {
          const name = emp.name.toLowerCase()
          if (name.includes('отдел') || name.includes('склад') || name.includes('смм')) {
            return false
          }
          return emp.name[0] === emp.name[0].toUpperCase()
        })

        // Upsert сотрудников
        for (const emp of employees) {
          const firstName = emp.firstName || emp.name.split(' ')[0] || emp.name
          const lastName = emp.lastName || emp.name.split(' ').slice(1).join(' ') || ''

          // Фото: используем tiny.href (публичная ссылка) или miniature
          const photoUrl = emp.image?.meta?.href || null
          const photoTinyUrl = emp.image?.tiny?.href || emp.image?.tiny?.downloadHref || null

          const upsertData = {
            moysklad_id: emp.id,
            first_name: firstName,
            last_name: lastName,
            department: dept.department,
            is_active: !emp.archived,
            photo_url: photoUrl,
            photo_tiny_url: photoTinyUrl,
            updated_at: new Date().toISOString(),
          }
          const { error } = await supabaseAdmin
            .from('employees')
            .upsert(upsertData as never, {
              onConflict: 'moysklad_id'
            })

          if (error) {
            errors.push(`Ошибка сохранения ${emp.name}: ${error.message}`)
          } else {
            totalSynced++
          }
        }

        // Небольшая пауза между отделами чтобы не перегружать API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (err) {
        errors.push(`Ошибка отдела ${dept.key}: ${err}`)
      }
    }

    // Обновляем лог синхронизации
    if (syncLog) {
      const updateLogData = {
        status: errors.length > 0 ? 'partial' : 'success',
        records_synced: totalSynced,
        error_message: errors.length > 0 ? errors.join('; ') : null,
        completed_at: new Date().toISOString(),
      }
      await supabaseAdmin
        .from('sync_log')
        .update(updateLogData as never)
        .eq('id', syncLog.id)
    }

    return NextResponse.json({
      success: true,
      synced: totalSynced,
      errors: errors.length > 0 ? errors : undefined,
      duration: Date.now() - startTime,
    })

  } catch (error) {
    console.error('Sync employees error:', error)
    return NextResponse.json(
      { error: 'Ошибка синхронизации сотрудников' },
      { status: 500 }
    )
  }
}
