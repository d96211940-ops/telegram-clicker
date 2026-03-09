-- ============================================
-- SQL СКРИПТ ДЛЯ СОЗДАНИЯ ТАБЛИЦ (ОБНОВЛЁННЫЙ)
-- Выполните в Supabase SQL Editor:
-- https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/sql
-- ============================================

-- ============================================
-- 1. ТАБЛИЦА СОЮЗОВ (с логотипом)
-- ============================================
CREATE TABLE IF NOT EXISTS unions (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  members INTEGER DEFAULT 1,
  score BIGINT DEFAULT 0,
  description TEXT DEFAULT 'Союз',
  logo_emoji TEXT DEFAULT '🔱',
  logo_color TEXT DEFAULT '#667eea',
  logo_shape TEXT DEFAULT 'circle',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id TEXT NOT NULL
);

-- ============================================
-- 2. ТАБЛИЦА УЧАСТНИКОВ СОЮЗА (с рангами)
-- ============================================
CREATE TABLE IF NOT EXISTS union_members (
  id BIGSERIAL PRIMARY KEY,
  union_id BIGINT REFERENCES unions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'player', -- player, admin, owner
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  total_contributed BIGINT DEFAULT 0, -- всего очков принесено в союз
  UNIQUE(union_id, user_id)
);

-- ============================================
-- 3. ТАБЛИЦА ИГРОКОВ (с рефералами и настройками)
-- ============================================
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
  referrer_id TEXT, -- кто пригласил
  referral_code TEXT UNIQUE, -- уникальный код для приглашений
  referrals_count INTEGER DEFAULT 0, -- сколько пригласил
  theme TEXT DEFAULT 'dark', -- dark, light
  notifications_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- мягкое удаление
  restore_until TIMESTAMPTZ -- до когда можно восстановить
);

-- ============================================
-- 4. ТАБЛИЦА КАРТ (с условиями покупки)
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price BIGINT NOT NULL,
  rarity TEXT NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  type TEXT NOT NULL,
  value INTEGER NOT NULL,
  icon TEXT NOT NULL,
  requires_card_id INTEGER REFERENCES cards(id), -- требуемая карта для покупки
  min_level INTEGER DEFAULT 1, -- минимальный уровень для покупки
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. ТАБЛИЦА ВЛАДЕЛЬЦЕВ КАРТ
-- ============================================
CREATE TABLE IF NOT EXISTS player_cards (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  card_id INTEGER REFERENCES cards(id),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT false,
  UNIQUE(player_id, card_id)
);

-- ============================================
-- 6. ТАБЛИЦА ЗАДАЧ СОЮЗА
-- ============================================
CREATE TABLE IF NOT EXISTS union_tasks (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  task_type TEXT NOT NULL,
  points INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'extreme')),
  icon TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 7. ТЕКУЩИЕ ЗАДАЧИ СОЮЗОВ
-- ============================================
CREATE TABLE IF NOT EXISTS union_current_tasks (
  id BIGSERIAL PRIMARY KEY,
  union_id BIGINT REFERENCES unions(id) ON DELETE CASCADE,
  task_id BIGINT REFERENCES union_tasks(id),
  current_value INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(union_id, task_id)
);

-- ============================================
-- 8. ЕЖЕДНЕВНЫЕ БОНУСЫ
-- ============================================
CREATE TABLE IF NOT EXISTS daily_bonuses (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  last_claimed_at TIMESTAMPTZ DEFAULT NOW(),
  streak_count INTEGER DEFAULT 1,
  UNIQUE(player_id)
);

