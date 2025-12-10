/**
 * GAMEOVER POWER SYSTEM
 * Конфигурация геймификации - Faceit-style уровни + Challenges
 */

// ============================================
// POWER LEVELS (10 уровней как в Faceit)
// ============================================

export interface PowerLevel {
  level: number
  name: string
  minPR: number
  maxPR: number
  icon: string
  color: 'gray' | 'cyan' | 'magenta' | 'gold' | 'rainbow'
}

export const POWER_LEVELS: PowerLevel[] = [
  { level: 1, name: 'ROOKIE', minPR: 0, maxPR: 100, icon: '🌱', color: 'gray' },
  { level: 2, name: 'SELLER', minPR: 101, maxPR: 200, icon: '💼', color: 'gray' },
  { level: 3, name: 'SKILLED', minPR: 201, maxPR: 350, icon: '⭐', color: 'gray' },
  { level: 4, name: 'MASTER', minPR: 351, maxPR: 500, icon: '🎯', color: 'cyan' },
  { level: 5, name: 'PRO', minPR: 501, maxPR: 700, icon: '🔥', color: 'cyan' },
  { level: 6, name: 'EXPERT', minPR: 701, maxPR: 900, icon: '💎', color: 'cyan' },
  { level: 7, name: 'ELITE', minPR: 901, maxPR: 1200, icon: '👑', color: 'magenta' },
  { level: 8, name: 'LEGEND', minPR: 1201, maxPR: 1500, icon: '🏆', color: 'magenta' },
  { level: 9, name: 'CHAMPION', minPR: 1501, maxPR: 2000, icon: '⚡', color: 'gold' },
  { level: 10, name: 'GOAT', minPR: 2001, maxPR: Infinity, icon: '💠', color: 'rainbow' },
]

// ============================================
// LEVEL COLORS (для UI)
// ============================================

export const LEVEL_COLORS: Record<PowerLevel['color'], {
  text: string
  bg: string
  border: string
  glow?: string
}> = {
  gray: {
    text: 'text-slate-400',
    bg: 'bg-slate-500/20',
    border: 'border-slate-500/50',
  },
  cyan: {
    text: 'text-neon-cyan',
    bg: 'bg-neon-cyan/20',
    border: 'border-neon-cyan/50',
    glow: 'shadow-neon-cyan/20',
  },
  magenta: {
    text: 'text-neon-magenta',
    bg: 'bg-neon-magenta/20',
    border: 'border-neon-magenta/50',
    glow: 'shadow-neon-magenta/20',
  },
  gold: {
    text: 'text-neon-yellow',
    bg: 'bg-neon-yellow/20',
    border: 'border-neon-yellow/50',
    glow: 'shadow-neon-yellow/20',
  },
  rainbow: {
    text: 'text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-neon-magenta to-neon-yellow',
    bg: 'bg-gradient-to-r from-neon-cyan/20 via-neon-magenta/20 to-neon-yellow/20',
    border: 'border-neon-cyan/50',
    glow: 'shadow-lg shadow-neon-cyan/30',
  },
}

// ============================================
// CHALLENGES (Spinify-style)
// ============================================

export type ChallengeType = 'daily' | 'weekly' | 'monthly'
export type ChallengeCriteria =
  | 'first_sale'        // Первая продажа дня
  | 'speed_demon'       // N продаж за первый час
  | 'big_fish'          // Чек > X
  | 'clean_sheet'       // День без возвратов
  | 'streak_days'       // N дней подряд с продажами
  | 'check_growth'      // Рост среднего чека на X%
  | 'zero_returns'      // Период без возвратов
  | 'position_up'       // Подняться на N позиций
  | 'level_up'          // Повысить уровень
  | 'top_position'      // Войти в топ-N
  | 'sales_count'       // N продаж за период

export interface Challenge {
  id: string
  name: string
  description: string
  icon: string
  type: ChallengeType
  criteria: ChallengeCriteria
  value: number
  prReward: number
}

