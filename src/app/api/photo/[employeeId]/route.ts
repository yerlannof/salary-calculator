import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'
import type { Employee } from '@/lib/supabase/types'

const MOYSKLAD_API_URL = 'https://api.moysklad.ru/api/remap/1.2'
const MOYSKLAD_TOKEN = process.env.MOYSKLAD_TOKEN

// Cache фото на 1 час
const CACHE_MAX_AGE = 3600

type EmployeePhoto = Pick<Employee, 'moysklad_id' | 'photo_url' | 'photo_tiny_url'>

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const { employeeId } = await params

    // Ищем сотрудника в БД
    const { data: employeeData, error } = await supabaseAdmin
      .from('employees')
      .select('moysklad_id, photo_url, photo_tiny_url')
      .or(`id.eq.${employeeId},moysklad_id.eq.${employeeId}`)
      .single()

    const employee = employeeData as EmployeePhoto | null

    if (error || !employee) {
      return new NextResponse(null, { status: 404 })
    }

    // Если есть сохранённый URL фото - пробуем загрузить (приоритет полноразмерному)
    const photoUrl = employee.photo_url || employee.photo_tiny_url

    if (photoUrl && MOYSKLAD_TOKEN) {
      try {
        const response = await fetch(photoUrl, {
          headers: {
            'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
          },
        })

        if (response.ok) {
          const imageBuffer = await response.arrayBuffer()
          const contentType = response.headers.get('content-type') || 'image/jpeg'

          return new NextResponse(imageBuffer, {
            headers: {
              'Content-Type': contentType,
              'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
            },
          })
        }
      } catch (e) {
        console.error('Error fetching photo from MoySklad:', e)
      }
    }

    // Если в БД нет URL - пробуем получить напрямую из МойСклад API
    if (MOYSKLAD_TOKEN && employee.moysklad_id) {
      try {
        // Получаем данные сотрудника с фото
        const empResponse = await fetch(
          `${MOYSKLAD_API_URL}/entity/employee/${employee.moysklad_id}`,
          {
            headers: {
              'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
              'Accept-Encoding': 'gzip',
            },
          }
        )

        if (empResponse.ok) {
          const empData = await empResponse.json()

          // Пробуем разные варианты URL фото (приоритет качественному)
          const imageUrl = empData.image?.miniature?.href
            || empData.image?.meta?.href
            || empData.image?.tiny?.href

          if (imageUrl) {
            // Сохраняем URL в БД для будущего использования (miniature - оптимальное качество)
            const updateData = {
              photo_tiny_url: empData.image?.tiny?.href || null,
              photo_url: empData.image?.miniature?.href || empData.image?.meta?.href || null,
            }
            await supabaseAdmin
              .from('employees')
              .update(updateData as never)
              .eq('moysklad_id', employee.moysklad_id)

            // Загружаем фото
            const photoResponse = await fetch(imageUrl, {
              headers: {
                'Authorization': `Bearer ${MOYSKLAD_TOKEN}`,
              },
            })

            if (photoResponse.ok) {
              const imageBuffer = await photoResponse.arrayBuffer()
              const contentType = photoResponse.headers.get('content-type') || 'image/jpeg'

              return new NextResponse(imageBuffer, {
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`,
                },
              })
            }
          }
        }
      } catch (e) {
        console.error('Error fetching employee from MoySklad:', e)
      }
    }

    // Возвращаем 404 если фото не найдено
    // Фронтенд покажет инициалы вместо фото
    return new NextResponse(null, { status: 404 })

  } catch (error) {
    console.error('Photo proxy error:', error)
    return new NextResponse(null, { status: 500 })
  }
}