-- ============================================
-- 9. УВЕДОМЛЕНИЯ
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT REFERENCES players(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 10. УДАЛЁННЫЕ АККАУНТЫ (для восстановления)
-- ============================================
CREATE TABLE IF NOT EXISTS deleted_accounts (
  id BIGSERIAL PRIMARY KEY,
  player_id TEXT NOT NULL,
  player_data JSONB NOT NULL, -- полные данные аккаунта
  deleted_at TIMESTAMPTZ DEFAULT NOW(),
  restore_until TIMESTAMPTZ NOT NULL,
  is_restored BOOLEAN DEFAULT false
);

-- ============================================
-- ИНДЕКСЫ ДЛЯ ПРОИЗВОДИТЕЛЬНОСТИ
-- ============================================
CREATE INDEX IF NOT EXISTS idx_unions_code ON unions(code);
CREATE INDEX IF NOT EXISTS idx_unions_score ON unions(score DESC);
CREATE INDEX IF NOT EXISTS idx_union_members_user ON union_members(user_id);
CREATE INDEX IF NOT EXISTS idx_union_members_union ON union_members(union_id);
CREATE INDEX IF NOT EXISTS idx_players_score ON players(score DESC);
CREATE INDEX IF NOT EXISTS idx_players_level ON players(level DESC);
CREATE INDEX IF NOT EXISTS idx_players_referral ON players(referral_code);
CREATE INDEX IF NOT EXISTS idx_players_deleted ON players(deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cards_rarity ON cards(rarity);
CREATE INDEX IF NOT EXISTS idx_cards_price ON cards(price);
CREATE INDEX IF NOT EXISTS idx_union_tasks_difficulty ON union_tasks(difficulty);
CREATE INDEX IF NOT EXISTS idx_union_current_tasks_union ON union_current_tasks(union_id);
CREATE INDEX IF NOT EXISTS idx_union_current_tasks_expires ON union_current_tasks(expires_at);
CREATE INDEX IF NOT EXISTS idx_player_cards_player ON player_cards(player_id);
CREATE INDEX IF NOT EXISTS idx_daily_bonuses_player ON daily_bonuses(player_id);
CREATE INDEX IF NOT EXISTS idx_notifications_player ON notifications(player_id, is_read);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_current_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_bonuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE deleted_accounts ENABLE ROW LEVEL SECURITY;

-- Политики для unions
DROP POLICY IF EXISTS "Unions are viewable by everyone" ON unions;
CREATE POLICY "Unions are viewable by everyone" ON unions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create unions" ON unions;
CREATE POLICY "Users can create unions" ON unions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their unions" ON unions;
CREATE POLICY "Users can update their unions" ON unions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their unions" ON unions;
CREATE POLICY "Users can delete their unions" ON unions FOR DELETE USING (true);

-- Политики для union_members
DROP POLICY IF EXISTS "Members are viewable by everyone" ON union_members;
CREATE POLICY "Members are viewable by everyone" ON union_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage members" ON union_members;
CREATE POLICY "Users can manage members" ON union_members FOR ALL USING (true);

-- Политики для players
DROP POLICY IF EXISTS "Players are viewable by everyone" ON players;
CREATE POLICY "Players are viewable by everyone" ON players FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own player data" ON players;
CREATE POLICY "Users can insert their own player data" ON players FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their own player data" ON players;
CREATE POLICY "Users can update their own player data" ON players FOR UPDATE USING (auth.uid()::text = id OR true);

-- Политики для cards
DROP POLICY IF EXISTS "Cards are viewable by everyone" ON cards;
CREATE POLICY "Cards are viewable by everyone" ON cards FOR SELECT USING (true);

-- Политики для union_tasks
DROP POLICY IF EXISTS "Tasks are viewable by everyone" ON union_tasks;
CREATE POLICY "Tasks are viewable by everyone" ON union_tasks FOR SELECT USING (true);

-- Политики для union_current_tasks
DROP POLICY IF EXISTS "Current tasks viewable by everyone" ON union_current_tasks;
CREATE POLICY "Current tasks viewable by everyone" ON union_current_tasks FOR SELECT USING (true);

DROP POLICY IF EXISTS "Unions can manage their tasks" ON union_current_tasks;
CREATE POLICY "Unions can manage their tasks" ON union_current_tasks FOR ALL USING (true);

-- Политики для player_cards
DROP POLICY IF EXISTS "Player cards viewable" ON player_cards;
CREATE POLICY "Player cards viewable" ON player_cards FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can manage their cards" ON player_cards;
CREATE POLICY "Players can manage their cards" ON player_cards FOR ALL USING (auth.uid()::text = player_id OR true);

-- Политики для daily_bonuses
DROP POLICY IF EXISTS "Daily bonuses viewable" ON daily_bonuses;
CREATE POLICY "Daily bonuses viewable" ON daily_bonuses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Players can manage their bonuses" ON daily_bonuses;
CREATE POLICY "Players can manage their bonuses" ON daily_bonuses FOR ALL USING (auth.uid()::text = player_id OR true);

-- Политики для notifications
DROP POLICY IF EXISTS "Notifications viewable" ON notifications;
CREATE POLICY "Notifications viewable" ON notifications FOR SELECT USING (auth.uid()::text = player_id OR true);

DROP POLICY IF EXISTS "Players can manage their notifications" ON notifications;
CREATE POLICY "Players can manage their notifications" ON notifications FOR ALL USING (auth.uid()::text = player_id OR true);

-- Политики для deleted_accounts
DROP POLICY IF EXISTS "Deleted accounts restricted" ON deleted_accounts;
CREATE POLICY "Deleted accounts restricted" ON deleted_accounts FOR ALL USING (false);

-- ============================================
-- ЗАПОЛНЕНИЕ КАРТ (с условиями покупки)
-- ============================================

-- Очищаем старые данные если есть
DELETE FROM player_cards;
DELETE FROM cards;

-- Сбрасываем последовательность
ALTER SEQUENCE cards_id_seq RESTART WITH 1;

INSERT INTO cards (name, description, price, rarity, type, value, icon, requires_card_id, min_level) VALUES
-- ОБЫЧНЫЕ (common) - 15 карт (без условий)
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

-- РЕДКИЕ (rare) - 15 карт (требуют 3 common карты)
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

-- ЭПИЧЕСКИЕ (epic) - 12 карт (требуют 2 rare карты)
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

-- ЛЕГЕНДАРНЫЕ (legendary) - 12 карт (требуют 2 epic карты)
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
-- ЗАПОЛНЕНИЕ ЗАДАЧ СОЮЗА (сокращённо)
-- ============================================

DELETE FROM union_tasks;
ALTER SEQUENCE union_tasks_id_seq RESTART WITH 1;

INSERT INTO union_tasks (name, description, target_value, task_type, points, difficulty, icon) VALUES
-- ЛЁГКИЕ (easy)
('👆 Клик-Мастер', 'Сделайте {target} кликов', 100, 'clicks', 10, 'easy', '👆'),
('💰 Копилка', 'Заработайте {target} монет', 1000, 'score', 15, 'easy', '💰'),
('⚡ Энерджайзер', 'Восстановите {target} энергии', 500, 'energy', 10, 'easy', '⚡'),

-- СРЕДНИЕ (medium)
('👆 Армия Кликов', 'Сделайте {target} кликов', 500, 'clicks', 30, 'medium', '👆'),
('💰 Состояние', 'Заработайте {target} монет', 10000, 'score', 40, 'medium', '💰'),
('⚡ Энергетик', 'Восстановите {target} энергии', 2500, 'energy', 30, 'medium', '⚡'),

-- СЛОЖНЫЕ (hard)
('👆 Легион', 'Сделайте {target} кликов', 2000, 'clicks', 80, 'hard', '👆'),
('💰 Богатство', 'Заработайте {target} монет', 50000, 'score', 100, 'hard', '💰'),
('⚡ Гигант', 'Восстановите {target} энергии', 10000, 'energy', 70, 'hard', '⚡'),

-- ЭКСТРЕМАЛЬНЫЕ (extreme)
('👆 Армагеддон', 'Сделайте {target} кликов', 10000, 'clicks', 200, 'extreme', '👆'),
('💰 Империя', 'Заработайте {target} монет', 500000, 'score', 300, 'extreme', '💰'),
('⚡ Вселенная', 'Восстановите {target} энергии', 50000, 'energy', 170, 'extreme', '⚡');

-- ============================================
-- ГОТОВО!
-- ============================================
