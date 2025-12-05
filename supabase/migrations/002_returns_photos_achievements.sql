-- =============================================
-- GameOver Shop - Phase 2: Returns, Photos, Achievements
-- =============================================

-- =============================================
-- 1. Таблица возвратов
-- =============================================
CREATE TABLE returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moysklad_id TEXT UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  moysklad_employee_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  return_date DATE NOT NULL,
  return_datetime TIMESTAMPTZ,
  retail_store_id TEXT,
  retail_store_name TEXT,
  original_demand_id TEXT, -- ссылка на оригинальный чек (если есть)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы для возвратов
CREATE INDEX idx_returns_employee_id ON returns(employee_id);
CREATE INDEX idx_returns_date ON returns(return_date);
CREATE INDEX idx_returns_moysklad_employee ON returns(moysklad_employee_id);

-- RLS для возвратов
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON returns FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON returns FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 2. Фото сотрудников
-- =============================================
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS photo_tiny_url TEXT;

-- =============================================
-- 3. Время продажи (для анализа по времени дня)
-- =============================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_datetime TIMESTAMPTZ;

-- =============================================
-- 4. Таблица достижений (справочник)
-- =============================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji или URL иконки
  criteria JSONB NOT NULL, -- {"type": "sales_total", "value": 1000000}
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Предзаполним базовые достижения
INSERT INTO achievements (code, name, description, icon, criteria) VALUES
  ('first_sale', 'Первая продажа', 'Совершить первую продажу', '🎯', '{"type": "sales_count", "value": 1}'),
  ('sales_100k', 'Стотысячник', 'Продажи на 100 000 ₸ за месяц', '💵', '{"type": "sales_total", "value": 100000}'),
  ('sales_500k', 'Полмиллиона', 'Продажи на 500 000 ₸ за месяц', '💰', '{"type": "sales_total", "value": 500000}'),
  ('first_million', 'Миллионер', 'Продажи на 1 000 000 ₸ за месяц', '💎', '{"type": "sales_total", "value": 1000000}'),
  ('streak_7', 'Неделя огня', '7 дней подряд с продажами', '🔥', '{"type": "streak_days", "value": 7}'),
  ('streak_14', 'Две недели в деле', '14 дней подряд с продажами', '⚡', '{"type": "streak_days", "value": 14}'),
  ('top_1', 'Чемпион', '1 место в рейтинге по итогам месяца', '👑', '{"type": "rank", "value": 1}'),
  ('top_3', 'Топ-3', 'В топ-3 по итогам месяца', '🏆', '{"type": "rank", "value": 3}'),
  ('no_returns', 'Без возвратов', '0 возвратов за месяц (при >10 продажах)', '✨', '{"type": "no_returns", "value": 10}'),
  ('avg_check_up', 'Рост чека', 'Средний чек вырос на 10%+ к прошлому месяцу', '📈', '{"type": "avg_check_growth", "value": 10}'),
  ('best_day', 'Рекордный день', 'Личный рекорд продаж за день', '🌟', '{"type": "personal_best_day", "value": 0}'),
  ('comeback', 'Камбэк', 'Вернуться в топ-5 после выпадения', '🚀', '{"type": "comeback", "value": 5}');

-- =============================================
-- 5. Таблица достижений сотрудников
-- =============================================
CREATE TABLE employee_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  period TEXT, -- '2025-11' (для месячных достижений)
  earned_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB, -- дополнительные данные (напр. значение для рекорда)
  UNIQUE(employee_id, achievement_id, period)
);

-- Индексы для достижений сотрудников
CREATE INDEX idx_employee_achievements_employee ON employee_achievements(employee_id);
CREATE INDEX idx_employee_achievements_period ON employee_achievements(period);

-- RLS для достижений
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read" ON achievements FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON employee_achievements FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON achievements FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all" ON employee_achievements FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- 6. Таблица для хранения рейтинга по месяцам (для отслеживания изменений позиции)
-- =============================================
CREATE TABLE monthly_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period TEXT NOT NULL, -- '2025-11'
  department department_type NOT NULL,
  rank INTEGER NOT NULL,
  total_sales NUMERIC(12,2) NOT NULL,
  total_returns NUMERIC(12,2) DEFAULT 0,
  net_sales NUMERIC(12,2) NOT NULL,
  sales_count INTEGER DEFAULT 0,
  returns_count INTEGER DEFAULT 0,
  avg_check NUMERIC(12,2),
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(employee_id, period)
);

CREATE INDEX idx_monthly_rankings_period ON monthly_rankings(period);
CREATE INDEX idx_monthly_rankings_employee ON monthly_rankings(employee_id);

ALTER TABLE monthly_rankings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow anonymous read" ON monthly_rankings FOR SELECT USING (true);
CREATE POLICY "Allow service role all" ON monthly_rankings FOR ALL USING (auth.role() = 'service_role');