export const DAILY_CHALLENGES: Challenge[] = [
  {
    id: 'first_blood',
    name: 'FIRST BLOOD',
    description: 'Первая продажа дня',
    icon: '⚔️',
    type: 'daily',
    criteria: 'first_sale',
    value: 1,
    prReward: 10,
  },
  {
    id: 'speed_demon',
    name: 'SPEED DEMON',
    description: '3 продажи за первый час смены',
    icon: '⚡',
    type: 'daily',
    criteria: 'speed_demon',
    value: 3,
    prReward: 15,
  },
  {
    id: 'big_fish',
    name: 'BIG FISH',
    description: 'Чек больше 50,000 ₸',
    icon: '🐋',
    type: 'daily',
    criteria: 'big_fish',
    value: 50000,
    prReward: 20,
  },
  {
    id: 'clean_sheet',
    name: 'CLEAN SHEET',
    description: 'День без возвратов (мин. 3 продажи)',
    icon: '🛡️',
    type: 'daily',
    criteria: 'clean_sheet',
    value: 3,
    prReward: 15,
  },
  {
    id: 'five_star',
    name: 'FIVE STAR',
    description: '5 продаж за день',
    icon: '⭐',
    type: 'daily',
    criteria: 'sales_count',
    value: 5,
    prReward: 20,
  },
]

export const WEEKLY_CHALLENGES: Challenge[] = [
  {
    id: 'streak_hunter',
    name: 'STREAK HUNTER',
    description: '5 дней подряд с продажами',
    icon: '🔥',
    type: 'weekly',
    criteria: 'streak_days',
    value: 5,
    prReward: 50,
  },
  {
    id: 'check_grower',
    name: 'CHECK GROWER',
    description: 'Средний чек +10% к прошлой неделе',
    icon: '📈',
    type: 'weekly',
    criteria: 'check_growth',
    value: 10,
    prReward: 75,
  },
  {
    id: 'zero_returns_week',
    name: 'PERFECT WEEK',
    description: 'Неделя без возвратов',
    icon: '🛡️',
    type: 'weekly',
    criteria: 'zero_returns',
    value: 0,
    prReward: 100,
  },
  {
    id: 'comeback_kid',
    name: 'COMEBACK KID',
    description: 'Подняться на 3+ позиции в рейтинге',
    icon: '🚀',
    type: 'weekly',
    criteria: 'position_up',
    value: 3,
    prReward: 75,
  },
]

export const MONTHLY_CHALLENGES: Challenge[] = [
  {
    id: 'level_up',
    name: 'LEVEL UP',
    description: 'Повысить уровень',
    icon: '⬆️',
    type: 'monthly',
    criteria: 'level_up',
    value: 1,
    prReward: 200,
  },
  {
    id: 'top_performer',
    name: 'TOP PERFORMER',
    description: 'Войти в топ-3',
    icon: '🏆',
    type: 'monthly',
    criteria: 'top_position',
    value: 3,
    prReward: 250,
  },
  {
    id: 'perfect_month',
    name: 'PERFECT MONTH',
    description: '0 возвратов за месяц (мин. 20 продаж)',
    icon: '💎',
    type: 'monthly',
    criteria: 'zero_returns',
    value: 20,
    prReward: 300,
  },
]

export const ALL_CHALLENGES = [
  ...DAILY_CHALLENGES,
  ...WEEKLY_CHALLENGES,
  ...MONTHLY_CHALLENGES,
]

// ============================================
// POWER RATING CONFIGURATION
// ============================================

export const POWER_CONFIG = {
  // === АКТИВНЫЕ ПАРАМЕТРЫ ===

  // Базовый множитель: netSales / divisor = basePower
  baseDivisor: 10000,

  // Бонус за 0 возвратов при минимуме продаж
  noReturnsBonus: 10,
  noReturnMinSales: 10,

  // Бонус за превышение среднего чека отдела
  avgCheckBonusPerTenPercent: 5,

  // === ОТКЛЮЧЕНО (для будущего использования) ===

  // Бонус за streak (дни подряд) - не подходит для графика 2/2
  streakMultiplier: 0, // было: 5

  // Challenge rewards - будет реализовано в будущем с правильным балансом
  dailyChallengeReward: 0,    // TODO: было 10, нужно перебалансировать
  weeklyChallengeReward: 0,   // TODO: было 50, нужно перебалансировать
  monthlyChallengeReward: 0,  // TODO: было 200, нужно перебалансировать
}

// ============================================
// CHALLENGER STATUS (Top-3)
// ============================================

export const CHALLENGER_RANKS = {
  1: { title: 'CHALLENGER #1', color: 'gold', icon: '👑' },
  2: { title: 'CHALLENGER #2', color: 'silver', icon: '🥈' },
  3: { title: 'CHALLENGER #3', color: 'bronze', icon: '🥉' },
} as const
