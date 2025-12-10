/**
 * Функция расчёта Power Rating
 * Конвертирует продажи в тенге в геймифицированный рейтинг
 */

import { POWER_LEVELS, POWER_CONFIG } from '@/config/gamification'
import type { PowerRating, PowerInput } from './types'

/**
 * Получить данные уровня по Power Rating
 */
export function getLevelFromPower(power: number) {
  // Ищем уровень начиная с самого высокого
  for (let i = POWER_LEVELS.length - 1; i >= 0; i--) {
    const level = POWER_LEVELS[i]

    if (power >= level.minPR) {
      const nextLevel = POWER_LEVELS[i + 1] || null

      // Прогресс до следующего уровня
      let progressPercent = 100
      let prToNextLevel = 0

      if (nextLevel) {
        const currentRange = nextLevel.minPR - level.minPR
        const currentProgress = power - level.minPR
        progressPercent = Math.min(100, Math.max(0, (currentProgress / currentRange) * 100))
        prToNextLevel = nextLevel.minPR - power
      }

      return {
        level: level.level,
        levelName: level.name,
        levelIcon: level.icon,
        levelColor: level.color,
        progressPercent: Math.round(progressPercent),
        nextLevelPR: nextLevel ? nextLevel.minPR : null,
        prToNextLevel: Math.max(0, prToNextLevel),
      }
    }
  }

  // Если ничего не нашли - возвращаем ROOKIE
  const rookie = POWER_LEVELS[0]
  return {
    level: rookie.level,
    levelName: rookie.name,
    levelIcon: rookie.icon,
    levelColor: rookie.color,
    progressPercent: 0,
    nextLevelPR: POWER_LEVELS[1]?.minPR || null,
    prToNextLevel: POWER_LEVELS[1]?.minPR || 0,
  }
}

/**
 * Рассчитать Power Rating из продаж и статистики
 *
 * Формула v3.1 (УПРОЩЁННАЯ):
 * POWER = БАЗА + КАЧЕСТВО
 *
 * БАЗА = netSales / 10000
 * КАЧЕСТВО = noReturnsBonus + avgCheckBonus
 *
 * NOTE: Streak и Challenges отключены (для графика 2/2 не подходит серия дней)
 * TODO: В будущем добавить челленджи с правильным балансом
 */
export function calculatePowerRating(input: PowerInput): PowerRating {
  // 1. Base Power - конвертация денег в PR (скрыто от пользователя)
  const basePower = Math.floor(input.netSales / POWER_CONFIG.baseDivisor)

  // 2. Quality Bonus
  let qualityBonus = 0

  // Бонус за 0 возвратов при минимуме продаж
  if (input.returnsCount === 0 && input.salesCount >= POWER_CONFIG.noReturnMinSales) {
    qualityBonus += POWER_CONFIG.noReturnsBonus
  }

  // Бонус за превышение среднего чека отдела
  if (input.departmentAvgCheck && input.avgCheck > input.departmentAvgCheck) {
    const percentAboveAvg = ((input.avgCheck - input.departmentAvgCheck) / input.departmentAvgCheck) * 100
    const bonusSteps = Math.floor(percentAboveAvg / 10) // каждые 10% дают бонус
    qualityBonus += bonusSteps * POWER_CONFIG.avgCheckBonusPerTenPercent
  }

  // 3. Streak Bonus - ОТКЛЮЧЕНО (не подходит для графика 2/2)
  const streakBonus = 0

  // 4. Challenge Bonus - ОТКЛЮЧЕНО (будет реализовано в будущем с правильным балансом)
  const challengeBonus = 0

  // 5. Total Power
  const totalPower = basePower + qualityBonus + streakBonus + challengeBonus

  // 6. Определяем уровень
  const levelData = getLevelFromPower(totalPower)

  return {
    basePower,
    qualityBonus,
    streakBonus,
    challengeBonus,
    totalPower,
    ...levelData,
  }
}

/**
 * Форматирование Power Rating для отображения
 */
export function formatPowerRating(pr: number): string {
  if (pr >= 1000) {
    return `${(pr / 1000).toFixed(1)}K`
  }
  return pr.toString()
}

/**
 * Получить цвет для прогресс-бара в зависимости от уровня
 */
export function getLevelProgressColor(level: number): string {
  if (level <= 3) return 'bg-gray-400'
  if (level <= 6) return 'bg-neon-cyan'
  if (level <= 8) return 'bg-neon-magenta'
  if (level === 9) return 'bg-neon-yellow'
  return 'bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-yellow'
}

/**
 * Получить описание компонента Power Rating для tooltip
 */
export function getPowerBreakdown(rating: PowerRating) {
  return {
    base: {
      value: rating.basePower,
      description: 'Базовый рейтинг от продаж',
      icon: '💰',
    },
    quality: {
      value: rating.qualityBonus,
      description: 'Бонус за качество работы',
      icon: '⭐',
    },
    streak: {
      value: rating.streakBonus,
      description: 'Бонус за серию',
      icon: '🔥',
    },
    challenges: {
      value: rating.challengeBonus,
      description: 'Бонус за челленджи',
      icon: '🎯',
    },
  }
}
