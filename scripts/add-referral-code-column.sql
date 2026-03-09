-- Добавление колонки referral_code в таблицу players
-- Выполните этот запрос в Supabase SQL Editor

ALTER TABLE players ADD COLUMN referral_code TEXT UNIQUE;

-- Создание индекса для быстрого поиска по коду
CREATE INDEX IF NOT EXISTS idx_players_referral ON players(referral_code);
