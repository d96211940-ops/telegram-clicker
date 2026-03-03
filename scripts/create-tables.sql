-- ============================================
-- SQL СКРИПТ ДЛЯ СОЗДАНИЯ ТАБЛИЦ
-- Выполните в Supabase SQL Editor:
-- https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/sql
-- ============================================

-- 1. Таблица союзов
CREATE TABLE IF NOT EXISTS unions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  members INTEGER DEFAULT 1,
  score BIGINT DEFAULT 0,
  description TEXT DEFAULT 'Союз',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id TEXT NOT NULL
);

-- 2. Таблица участников
CREATE TABLE IF NOT EXISTS union_members (
  id BIGSERIAL PRIMARY KEY,
  union_id BIGINT REFERENCES unions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'Участник',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(union_id, user_id)
);

-- 3. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_unions_code ON unions(code);
CREATE INDEX IF NOT EXISTS idx_unions_score ON unions(score DESC);
CREATE INDEX IF NOT EXISTS idx_union_members_user ON union_members(user_id);
CREATE INDEX IF NOT EXISTS idx_union_members_union ON union_members(union_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members ENABLE ROW LEVEL SECURITY;

-- Политики для unions
DROP POLICY IF EXISTS "Unions are viewable by everyone" ON unions;
CREATE POLICY "Unions are viewable by everyone"
  ON unions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create unions" ON unions;
CREATE POLICY "Users can create unions"
  ON unions FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their unions" ON unions;
CREATE POLICY "Users can update their unions"
  ON unions FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "Users can delete their unions" ON unions;
CREATE POLICY "Users can delete their unions"
  ON unions FOR DELETE
  USING (true);

-- Политики для union_members
DROP POLICY IF EXISTS "Members are viewable by everyone" ON union_members;
CREATE POLICY "Members are viewable by everyone"
  ON union_members FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage members" ON union_members;
CREATE POLICY "Users can manage members"
  ON union_members FOR ALL
  USING (true);

-- ============================================
-- ГОТОВО! Проверьте в Table Editor
-- ============================================
