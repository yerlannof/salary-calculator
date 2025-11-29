/**
 * Конфигурация прогрессивных шкал заработной платы
 * GameOver Shop
 */

export interface SalaryTier {
  minSales: number;
  maxSales: number;
  percentage: number;
  levelName: string;
  levelEmoji: string;
}

export interface RoleConfig {
  id: string;
  name: string;
  baseSalary: number;
  tiers: SalaryTier[];
  maxMonthlySales?: number;
}

export interface LocationConfig {
  id: string;
  name: string;
  emoji: string;
  roles: RoleConfig[];
}

/**
 * Стандартная прогрессивная шкала для всех должностей
 */
const STANDARD_TIERS: SalaryTier[] = [
  { minSales: 0, maxSales: 1000000, percentage: 5, levelName: 'Новичок', levelEmoji: '🌱' },
  { minSales: 1000000, maxSales: 2000000, percentage: 6, levelName: 'Продавец', levelEmoji: '💼' },
  { minSales: 2000000, maxSales: 2500000, percentage: 7, levelName: 'Опытный', levelEmoji: '⭐' },
  { minSales: 2500000, maxSales: 3000000, percentage: 8, levelName: 'Мастер', levelEmoji: '🎯' },
  { minSales: 3000000, maxSales: 3500000, percentage: 9, levelName: 'Профи', levelEmoji: '🔥' },
  { minSales: 3500000, maxSales: 4000000, percentage: 10, levelName: 'Эксперт', levelEmoji: '💎' },
  { minSales: 4000000, maxSales: 4500000, percentage: 11, levelName: 'Элита', levelEmoji: '👑' },
  { minSales: 4500000, maxSales: 5000000, percentage: 12, levelName: 'Легенда', levelEmoji: '🏆' },
  { minSales: 5000000, maxSales: 5500000, percentage: 13, levelName: 'Бог продаж', levelEmoji: '⚡' },
];

/**
 * Все локации и должности
 */
export const LOCATIONS: LocationConfig[] = [
  {
    id: 'online',
    name: 'Онлайн',
    emoji: '🌐',
    roles: [
      {
        id: 'online-manager',
        name: 'Онлайн-менеджер',
        baseSalary: 50000,
        maxMonthlySales: 5500000,
        tiers: STANDARD_TIERS,
      },
      {
        id: 'senior-online-manager',
        name: 'Старший онлайн-менеджер',
        baseSalary: 90000,
        maxMonthlySales: 5500000,
        tiers: STANDARD_TIERS,
      },
    ],
  },
  {
    id: 'trc-moscow',
    name: 'ТРЦ Москва',
    emoji: '🏬',
    roles: [
      {
        id: 'trc-seller',
        name: 'Продавец-консультант',
        baseSalary: 40000,
        maxMonthlySales: 5500000,
        tiers: STANDARD_TIERS,
      },
      {
        id: 'trc-admin',
        name: 'Админ-Кассир',
        baseSalary: 80000,
        maxMonthlySales: 5500000,
        tiers: STANDARD_TIERS,
      },
    ],
  },
  {
    id: 'td-tsum',
    name: 'ТД ЦУМ',
    emoji: '🏢',
    roles: [
      {
        id: 'tsum-admin',
        name: 'Админ-Кассир',
        baseSalary: 80000,
        maxMonthlySales: 5500000,
        tiers: STANDARD_TIERS,
      },
    ],
  },
];

/**
 * Получить конфиг роли по ID локации и роли
 */
export function getRoleConfig(locationId: string, roleId: string): RoleConfig | undefined {
  const location = LOCATIONS.find(l => l.id === locationId);
  return location?.roles.find(r => r.id === roleId);
}

/**
 * Дефолтный конфиг (для обратной совместимости)
 */
export const ONLINE_MANAGER_CONFIG = LOCATIONS[0].roles[0];
