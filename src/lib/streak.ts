/**
 * Расчёт streak (серии последовательных дней с продажами)
 */

export interface StreakResult {
  currentStreak: number // Текущая серия дней
  maxStreak: number // Максимальная серия за период
  lastSaleDate: string | null // Дата последней продажи
}

/**
 * Рассчитывает streak по массиву дат продаж
 * @param saleDates - массив дат в формате 'YYYY-MM-DD'
 * @param referenceDate - дата относительно которой считать текущий streak (по умолчанию - сегодня)
 */
export function calculateStreak(
  saleDates: string[],
  referenceDate?: string
): StreakResult {
  if (saleDates.length === 0) {
    return { currentStreak: 0, maxStreak: 0, lastSaleDate: null }
  }

  // Убираем дубликаты и сортируем по убыванию (от новых к старым)
  const uniqueDates = Array.from(new Set(saleDates)).sort((a, b) => b.localeCompare(a))

  const lastSaleDate = uniqueDates[0]
  const today = referenceDate || new Date().toISOString().slice(0, 10)

  // Рассчитываем текущий streak (от сегодня или вчера назад)
  let currentStreak = 0
  const todayDate = new Date(today)

  // Проверяем есть ли продажа сегодня или вчера
  const lastSale = new Date(lastSaleDate)
  const daysDiff = Math.floor((todayDate.getTime() - lastSale.getTime()) / (1000 * 60 * 60 * 24))

  // Если последняя продажа была более 1 дня назад - streak = 0
  if (daysDiff > 1) {
    return {
      currentStreak: 0,
      maxStreak: calculateMaxStreak(uniqueDates),
      lastSaleDate,
    }
  }

  // Считаем текущий streak
  let expectedDate = lastSale
  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr)
    const expected = new Date(expectedDate)

    // Если дата совпадает с ожидаемой или это тот же день
    const diff = Math.floor((expected.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diff === 0) {
      currentStreak++
      expectedDate = new Date(date)
      expectedDate.setDate(expectedDate.getDate() - 1)
    } else if (diff === 1) {
      currentStreak++
      expectedDate = date
    } else {
      break
    }
  }

  return {
    currentStreak,
    maxStreak: calculateMaxStreak(uniqueDates),
    lastSaleDate,
  }
}

/**
 * Рассчитывает максимальную серию дней
 */
function calculateMaxStreak(sortedDates: string[]): number {
  if (sortedDates.length === 0) return 0
  if (sortedDates.length === 1) return 1

  // Сортируем по возрастанию для расчёта
  const dates = [...sortedDates].sort((a, b) => a.localeCompare(b))

  let maxStreak = 1
  let currentStreak = 1

  for (let i = 1; i < dates.length; i++) {
    const prevDate = new Date(dates[i - 1])
    const currDate = new Date(dates[i])
    const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      currentStreak++
      maxStreak = Math.max(maxStreak, currentStreak)
    } else if (diffDays > 1) {
      currentStreak = 1
    }
    // Если diffDays === 0 - это дубликат, пропускаем
  }

  return maxStreak
}

/**
 * Рассчитывает streak для нескольких сотрудников
 */
export function calculateStreaksForEmployees(
  salesByEmployee: Record<string, string[]>,
  referenceDate?: string
): Record<string, StreakResult> {
  const result: Record<string, StreakResult> = {}

  for (const [employeeId, dates] of Object.entries(salesByEmployee)) {
    result[employeeId] = calculateStreak(dates, referenceDate)
  }

  return result
}
