/**
 * TypeScript types для GAMEOVER POWER SYSTEM
 */

import type { PowerLevel, Challenge } from '@/config/gamification'

/**
 * Детализация Power Rating
 */
export interface PowerRating {
  // Компоненты рейтинга
  basePower: number        // netSales / 10000
  qualityBonus: number     // бонусы за качество (avg check, no returns)
  streakBonus: number      // streak * 5
  challengeBonus: number   // выполненные челленджи

  // Итоговый PR
  totalPower: number

  // Информация об уровне
  level: number            // 1-10
  levelName: string        // ELITE, LEGEND, GOAT и т.д.
  levelIcon: string        // emoji иконка
  levelColor: 'gray' | 'cyan' | 'magenta' | 'gold' | 'rainbow'

  // Прогресс до следующего уровня
  progressPercent: number  // 0-100%
  nextLevelPR: number | null    // минимальный PR для след. уровня (null если GOAT)
  prToNextLevel: number    // сколько PR осталось до след. уровня
}

/**
 * Входные данные для расчёта Power Rating
 */
export interface PowerInput {
  // Продажи
  netSales: number
  salesCount: number

  // Возвраты
  returnsCount: number

  // Средний чек
  avgCheck: number
  departmentAvgCheck?: number  // для бонуса за превышение среднего

  // Streak
  streak: number

  // Челленджи (опционально)
  completedChallenges?: {
    daily: number
    weekly: number
    monthly: number
  }
}

/**
 * Badge (достижение)
 */
export interface Badge {
  id: string
  code: string
  name: string
  icon: string | null
}

/**
 * Магазин где продавал
 */
export interface StoreInfo {
  id: string
  name: string
}

/**
 * Публичный профиль игрока (для лидерборда)
 * БЕЗ зарплаты и точных сумм продаж
 */
export interface PlayerProfile {
  // Базовая инфо
  id: string
  moyskladId: string
  name: string
  firstName: string
  lastName: string
  photoUrl: string | null
  isActive: boolean

  // Power Rating (публично)
  power: PowerRating

  // Позиция в рейтинге
  position: number
  prevPosition: number | null
  positionChange: number     // + поднялся, - упал

  // Streak и badges
  streak: number
  maxStreak?: number
  badges: Badge[]

  // Challenger статус (топ-3)
  isChallenger: boolean
  challengerRank?: 1 | 2 | 3

  // Количественные показатели (БЕЗ денег)
  salesCount: number
  shiftCount?: number
  returnsCount?: number

  // Магазины (для режима "Все магазины")
  stores?: StoreInfo[]

  // Активные челленджи (опционально)
  activeChallenges?: Challenge[]
}

/**
 * Приватная статистика игрока (для личного профиля)
 * С ПОЛНОЙ информацией включая ЗП
 */
export interface PlayerStats extends PlayerProfile {
  // Приватные финансовые данные
  salary: {
    base: number
    bonus: number
    total: number
  }

  // Приватные данные о продажах
  sales: {
    gross: number      // валовые продажи
    returns: number    // возвраты
    net: number        // чистые продажи
  }

  // Детальная статистика по чекам
  checks: {
    count: number
    avgCheck: number
    maxCheck?: number
    minCheck?: number
  }

  // Return rate
  returnRate: number  // % возвратов

  // Breakdown Power Rating (опционально для детализации)
  powerBreakdown?: {
    base: { value: number, description: string }
    quality: { value: number, description: string }
    streak: { value: number, description: string }
    challenges: { value: number, description: string }
  }
}

/**
 * Ответ API лидерборда
 */
export interface LeaderboardResponse {
  players: PlayerProfile[]
  period: string
  department: string
  lastSync?: {
    at: string
    status: string
    recordsSynced: number
  } | null
  totals?: {
    players: number
    totalPower: number
  }
}

/**
 * Ответ API профиля игрока
 */
export interface PlayerProfileResponse {
  player: PlayerStats
  period: string
  department?: string
}

/**
 * Challenge Progress (для будущего)
 */
export interface ChallengeProgress {
  challenge: Challenge
  currentValue: number
  targetValue: number
  progress: number      // 0-100%
  isCompleted: boolean
  completedAt?: string
}
