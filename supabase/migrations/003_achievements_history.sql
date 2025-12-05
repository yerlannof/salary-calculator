-- =============================================
-- GameOver Shop - Phase 3: Achievements History & Data Linking
-- =============================================

-- =============================================
-- 1. Добавляем поле для лучшего дня в monthly_rankings
-- =============================================
ALTER TABLE monthly_rankings
  ADD COLUMN IF NOT EXISTS best_day_sales NUMERIC(12,2) DEFAULT 0;

-- Индекс для быстрого поиска рекордов
CREATE INDEX IF NOT EXISTS idx_monthly_rankings_best_day
  ON monthly_rankings(employee_id, best_day_sales DESC);

-- =============================================
-- 2. Функция связывания продаж с сотрудниками
-- =============================================
CREATE OR REPLACE FUNCTION link_sales_to_employees()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE sales s
  SET employee_id = e.id
  FROM employees e
  WHERE s.moysklad_employee_id = e.moysklad_id
    AND s.employee_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 3. Функция связывания возвратов с сотрудниками
-- =============================================
CREATE OR REPLACE FUNCTION link_returns_to_employees()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE returns r
  SET employee_id = e.id
  FROM employees e
  WHERE r.moysklad_employee_id = e.moysklad_id
    AND r.employee_id IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 4. Функция поиска orphaned moysklad_employee_id
-- =============================================
CREATE OR REPLACE FUNCTION find_orphaned_sales_employees()
RETURNS TABLE (moysklad_employee_id TEXT, sales_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT s.moysklad_employee_id, COUNT(*) as sales_count
  FROM sales s
  LEFT JOIN employees e ON s.moysklad_employee_id = e.moysklad_id
  WHERE e.id IS NULL AND s.employee_id IS NULL
  GROUP BY s.moysklad_employee_id;
END;
$$ LANGUAGE plpgsql;
