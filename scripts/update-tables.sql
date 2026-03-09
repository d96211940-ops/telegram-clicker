-- ============================================
-- SQL СКРИПТ ДЛЯ ОБНОВЛЕНИЯ ТАБЛИЦ
-- Выполните в Supabase SQL Editor:
-- https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/sql
-- ============================================

-- ============================================
-- 1. ДОБАВЛЕНИЕ НОВЫХ КОЛОНОК В ТАБЛИЦУ PLAYERS
-- ============================================

-- Добавляем колонку referral_code если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE players ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
END $$;

-- Добавляем колонку referrer_id если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'referrer_id'
  ) THEN
    ALTER TABLE players ADD COLUMN referrer_id TEXT;
  END IF;
END $$;

-- Добавляем колонку referrals_count если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'referrals_count'
  ) THEN
    ALTER TABLE players ADD COLUMN referrals_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Добавляем колонку theme если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'theme'
  ) THEN
    ALTER TABLE players ADD COLUMN theme TEXT DEFAULT 'dark';
  END IF;
END $$;

-- Добавляем колонку notifications_enabled если её нет
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'notifications_enabled'
  ) THEN
    ALTER TABLE players ADD COLUMN notifications_enabled BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Добавляем колонки для мягкого удаления
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE players ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'players' AND column_name = 'restore_until'
  ) THEN
    ALTER TABLE players ADD COLUMN restore_until TIMESTAMPTZ;
  END IF;
END $$;

-- ============================================
-- 2. ОБНОВЛЕНИЕ ТАБЛИЦЫ UNIONS (логотипы)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'unions' AND column_name = 'logo_emoji'
  ) THEN
    ALTER TABLE unions ADD COLUMN logo_emoji TEXT DEFAULT '🔱';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'unions' AND column_name = 'logo_color'
  ) THEN
    ALTER TABLE unions ADD COLUMN logo_color TEXT DEFAULT '#667eea';
  END IF;
END $$;

-- ============================================
-- 3. ОБНОВЛЕНИЕ ТАБЛИЦЫ UNION_MEMBERS (вклад)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'union_members' AND column_name = 'total_contributed'
  ) THEN
    ALTER TABLE union_members ADD COLUMN total_contributed BIGINT DEFAULT 0;
  END IF;
END $$;

-- Изменяем тип role на текстовый с рангами
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'union_members' AND column_name = 'role' 
    AND data_type = 'text'
  ) THEN
    -- Обновляем старые значения на новые
    UPDATE union_members SET role = 'player' WHERE role = 'Участник';
    UPDATE union_members SET role = 'admin' WHERE role = 'Офицер';
    UPDATE union_members SET role = 'owner' WHERE role = 'Создатель';
  END IF;
END $$;

-- ============================================
-- 4. ОБНОВЛЕНИЕ ТАБЛИЦЫ CARDS (условия)
-- ============================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'requires_card_id'
  ) THEN
    ALTER TABLE cards ADD COLUMN requires_card_id INTEGER REFERENCES cards(id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'cards' AND column_name = 'min_level'
  ) THEN
    ALTER TABLE cards ADD COLUMN min_level INTEGER DEFAULT 1;
  END IF;
END $$;

-- ============================================
-- 5. СОЗДАНИЕ НОВЫХ ТАБЛИЦ
-- ============================================

-- Таблица player_cards (владельцы карт)
CREATE TABLE IF NOT EXISTS player_cards (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  UNIQUE(player_id, card_id)
);

-- Таблица daily_bonuses (ежедневные бонусы)
CREATE TABLE IF NOT EXISTS daily_bonuses (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  last_claimed_at TIMESTAMPTZ DEFAULT NOW(),
  streak_count INTEGER DEFAULT 1,
  UNIQUE(player_id)
);

-- Таблица notifications (уведомления)
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Таблица deleted_accounts (удалённые аккаунты)
CREATE TABLE IF NOT EXISTS deleted_accounts (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_data JSONB NOT NULL,
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  restore_until TIMESTAMPTZ NOT NULL,
  is_restored BOOLEAN DEFAULT false
);

-- ============================================
-- 6. ИНДЕКСЫ
-- ============================================

