/**
 * Калькулятор заработной платы
 * Накопительная прогрессивная шкала
 */

import { RoleConfig, SalaryTier } from '@/config/salary-scales';

export interface SalaryBreakdownItem {
  tierIndex: number;
  levelName: string;
  levelEmoji: string;
  minSales: number;
  maxSales: number;
  percentage: number;
  salesInTier: number;      // Сколько продаж попало в этот уровень
  bonusAmount: number;       // Бонус за этот уровень
  isCurrentTier: boolean;    // Это текущий уровень?
  isCompleted: boolean;      // Уровень полностью пройден?
}

export interface SalaryCalculationResult {
  // Входные данные
  totalSales: number;
  roleConfig: RoleConfig;
  
  // Результаты
  baseSalary: number;
  totalBonus: number;
  totalSalary: number;
  fotPercentage: number;     // ФОТ в процентах от продаж
  
  // Детализация по уровням
  breakdown: SalaryBreakdownItem[];
  
  // Текущий уровень
  currentTier: SalaryTier | null;
  currentTierIndex: number;
  
  // Мотивация
  nextTier: SalaryTier | null;
  salesUntilNextTier: number;
  salaryAtNextTier: number;
  bonusAtNextTier: number;
}

/**
 * Рассчитать заработную плату по прогрессивной шкале
 */
export function calculateSalary(
  totalSales: number,
  config: RoleConfig
): SalaryCalculationResult {
  const breakdown: SalaryBreakdownItem[] = [];
  let totalBonus = 0;
  let currentTierIndex = -1;
  let currentTier: SalaryTier | null = null;
  
  // Проходим по каждому уровню
  for (let i = 0; i < config.tiers.length; i++) {
    const tier = config.tiers[i];
    
    // Сколько продаж попадает в этот диапазон
    let salesInTier = 0;
    let isCurrentTier = false;
    let isCompleted = false;
    
    if (totalSales > tier.minSales) {
      if (totalSales >= tier.maxSales) {
        // Полностью прошли этот уровень
        salesInTier = tier.maxSales - tier.minSales;
        isCompleted = true;
      } else {
        // Находимся на этом уровне
        salesInTier = totalSales - tier.minSales;
        isCurrentTier = true;
        currentTierIndex = i;
        currentTier = tier;
      }
    }
    
    const bonusAmount = salesInTier * (tier.percentage / 100);
    totalBonus += bonusAmount;
    
    breakdown.push({
      tierIndex: i,
      levelName: tier.levelName,
      levelEmoji: tier.levelEmoji,
      minSales: tier.minSales,
      maxSales: tier.maxSales,
      percentage: tier.percentage,
      salesInTier,
      bonusAmount,
      isCurrentTier,
      isCompleted,
    });
  }
  
  // Если продажи = 0, текущий уровень — первый
  if (currentTierIndex === -1 && config.tiers.length > 0) {
    currentTierIndex = 0;
    currentTier = config.tiers[0];
    breakdown[0].isCurrentTier = true;
  }
  
  // Если все уровни пройдены
  if (totalSales >= config.tiers[config.tiers.length - 1].maxSales) {
    currentTierIndex = config.tiers.length - 1;
    currentTier = config.tiers[currentTierIndex];
  }
  
  const totalSalary = config.baseSalary + totalBonus;
  const fotPercentage = totalSales > 0 ? (totalSalary / totalSales) * 100 : 0;
  
  // Следующий уровень и мотивация
  let nextTier: SalaryTier | null = null;
  let salesUntilNextTier = 0;
  let salaryAtNextTier = 0;
  let bonusAtNextTier = 0;

  if (currentTierIndex < config.tiers.length - 1) {
    nextTier = config.tiers[currentTierIndex + 1];
    salesUntilNextTier = Math.max(0, nextTier.minSales - totalSales);

    // Рассчитаем ЗП при достижении следующего уровня (без рекурсии)
    let nextTierBonus = 0;
    for (let i = 0; i <= currentTierIndex + 1; i++) {
      const tier = config.tiers[i];
      const tierSize = tier.maxSales - tier.minSales;
      if (i <= currentTierIndex) {
        // Полностью пройденные уровни
        nextTierBonus += tierSize * (tier.percentage / 100);
      }
      // Следующий уровень ещё не начат (minSales = граница)
    }
    salaryAtNextTier = config.baseSalary + nextTierBonus;
    bonusAtNextTier = salaryAtNextTier - totalSalary;
  }
  
  return {
    totalSales,
    roleConfig: config,
    baseSalary: config.baseSalary,
    totalBonus,
    totalSalary,
    fotPercentage,
    breakdown,
    currentTier,
    currentTierIndex,
    nextTier,
    salesUntilNextTier,
    salaryAtNextTier,
    bonusAtNextTier,
  };
}

/**
 * Форматирование суммы в тенге
 */
export function formatMoney(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0 ₸';
  }
  return new Intl.NumberFormat('ru-RU', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ₸';
}

/**
 * Форматирование суммы кратко (1.5 млн)
 */
export function formatMoneyShort(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0';
  }
  if (amount >= 1000000) {
    return (amount / 1000000).toFixed(1).replace('.0', '') + ' млн';
  }
  if (amount >= 1000) {
    return (amount / 1000).toFixed(0) + 'к';
  }
  return amount.toString();
}

/**
 * Генерация мотивационного сообщения
 */
export function getMotivationMessage(result: SalaryCalculationResult): string {
  if (!result.nextTier) {
    return `🏆 Ты на максимальном уровне "${result.currentTier?.levelName}"! Легенда!`;
  }
  
  const salesNeeded = formatMoneyShort(result.salesUntilNextTier);
  const bonusGain = formatMoney(result.bonusAtNextTier);
  
  return `🎯 До уровня "${result.nextTier.levelName}" ${result.nextTier.levelEmoji} осталось ${salesNeeded}. Допродай и получишь +${bonusGain}!`;
}
