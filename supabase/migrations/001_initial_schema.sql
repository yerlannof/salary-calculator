-- =============================================
-- GameOver Shop - Salary Calculator Schema
-- =============================================

-- Enum для отделов
CREATE TYPE department_type AS ENUM ('online', 'moscow', 'tsum');

-- =============================================
-- Таблица сотрудников
-- =============================================
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moysklad_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  department department_type NOT NULL,
  retail_store_id TEXT,
  retail_store_name TEXT,
  is_active BOOLEAN DEFAULT true,
  hired_at TIMESTAMPTZ DEFAULT now(),
  fired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Таблица продаж (кэш из МойСклад)
-- =============================================
CREATE TABLE sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  moysklad_id TEXT UNIQUE NOT NULL,
  employee_id UUID REFERENCES employees(id) ON DELETE SET NULL,
  moysklad_employee_id TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  sale_date DATE NOT NULL,
  retail_store_id TEXT,
  retail_store_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- Таблица логов синхронизации
-- =============================================
CREATE TABLE sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_type TEXT NOT NULL, -- 'employees' или 'sales'
  period TEXT, -- '2025-11' для продаж
  department TEXT, -- 'moscow', 'online', 'tsum'
  records_synced INTEGER DEFAULT 0,
  status TEXT NOT NULL, -- 'running', 'success', 'error'
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- =============================================
-- Индексы для быстрого поиска
-- =============================================
CREATE INDEX idx_employees_moysklad_id ON employees(moysklad_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_active ON employees(is_active);

CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_date ON sales(sale_date);
CREATE INDEX idx_sales_moysklad_employee ON sales(moysklad_employee_id);
CREATE INDEX idx_sales_period ON sales(date_trunc('month', sale_date));

CREATE INDEX idx_sync_log_type_period ON sync_log(sync_type, period);

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Политики для анонимного чтения (фронтенд)
CREATE POLICY "Allow anonymous read" ON employees FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON sales FOR SELECT USING (true);
CREATE POLICY "Allow anonymous read" ON sync_log FOR SELECT USING (true);

-- Политики для service role (полный доступ для бэкенда)
CREATE POLICY "Allow service role all" ON employees FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all" ON sales FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Allow service role all" ON sync_log FOR ALL USING (auth.role() = 'service_role');

-- =============================================
-- Функция для обновления updated_at
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
