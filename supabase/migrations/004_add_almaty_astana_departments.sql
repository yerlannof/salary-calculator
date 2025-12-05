-- Добавление новых отделов: Алматы и Астана
ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'almaty';
ALTER TYPE department_type ADD VALUE IF NOT EXISTS 'astana';
