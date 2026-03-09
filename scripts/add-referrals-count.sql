-- Добавляем колонку referrals_count в таблицу players
ALTER TABLE players ADD COLUMN IF NOT EXISTS referrals_count INTEGER DEFAULT 0;

-- Обновляем существующие записи (устанавливаем 0)
UPDATE players SET referrals_count = 0 WHERE referrals_count IS NULL;

-- Создаём индекс для быстрого поиска по referral_code
CREATE INDEX IF NOT EXISTS idx_players_referral_code ON players(referral_code);
