# Skill: Salary Calculator - Обзор проекта

## Описание
Калькулятор зарплат и рейтинг продавцов для GameOver Shop с интеграцией МойСклад и Supabase.

## Быстрый старт

```bash
cd /home/yerla/projects/salary-calculator
npm run dev
# http://localhost:3000/team-sales - лидерборд
# http://localhost:3000 - калькулятор
```

## Структура

```
src/
├── app/
│   ├── api/
│   │   ├── sync/           # Синхронизация с МойСклад
│   │   ├── team/           # Лидерборд API
│   │   └── employee/       # Профиль сотрудника
│   ├── team-sales/         # UI лидерборда
│   │   ├── page.tsx        # Главная страница рейтинга
│   │   └── [moyskladId]/   # Профиль сотрудника
│   └── page.tsx            # Калькулятор зарплаты
├── components/
│   ├── leaderboard/        # EmployeeCard, Podium, PeriodSelector
│   ├── achievements/       # AchievementBadge
│   └── calculator/         # LevelIcon, LevelProgress
└── lib/
    ├── supabase/           # Supabase клиент
    ├── calculations.ts     # Расчёт ЗП по шкале
    └── achievements.ts     # Логика достижений
```

## Дизайн-система (Esports + Arcade)

### Цвета
- **neon-cyan** (#00F5FF) - главный акцент, #1 позиция
- **neon-magenta** (#FF00E5) - достижения, стрики
- **neon-yellow** (#FFE500) - деньги, HIGH SCORE
- **esports-bg** (#0A0E14) - тёмный фон
- **esports-card** (#111921) - карточки
- **esports-border** (#2A3544) - границы

### CSS классы
```css
.font-score      /* tabular-nums для чисел */
.glow-cyan       /* cyan свечение */
.text-glow-yellow /* жёлтое свечение текста */
```

## База данных (Supabase)

### Таблицы
- **employees** - сотрудники (moysklad_id, first_name, last_name, department)
- **sales** - продажи (moysklad_id, amount, sale_date, retail_store_id)
- **returns** - возвраты
- **achievements** / **achievement_history** - достижения

## Ключевые API

```bash
# Лидерборд
GET /api/team?store=almaty&period=2025-12

# Профиль сотрудника
GET /api/employee/{moyskladId}?period=2025-12

# Ежедневные продажи
GET /api/employee/{moyskladId}/daily?period=2025-12
```

## Git

```bash
git checkout phase2-supabase  # ветка разработки
git checkout main             # production
```
