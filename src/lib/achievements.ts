/**
 * Система достижений (бейджей) для сотрудников
 */

import { StreakResult } from './streak'

export interface EmployeeStats {
  employeeId: string
  moyskladId: string
  totalSales: number
  salesCount: number
  totalReturns: number
  returnsCount: number
  netSales: number
  rank: number // позиция в рейтинге
  streak: StreakResult

  // Для avg_check_growth
  avgCheck: number
  prevAvgCheck: number | null

  // Для personal_best_day
  bestDaySales: number
  personalBestDay: number | null

  // Для comeback
  prevRank: number | null
  wasOutOfTop5: boolean
}

export interface Achievement {
  id: string
  code: string
  name: string
  description: string | null
  icon: string | null
  criteria: AchievementCriteria
  isActive: boolean
}

export interface AchievementCriteria {
  type: string
  value: number
}

export interface EarnedAchievement {
  achievementId: string
  achievementCode: string
  earnedAt: string
  metadata?: Record<string, unknown>
}

/**
 * Проверяет достижения для одного сотрудника
 */
export function checkAchievements(
  stats: EmployeeStats,
  achievements: Achievement[],
  existingAchievements: string[] // коды уже полученных достижений
): EarnedAchievement[] {
  const earned: EarnedAchievement[] = []

  for (const achievement of achievements) {
    if (!achievement.isActive) continue
    if (existingAchievements.includes(achievement.code)) continue

    const isEarned = checkCriteria(stats, achievement.criteria)

    if (isEarned) {
      earned.push({
        achievementId: achievement.id,
        achievementCode: achievement.code,
        earnedAt: new Date().toISOString(),
        metadata: getAchievementMetadata(stats, achievement.criteria),
      })
    }
  }

  return earned
}

/**
 * Проверяет выполнение критерия
 */
function checkCriteria(stats: EmployeeStats, criteria: AchievementCriteria): boolean {
  switch (criteria.type) {
    case 'sales_count':
      return stats.salesCount >= criteria.value

    case 'sales_total':
      return stats.totalSales >= criteria.value

    case 'streak_days':
      return stats.streak.currentStreak >= criteria.value || stats.streak.maxStreak >= criteria.value

    case 'rank':
      return stats.rank > 0 && stats.rank <= criteria.value

    case 'no_returns':
      // Без возвратов при минимальном количестве продаж
      return stats.returnsCount === 0 && stats.salesCount >= criteria.value

    case 'avg_check_growth':
      // Рост среднего чека на X% к прошлому месяцу
      if (!stats.prevAvgCheck || stats.prevAvgCheck === 0) return false
      const growth = ((stats.avgCheck - stats.prevAvgCheck) / stats.prevAvgCheck) * 100
      return growth >= criteria.value

    case 'personal_best_day':
      // Побит личный рекорд продаж за день
      if (stats.bestDaySales === 0) return false
      if (stats.personalBestDay === null || stats.personalBestDay === 0) return true // Первый рекорд
      return stats.bestDaySales > stats.personalBestDay

    case 'comeback':
      // Вернуться в топ-N после выпадения
      const inTopNow = stats.rank > 0 && stats.rank <= criteria.value
      return stats.wasOutOfTop5 && inTopNow

    default:
      return false
  }
}

/**
 * Генерирует метаданные для достижения
 */
function getAchievementMetadata(
  stats: EmployeeStats,
  criteria: AchievementCriteria
): Record<string, unknown> | undefined {
  switch (criteria.type) {
    case 'sales_total':
      return { actualSales: stats.totalSales }

    case 'streak_days':
      return {
        currentStreak: stats.streak.currentStreak,
        maxStreak: stats.streak.maxStreak,
      }

    case 'rank':
      return { rank: stats.rank }

    case 'avg_check_growth':
      const checkGrowth = stats.prevAvgCheck
        ? ((stats.avgCheck - stats.prevAvgCheck) / stats.prevAvgCheck) * 100
        : 0
      return {
        currentAvgCheck: Math.round(stats.avgCheck),
        prevAvgCheck: stats.prevAvgCheck ? Math.round(stats.prevAvgCheck) : null,
        growthPercent: Math.round(checkGrowth * 10) / 10,
      }

    case 'personal_best_day':
      return {
        newRecord: stats.bestDaySales,
        previousRecord: stats.personalBestDay,
      }

    case 'comeback':
      return {
        prevRank: stats.prevRank,
        currentRank: stats.rank,
      }

    default:
      return undefined
  }
}

/**
 * Типы достижений для отображения в UI
 */
export const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_sale: '🎯',
  sales_100k: '💵',
  sales_500k: '💰',
  first_million: '💎',
  streak_7: '🔥',
  streak_14: '⚡',
  top_1: '👑',
  top_3: '🏆',
  no_returns: '✨',
  avg_check_up: '📈',
  best_day: '🌟',
  comeback: '🚀',
}

/**
 * Цвета для разных типов достижений
 */
export const ACHIEVEMENT_COLORS: Record<string, { bg: string; border: string }> = {
  first_sale: { bg: 'from-blue-500/20', border: 'border-blue-500/50' },
  sales_100k: { bg: 'from-green-500/20', border: 'border-green-500/50' },
  sales_500k: { bg: 'from-emerald-500/20', border: 'border-emerald-500/50' },
  first_million: { bg: 'from-violet-500/20', border: 'border-violet-500/50' },
  streak_7: { bg: 'from-orange-500/20', border: 'border-orange-500/50' },
  streak_14: { bg: 'from-yellow-500/20', border: 'border-yellow-500/50' },
  top_1: { bg: 'from-amber-500/20', border: 'border-amber-500/50' },
  top_3: { bg: 'from-slate-400/20', border: 'border-slate-400/50' },
  no_returns: { bg: 'from-cyan-500/20', border: 'border-cyan-500/50' },
  avg_check_up: { bg: 'from-pink-500/20', border: 'border-pink-500/50' },
  best_day: { bg: 'from-indigo-500/20', border: 'border-indigo-500/50' },
  comeback: { bg: 'from-red-500/20', border: 'border-red-500/50' },
}
