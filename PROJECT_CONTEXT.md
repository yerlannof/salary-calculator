# Salary Calculator - Phase 2 (Supabase Integration)

## Обзор проекта

Калькулятор зарплат для продавцов с интеграцией MoySklad и Supabase.

**Репозиторий:** `git@github.com:yerlannof/salary-calculator.git`
**Ветка разработки:** `phase2-supabase`
**Production ветка:** `main` (простой калькулятор без БД)

---

## Архитектура

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   MoySklad API  │────▶│   Next.js API   │────▶│    Supabase     │
│  (источник)     │     │   (синхронизация)│     │  (хранилище)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Frontend      │
                        │  (React/Next)   │
                        └─────────────────┘
```

---

## Магазины (Store IDs)

| Магазин | Store ID | Отдел |
|---------|----------|-------|
| Moscow TRC | `b9585357-b51b-11ee-0a80-15c6000bc3b8` | moscow |
| TSUM | `b5a56c15-b162-11ee-0a80-02a00015a9f3` | tsum |
| Online 1 | `d491733b-b6f8-11ee-0a80-033a0016fb6b` | online |
| Online 2 | `d1b4400d-007b-11ef-0a80-14800035ff62` | online |
| Online Astana | `a5ed2d1e-79bc-11f0-0a80-01e0001ceb81` | online |
| Baytursynova (Almaty) | `68d485c9-b131-11ee-0a80-066b000af5c1` | almaty |
| Astana Aruzhan | `b75138dd-b6f8-11ee-0a80-09610016847f` | astana |
| Astana Auezova | `c341e43f-b6f8-11ee-0a80-103e0016edda` | astana |

---

## MoySklad Employee Groups

| Группа | Group ID | Department |
|--------|----------|------------|
| Online | `3d2ee727-b162-11ee-0a80-0d180015051c` | online |
| TSUM | `3d2e6b45-b162-11ee-0a80-0d1800150517` | tsum |
| Moscow | `3d2ed203-b162-11ee-0a80-0d180015051b` | moscow |
| Almaty | `2e5e69b6-b132-11ee-0a80-1399000bb675` | almaty |
| Astana Street | `3d2e98fc-b162-11ee-0a80-0d1800150518` | astana |
| Astana Aruzhan | `3d2eaba1-b162-11ee-0a80-0d1800150519` | astana |

---

## База данных (Supabase)

### Таблицы

**employees**
- `id` (UUID, PK)
- `moysklad_id` (уникальный ID из MoySklad)
- `first_name`, `last_name`
- `department` (enum: moscow, tsum, online, almaty, astana)
- `photo_url`
- `shift_count` (количество смен)
- `created_at`, `updated_at`

**sales**
- `id` (UUID, PK)
- `moysklad_id` (уникальный ID продажи из MoySklad)
- `moysklad_employee_id` (связь с сотрудником)
- `retail_store_id` (ID магазина)
- `amount` (сумма)
- `sale_date`
- `created_at`

**returns**
- Аналогично sales, для возвратов

**achievements** / **achievement_history**
- Система достижений (в разработке)

### Enum types
```sql
CREATE TYPE department_type AS ENUM ('moscow', 'tsum', 'online', 'almaty', 'astana');
```

---

## API Endpoints

### Синхронизация
- `POST /api/sync/full` - Полная синхронизация (employees + sales)
- `POST /api/sync/employees` - Только сотрудники
- `POST /api/sync/sales` - Только продажи
- `POST /api/sync/returns` - Возвраты

### Данные
- `GET /api/team?store=almaty&period=2025-11` - Лидерборд команды
- `GET /api/employee/[moyskladId]` - Данные сотрудника
- `GET /api/employee/[moyskladId]/daily` - Продажи по дням

### Debug
- `GET /api/debug/verify?store=ID&period=2025-11` - Проверка данных в БД
- `GET /api/debug/sales-check?period=2025-11` - Проверка всех продаж
- `GET /api/debug/emps` - Список сотрудников
- `GET /api/debug/stores` - Список магазинов
- `GET /api/debug/groups` - Группы MoySklad

---

## Важные технические детали

### Пагинация Supabase
**КРИТИЧНО:** При пагинации ОБЯЗАТЕЛЬНО использовать ORDER BY для консистентных результатов!

```typescript
// ПРАВИЛЬНО
const { data } = await supabase
  .from('sales')
  .select('*')
  .order('moysklad_id', { ascending: true })  // <-- ВАЖНО!
  .range(offset, offset + pageSize - 1)

