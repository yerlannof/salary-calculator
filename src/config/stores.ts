/**
 * Конфигурация магазинов и маппинг на отделы
 *
 * Этот файл содержит единственный источник истины для:
 * - Списка всех retail store IDs из MoySklad
 * - Маппинга отделов на магазины
 * - Метаданных магазинов
 */

import type { DepartmentType } from '@/lib/supabase/types'

/**
 * Информация о магазине
 */
export interface RetailStore {
  id: string
  name: string
  department: DepartmentType
  city: string
  address?: string
}

/**
 * Полный справочник всех магазинов Game Over Shop
 */
export const RETAIL_STORES: Record<string, RetailStore> = {
  // Алматы - ТРЦ Москва
  'b9585357-b51b-11ee-0a80-15c6000bc3b8': {
    id: 'b9585357-b51b-11ee-0a80-15c6000bc3b8',
    name: 'ТРЦ Москва',
    department: 'almaty',
    city: 'Алматы',
    address: 'ТРЦ Москва'
  },

  // Алматы - ТД ЦУМ
  'b5a56c15-b162-11ee-0a80-02a00015a9f3': {
    id: 'b5a56c15-b162-11ee-0a80-02a00015a9f3',
    name: 'ТД ЦУМ',
    department: 'almaty',
    city: 'Алматы',
    address: 'ТД ЦУМ'
  },

  // Алматы - Байтурсынова
  '68d485c9-b131-11ee-0a80-066b000af5c1': {
    id: '68d485c9-b131-11ee-0a80-066b000af5c1',
    name: 'Байтурсынова',
    department: 'almaty',
    city: 'Алматы',
    address: 'ул. Байтурсынова'
  },

  // Алматы - Online New
  'd1b4400d-007b-11ef-0a80-14800035ff62': {
    id: 'd1b4400d-007b-11ef-0a80-14800035ff62',
    name: 'Online New',
    department: 'almaty',
    city: 'Алматы (Online)',
  },

  // Астана - ТРЦ Аружан
  'b75138dd-b6f8-11ee-0a80-09610016847f': {
    id: 'b75138dd-b6f8-11ee-0a80-09610016847f',
    name: 'ТРЦ Аружан',
    department: 'astana',
    city: 'Астана',
    address: 'ТРЦ Аружан'
  },

  // Астана - Астана Стрит (закрыт с декабря)
  'c341e43f-b6f8-11ee-0a80-103e0016edda': {
    id: 'c341e43f-b6f8-11ee-0a80-103e0016edda',
    name: 'Астана Стрит (Ауэзова)',
    department: 'astana',
    city: 'Астана',
    address: 'ул. Ауэзова'
  },

  // Астана - Онлайн Астана
  'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81': {
    id: 'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81',
    name: 'Онлайн Астана',
    department: 'astana',
    city: 'Астана (Online)',
  },

  // Старые онлайн продажи (Legacy, возможно не используется)
  'd491733b-b6f8-11ee-0a80-033a0016fb6b': {
    id: 'd491733b-b6f8-11ee-0a80-033a0016fb6b',
    name: 'Онлайн Продажи (Legacy)',
    department: 'almaty',
    city: 'Алматы (Online)',
  },
}

/**
 * Маппинг отделов на retail store IDs
 *
 * ВАЖНО: При добавлении нового магазина:
 * 1. Добавьте его в RETAIL_STORES
 * 2. Добавьте его ID в соответствующий отдел здесь
 */
export const DEPARTMENT_STORE_IDS: Record<DepartmentType, string[]> = {
  almaty: [
    'b9585357-b51b-11ee-0a80-15c6000bc3b8',    // ТРЦ Москва
    'b5a56c15-b162-11ee-0a80-02a00015a9f3',    // ТД ЦУМ
    '68d485c9-b131-11ee-0a80-066b000af5c1',    // Байтурсынова
    'd1b4400d-007b-11ef-0a80-14800035ff62',    // Online New
  ],
  astana: [
    'b75138dd-b6f8-11ee-0a80-09610016847f',    // ТРЦ Аружан
    'c341e43f-b6f8-11ee-0a80-103e0016edda',    // Астана Стрит (Ауэзова) - закрыт с декабря
    'a5ed2d1e-79bc-11f0-0a80-01e0001ceb81'     // Онлайн Астана
  ],
  // Старые отделы (не используются, но сохраняем для совместимости)
  moscow: [],
  tsum: [],
  online: [],
}

/**
 * Получить название магазина по ID
 */
export function getStoreName(storeId: string): string {
  return RETAIL_STORES[storeId]?.name || 'Неизвестный магазин'
}

/**
 * Получить отдел магазина по ID
 */
export function getStoreDepartment(storeId: string): DepartmentType | null {
  return RETAIL_STORES[storeId]?.department || null
}

/**
 * Получить все магазины отдела
 */
export function getDepartmentStores(department: DepartmentType): RetailStore[] {
  const storeIds = DEPARTMENT_STORE_IDS[department]
  return storeIds.map(id => RETAIL_STORES[id]).filter(Boolean)
}

/**
 * Проверить принадлежность магазина к отделу
 */
export function isStoreInDepartment(storeId: string, department: DepartmentType): boolean {
  return DEPARTMENT_STORE_IDS[department].includes(storeId)
}
