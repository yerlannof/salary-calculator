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
 * Единая прогрессивная шкала для всех должностей (версия 10.12.2025)
 *
 * Особенности:
 * - 6 уровней по 1 млн каждый
 * - Скачок после 3 млн (5% → 7%) - мотивация добить до цели
 * - Цель на человека: 3 млн продаж в месяц
 * - Ниже 2 млн: слабый сотрудник
 */
const STANDARD_TIERS: SalaryTier[] = [
  { minSales: 0, maxSales: 1000000, percentage: 3, levelName: 'Новичок', levelEmoji: 'sprout' },
  { minSales: 1000000, maxSales: 2000000, percentage: 4, levelName: 'Продавец', levelEmoji: 'shopping-bag' },
  { minSales: 2000000, maxSales: 3000000, percentage: 5, levelName: 'Опытный', levelEmoji: 'star' },
  { minSales: 3000000, maxSales: 4000000, percentage: 7, levelName: 'Мастер', levelEmoji: 'flame' },  // Скачок!
  { minSales: 4000000, maxSales: 5000000, percentage: 8, levelName: 'Профи', levelEmoji: 'zap' },
  { minSales: 5000000, maxSales: 6000000, percentage: 9, levelName: 'Легенда', levelEmoji: 'crown' },
];

/**
 * Все локации и должности (версия 10.12.2025)
 */
export const LOCATIONS: LocationConfig[] = [
  {
    id: 'tsum-online',
    name: 'ЦУМ + Онлайн',
    emoji: '🏢',
    roles: [
      {
        id: 'senior-admin',
        name: 'Старший администратор',
        baseSalary: 150000,
        maxMonthlySales: 6000000,
        tiers: STANDARD_TIERS,
      },
      {
        id: 'tsum-seller',
        name: 'Продавец ЦУМ',
        baseSalary: 80000,
        maxMonthlySales: 6000000,
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
        id: 'moscow-admin',
        name: 'Админ-кассир',
        baseSalary: 110000,
        maxMonthlySales: 6000000,
        tiers: STANDARD_TIERS,
      },
      {
        id: 'moscow-seller',
        name: 'Продавец',
        baseSalary: 80000,
        maxMonthlySales: 6000000,
        tiers: STANDARD_TIERS,
      },
    ],
  },
  {
    id: 'baytursynova',
    name: 'Байтурсынова',
    emoji: '🏪',
    roles: [
      {
        id: 'baytursynova-seller',
        name: 'Продавец',
        baseSalary: 80000,
        maxMonthlySales: 6000000,
        tiers: STANDARD_TIERS,
      },
    ],
  },
  {
    id: 'astana',
    name: 'Астана',
    emoji: '🌆',
    roles: [
      {
        id: 'astana-seller',
        name: 'Продавец',
        baseSalary: 80000,
        maxMonthlySales: 6000000,
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

/**
 * Маппинг отделов на конфиги ролей (версия 10.12.2025)
 *
 * Определяет какая роль и оклад используется для расчета ЗП сотрудников каждого отдела.
 * Используется в Team API и Employee API для единообразного расчета зарплат.
 *
 * ВАЖНО: Пока все сотрудники считаются как "Продавцы" (80k оклад).
 * В будущем должность будет определяться через МойСклад или админку.
 */
import type { DepartmentType } from '@/lib/supabase/types'

export const DEPARTMENT_ROLE_CONFIG: Record<DepartmentType, { locationId: string; roleId: string }> = {
  // Новая структура (10.12.2025)
  almaty: { locationId: 'tsum-online', roleId: 'tsum-seller' },   // ЦУМ, Online New → Продавец 80k (пока все как продавцы)
  astana: { locationId: 'astana', roleId: 'astana-seller' },      // Астана → Продавец 80k
  // Legacy отделы (для совместимости)
  moscow: { locationId: 'trc-moscow', roleId: 'moscow-seller' },  // Москва → Продавец 80k (пока все как продавцы)
  tsum: { locationId: 'tsum-online', roleId: 'tsum-seller' },     // ЦУМ → Продавец 80k
  online: { locationId: 'tsum-online', roleId: 'tsum-seller' },   // Онлайн → Продавец 80k (объединён с ЦУМ)
};