// НЕПРАВИЛЬНО (может давать дубликаты)
const { data } = await supabase
  .from('sales')
  .select('*')
  .range(offset, offset + pageSize - 1)
```

### Логика Team API
1. Получает `store` параметр (almaty, astana, moscow, tsum, online)
2. Маппит store -> retail_store_id(s)
3. Находит все продажи по этим магазинам за период
4. Группирует по `moysklad_employee_id`
5. Возвращает отсортированный лидерборд

---

## Текущий статус (Декабрь 2025)

### Работает
- Синхронизация сотрудников из всех групп MoySklad
- Синхронизация продаж по всем магазинам
- Team leaderboard для всех отделов (Moscow, TSUM, Online, Almaty, Astana)
- Debug endpoints для верификации данных
- Данные за октябрь, ноябрь, декабрь 2025 синхронизированы

### Проверено
- Moscow TRC: данные корректны (19.5M за ноябрь)
- Astana: 3 сотрудника, ~5.9M
- Almaty: 2 сотрудника, ~2.5M
- Дубликатов в базе нет (0)

### В разработке
- Система достижений
- Фото сотрудников
- UI компоненты (leaderboard, achievements)

---

## Переменные окружения (.env)

Файл `.env` включен в репозиторий для бэкапа:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `MOYSKLAD_TOKEN`

---

## Как запустить

```bash
# Клонировать
git clone git@github.com:yerlannof/salary-calculator.git
cd salary-calculator

# Переключиться на ветку разработки
git checkout phase2-supabase

# Установить зависимости
npm install

# Запустить dev сервер
npm run dev
# Откроется на http://localhost:3000

# Синхронизировать данные (если нужно)
curl -X POST http://localhost:3000/api/sync/full \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-12", "syncEmployees": true}'
```

---

## Миграции Supabase

Файлы в `supabase/migrations/`:
1. `001_initial_schema.sql` - Базовые таблицы
2. `002_returns_photos_achievements.sql` - Возвраты, фото, достижения
3. `003_achievements_history.sql` - История достижений
4. `004_add_almaty_astana_departments.sql` - Добавление Almaty/Astana в enum

Миграции уже применены к Supabase. При новой установке выполнять не нужно.

---

## Структура проекта

```
src/
├── app/
│   ├── api/
│   │   ├── sync/           # Синхронизация с MoySklad
│   │   ├── team/           # Team leaderboard API
│   │   ├── employee/       # Данные сотрудника
│   │   ├── debug/          # Debug endpoints
│   │   ├── achievements/   # Достижения
│   │   └── moysklad/       # Прямые запросы к MoySklad
│   ├── team-sales/         # UI страницы
│   └── page.tsx            # Главная страница
├── components/
│   ├── achievements/       # Компоненты достижений
│   ├── leaderboard/        # Компоненты лидерборда
│   └── ui/                 # UI компоненты
└── lib/
    ├── supabase/           # Supabase клиент и типы
    ├── achievements.ts     # Логика достижений
    └── streak.ts           # Логика стриков
```

---

## Контакты и ссылки

- **Supabase Dashboard:** https://supabase.com/dashboard/project/zvfxzsrmysidiaovjeff
- **MoySklad:** https://online.moysklad.ru/
- **Vercel (production):** деплоится из ветки `main`
