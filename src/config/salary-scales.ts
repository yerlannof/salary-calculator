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
 * CS2 Premier стиль рейтинга
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
      levelName: 'Gray',        // CS2: 0-4,999
      levelEmoji: '⚫',
    },
    {
      minSales: 1000000,
      maxSales: 2000000,
      percentage: 6,
      levelName: 'Cyan',        // CS2: 5,000-9,999
      levelEmoji: '🔵',
    },
    {
      minSales: 2000000,
      maxSales: 2500000,
      percentage: 7,
      levelName: 'Blue',        // CS2: 10,000-14,999
      levelEmoji: '💙',
    },
    {
      minSales: 2500000,
      maxSales: 3000000,
      percentage: 8,
      levelName: 'Purple',      // CS2: 15,000-19,999
      levelEmoji: '💜',
    },
    {
      minSales: 3000000,
      maxSales: 3500000,
      percentage: 9,
      levelName: 'Pink',        // CS2: 20,000-24,999
      levelEmoji: '💗',
    },
    {
      minSales: 3500000,
      maxSales: 4000000,
      percentage: 10,
      levelName: 'Red',         // CS2: 25,000-29,999
      levelEmoji: '❤️',
    },
    {
      minSales: 4000000,
      maxSales: 4500000,
      percentage: 11,
      levelName: 'Orange',      // CS2: 30,000+
      levelEmoji: '🧡',
    },
    {
      minSales: 4500000,
      maxSales: 5000000,
      percentage: 12,
      levelName: 'Gold',        // CS2: Elite
      levelEmoji: '💛',
    },
    {
      minSales: 5000000,
      maxSales: 5500000,
      percentage: 13,
      levelName: 'Global',      // CS2: Global Elite
      levelEmoji: '⭐',
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
