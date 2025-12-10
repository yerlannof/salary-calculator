# Skill: Синхронизация продаж

## Описание
Синхронизация данных о продажах из МойСклад в Supabase для рейтинга сотрудников.

## Правильный порядок синхронизации

**ВАЖНО:** Всегда использовать `/api/sync/full` для полной синхронизации!

### Полная синхронизация (рекомендуется)

```bash
# Синхронизация за текущий месяц (декабрь 2025)
curl -s -X POST "http://localhost:3000/api/sync/full" \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-12"}' | jq '.'

# С обновлением сотрудников (если нужно добавить новых)
curl -s -X POST "http://localhost:3000/api/sync/full" \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-12", "syncEmployees": true}' | jq '.'
```

### Шаги полной синхронизации (автоматически):
1. **employees** - синхронизация сотрудников (опционально)
2. **sales** - загрузка всех продаж за период из МойСклад
3. **link-sales** - привязка продаж к сотрудникам в БД
4. **returns** - загрузка возвратов за период
5. **rankings** - расчёт месячного рейтинга по отделам
6. **achievements** - расчёт достижений

## Отдельные эндпоинты (для отладки)

```bash
# Только продажи
curl -X POST "http://localhost:3000/api/sync/sales" \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-12"}'

# Только возвраты
curl -X POST "http://localhost:3000/api/sync/returns" \
  -H "Content-Type: application/json" \
  -d '{"period": "2025-12"}'

# Только сотрудники
curl -X POST "http://localhost:3000/api/sync/employees"

# Привязка продаж к сотрудникам
curl -X POST "http://localhost:3000/api/sync/link-employees"
```

## Проверка данных

```bash
# Лидерборд Алматы (ВАЖНО: параметр department, не store!)
curl "http://localhost:3000/api/team?department=almaty&period=2025-12" | jq '.employees[:3]'

# Лидерборд Астаны
curl "http://localhost:3000/api/team?department=astana&period=2025-12" | jq '.employees[:3]'

# Топ-3 кратко
curl -s "http://localhost:3000/api/team?department=almaty&period=2025-12" | \
  jq '[.employees[:3][] | {name, netSales, position}]'
```

## Структура магазинов

| Отдел | Магазины |
|-------|----------|
| **almaty** | ТРЦ Москва, ТД ЦУМ, Байтурсынова, Online New |
| **astana** | ТРЦ Аружан, Онлайн Астана |

## Время выполнения

- Полная синхронизация: ~3-5 минут
- Только продажи: ~2-4 минуты
- Только возвраты: ~30 сек

## Частые проблемы

1. **Timeout** - увеличить --max-time до 300-600 секунд
2. **Сервер не отвечает** - перезапустить `npm run dev`
3. **Нет данных** - проверить что period в формате YYYY-MM
