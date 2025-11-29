/**
 * Конфигурация прогрессивных шкал заработной платы
 * GameOver Shop
 */

export interface SalaryTier {
  minSales: number;      // Минимальные продажи для этого уровня
  maxSales: number;      // Максимальные продажи для этого уровня
  percentage: number;    // Процент бонуса
  levelName: string;     // Название уровня
  levelEmoji: string;    // Эмодзи уровня
}

export interface RoleConfig {
  id: string;
  name: string;
  description: string;
  baseSalary: number;           // Базовый оклад
  tiers: SalaryTier[];          // Уровни прогрессивной шкалы
  teamBonusAmount?: number;     // Командный бонус (опционально)
  maxMonthlySales?: number;     // Потолок продаж (опционально)
}

/**
 * Онлайн-менеджер
 * Прогрессивная шкала с шагом 500к после 2 млн
 */
export const ONLINE_MANAGER_CONFIG: RoleConfig = {
  id: 'online-manager',
  name: 'Онлайн-менеджер',
  description: 'Обработка онлайн-заказов, консультирование клиентов в мессенджерах',
  baseSalary: 50000,
  maxMonthlySales: 5500000,
  teamBonusAmount: 15000,
  tiers: [
    {
      minSales: 0,
      maxSales: 1000000,
      percentage: 5,
      levelName: 'Новичок',
      levelEmoji: '🌱',
    },
    {
      minSales: 1000000,
      maxSales: 2000000,
      percentage: 6,
      levelName: 'Продавец',
      levelEmoji: '⭐',
    },
    {
      minSales: 2000000,
      maxSales: 2500000,
      percentage: 7,
      levelName: 'Опытный',
      levelEmoji: '🔥',
    },
    {
      minSales: 2500000,
      maxSales: 3000000,
      percentage: 8,
      levelName: 'Мастер',
      levelEmoji: '💪',
    },
    {
      minSales: 3000000,
      maxSales: 3500000,
      percentage: 9,
      levelName: 'Профи',
      levelEmoji: '🎯',
    },
    {
      minSales: 3500000,
      maxSales: 4000000,
      percentage: 10,
      levelName: 'Эксперт',
      levelEmoji: '💎',
    },
    {
      minSales: 4000000,
      maxSales: 4500000,
      percentage: 11,
      levelName: 'Легенда',
      levelEmoji: '👑',
    },
    {
      minSales: 4500000,
      maxSales: 5000000,
      percentage: 12,
      levelName: 'Бог продаж',
      levelEmoji: '🚀',
    },
  ],
};

/**
 * Все роли (для будущего расширения)
 */
export const ALL_ROLES: Record<string, RoleConfig> = {
  'online-manager': ONLINE_MANAGER_CONFIG,
  // TODO: добавить другие роли
  // 'store-seller': STORE_SELLER_CONFIG,
  // 'senior-admin': SENIOR_ADMIN_CONFIG,
  // 'director': DIRECTOR_CONFIG,
};

/**
 * Получить конфиг роли по ID
 */
export function getRoleConfig(roleId: string): RoleConfig | undefined {
  return ALL_ROLES[roleId];
}