CREATE INDEX IF NOT EXISTS idx_players_referral ON players(referral_code);
CREATE INDEX IF NOT EXISTS idx_players_deleted ON players(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_player_cards_player ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_player ON daily_bonuses(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player ON notifications(player_id, is_read);

-- ============================================
-- 7. RLS ПОЛИТИКИ
-- ============================================

ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Player cards policies
DROP POLICY IF EXISTS "Player cards viewable" ON player_cards;
CREATE POLICY "Player cards viewable" ON player_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can manage their cards" ON player_cards;
CREATE POLICY "Players can manage their cards" ON player_cards FOR ALL USING (true);

-- Daily bonuses policies
DROP POLICY IF EXISTS "Daily bonuses viewable" ON daily_bonuses;
CREATE POLICY "Daily bonuses viewable" ON daily_bonuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can manage their bonuses" ON daily_bonuses;
CREATE POLICY "Players can manage their bonuses" ON daily_bonuses FOR ALL USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Notifications viewable" ON notifications;
CREATE POLICY "Notifications viewable" ON notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can manage their notifications" ON notifications;
CREATE POLICY "Players can manage their notifications" ON notifications FOR ALL USING (true);

-- Deleted accounts policies
DROP POLICY IF EXISTS "Deleted accounts restricted" ON deleted_accounts;
CREATE POLICY "Deleted accounts restricted" ON deleted_accounts FOR ALL USING (false);

-- ============================================
-- 8. ОБНОВЛЕНИЕ ДАННЫХ КАРТ
-- ============================================

-- Очищаем старые карты и добавляем новые с условиями
DELETE FROM player_cards;
DELETE FROM cards;

ALTER SEQUENCE cards_id_seq RESTART WITH 1;

INSERT INTO cards (name, description, price, rarity, type, value, icon, requires_card_id, min_level) VALUES
-- ОБЫЧНЫЕ (common) - без условий
('💪 Маленькая Сила', '+1 к силе клика', 300, 'common', 'clickPower', 1, '💪', NULL, 1),
('⚡ Малая Энергия', '+1 к регенерации', 350, 'common', 'energyRegen', 1, '⚡', NULL, 1),
('🔋 Маленькая Батарейка', '+100 к макс. энергии', 400, 'common', 'maxEnergy', 100, '🔋', NULL, 1),
('👆 Указательный Палец', '+2 к силе клика', 500, 'common', 'clickPower', 2, '👆', NULL, 1),
('🎯 Точный Выстрел', '+3% к заработку', 600, 'common', 'scoreMultiplier', 3, '🎯', NULL, 1),
('🌱 Росток Успеха', '+2 к регенерации', 550, 'common', 'energyRegen', 2, '🌱', NULL, 1),
('💰 Маленький Кошелёк', '+5% к заработку', 700, 'common', 'scoreMultiplier', 5, '💰', NULL, 1),
('🔧 Ремкомплект', '+150 к макс. энергии', 650, 'common', 'maxEnergy', 150, '🔧', NULL, 1),
('📚 Учебник', '+4 к силе клика', 800, 'common', 'clickPower', 4, '📚', NULL, 1),
('🏃 Лёгкие Ноги', '+3 к регенерации', 750, 'common', 'energyRegen', 3, '🏃', NULL, 1),
('🎒 Рюкзак', '+200 к макс. энергии', 850, 'common', 'maxEnergy', 200, '🎒', NULL, 1),
('⭐ Маленькая Звезда', '+7% к заработку', 900, 'common', 'scoreMultiplier', 7, '⭐', NULL, 1),
('🪙 Монетка', '+5 к силе клика', 950, 'common', 'clickPower', 5, '🪙', NULL, 1),
('💧 Капля Энергии', '+4 к регенерации', 900, 'common', 'energyRegen', 4, '💧', NULL, 1),
('🔥 Искра', '+8% к заработку', 1000, 'common', 'scoreMultiplier', 8, '🔥', NULL, 1),

-- РЕДКИЕ (rare) - требуют 1 common карту
('💪 Средняя Сила', '+8 к силе клика', 2000, 'rare', 'clickPower', 8, '💪', 1, 3),
('⚡ Заряд Энергии', '+6 к регенерации', 2200, 'rare', 'energyRegen', 6, '⚡', 2, 3),
('🔋 Элемент Питания', '+500 к макс. энергии', 2500, 'rare', 'maxEnergy', 500, '🔋', 3, 3),
('💎 Драгоценный Камень', '+12% к заработку', 3000, 'rare', 'scoreMultiplier', 12, '💎', 5, 4),
('🗡️ Острый Клинок', '+10 к силе клика', 3200, 'rare', 'clickPower', 10, '🗡️', 4, 4),
('🌊 Волна Энергии', '+8 к регенерации', 2800, 'rare', 'energyRegen', 8, '🌊', 6, 4),
('🛡️ Щит Защиты', '+600 к макс. энергии', 3000, 'rare', 'maxEnergy', 600, '🛡️', 8, 5),
('🎰 Игровой Автомат', '+15% к заработку', 3500, 'rare', 'scoreMultiplier', 15, '🎰', 7, 5),
('⚔️ Боец', '+12 к силе клика', 3600, 'rare', 'clickPower', 12, '⚔️', 9, 5),
('💫 Пульсар', '+10 к регенерации', 3400, 'rare', 'energyRegen', 10, '💫', 10, 5),
('🎪 Цирковой Шатёр', '+700 к макс. энергии', 3400, 'rare', 'maxEnergy', 700, '🎪', 11, 6),
('🏆 Турнирный Приз', '+18% к заработку', 4000, 'rare', 'scoreMultiplier', 18, '🏆', 12, 6),
('🦅 Орлиный Глаз', '+14 к силе клика', 4000, 'rare', 'clickPower', 14, '🦅', 13, 6),
('🌈 Радуга', '+12 к регенерации', 3800, 'rare', 'energyRegen', 12, '🌈', 14, 7),
('💼 Портфель Инвестора', '+800 к макс. энергии', 3800, 'rare', 'maxEnergy', 800, '💼', 15, 7),

-- ЭПИЧЕСКИЕ (epic) - требуют 1 rare карту
('🚀 Ракетный Двигатель', '+20 к силе клика', 8000, 'epic', 'clickPower', 20, '🚀', 16, 10),
('⚡ Шторм Энергии', '+15 к регенерации', 8500, 'epic', 'energyRegen', 15, '⚡', 17, 10),
('🔮 Хрустальный Шар', '+1200 к макс. энергии', 9000, 'epic', 'maxEnergy', 1200, '🔮', 18, 10),
('💰 Золотая Жила', '+25% к заработку', 10000, 'epic', 'scoreMultiplier', 25, '💰', 19, 12),
('👑 Королевский Трон', '+25 к силе клика', 11000, 'epic', 'clickPower', 25, '👑', 20, 12),
('🌟 Сверхновая', '+20 к регенерации', 10000, 'epic', 'energyRegen', 20, '🌟', 21, 12),
('🏰 Замок', '+1500 к макс. энергии', 12000, 'epic', 'maxEnergy', 1500, '🏰', 22, 14),
('🎯 Мастер Прицел', '+30% к заработку', 13000, 'epic', 'scoreMultiplier', 30, '🎯', 23, 14),
('🔥 Феникс', '+30 к силе клика', 14000, 'epic', 'clickPower', 30, '🔥', 24, 14),
('🌙 Лунный Свет', '+25 к регенерации', 13000, 'epic', 'energyRegen', 25, '🌙', 25, 15),
('💎 Алмазная Шахта', '+1800 к макс. энергии', 15000, 'epic', 'maxEnergy', 1800, '💎', 26, 15),
('🎰 Казино', '+35% к заработку', 16000, 'epic', 'scoreMultiplier', 35, '🎰', 27, 15),

-- ЛЕГЕНДАРНЫЕ (legendary) - требуют 1 epic карту
('👑 Корона Императора', '+50 к силе клика', 30000, 'legendary', 'clickPower', 50, '👑', 28, 20),
('⚡ Гнев Зевса', '+35 к регенерации', 32000, 'legendary', 'energyRegen', 35, '⚡', 29, 20),
('🐲 Дракон', '+40 к силе клика', 35000, 'legendary', 'clickPower', 40, '🐲', 33, 25),
('🌟 Пульс Вселенной', '+3000 к макс. энергии', 38000, 'legendary', 'maxEnergy', 3000, '🌟', 34, 25),
('💰 Финансовая Империя', '+50% к заработку', 40000, 'legendary', 'scoreMultiplier', 50, '💰', 30, 25),
('🏆 Олимп', '+45 к силе клика', 42000, 'legendary', 'clickPower', 45, '🏆', 35, 30),
('🔥 Адом', '+40 к регенерации', 40000, 'legendary', 'energyRegen', 40, '🔥', 36, 30),
('💎 Бриллиант', '+3500 к макс. энергии', 45000, 'legendary', 'maxEnergy', 3500, '💎', 37, 30),
('🎰 Джекпот', '+60% к заработку', 50000, 'legendary', 'scoreMultiplier', 60, '🎰', 38, 35),
('🌈 Единорог', '+55 к силе клика', 55000, 'legendary', 'clickPower', 55, '🌈', 31, 35),
('⚛️ Атомная Энергия', '+50 к регенерации', 52000, 'legendary', 'energyRegen', 50, '⚛️', 32, 35),
('🚀 Межгалактический', '+4000 к макс. энергии', 60000, 'legendary', 'maxEnergy', 4000, '🚀', 39, 40);

-- ============================================
-- ГОТОВО!
-- ============================================
