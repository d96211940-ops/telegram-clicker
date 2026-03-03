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

-- 3. Таблица игроков (НОВАЯ!)
CREATE TABLE IF NOT EXISTS players (
  id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT,
  photo_url TEXT,
  score BIGINT DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_clicks BIGINT DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Индексы для производительности
CREATE INDEX IF NOT EXISTS idx_unions_code ON unions(code);
CREATE INDEX IF NOT EXISTS idx_unions_score ON unions(score DESC);
CREATE INDEX IF NOT EXISTS idx_union_members_user ON union_members(user_id);
CREATE INDEX IF NOT EXISTS idx_union_members_union ON union_members(union_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_players_level ON players(level DESC);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

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

-- Политики для players (НОВЫЕ!)
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
CREATE POLICY "Players are viewable by everyone"
  ON players FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own player data" ON players;
CREATE POLICY "Users can insert their own player data"
  ON players FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own player data" ON players;
CREATE POLICY "Users can update their own player data"
  ON players FOR UPDATE
  USING (true);

-- ============================================
-- ГОТОВО! Проверьте в Table Editor
-- ============================================
