/**
 * Скрипт для автоматического создания таблиц в Supabase
 * 
 * ЗАМЕНИТЕ service_key на ваш сервисный ключ!
 * Его можно найти в Settings → API → service_role key
 */

const SUPABASE_URL = 'https://pjwdlwbujcdhkxrptxpn.supabase.co';
const SUPABASE_SERVICE_KEY = 'ВСТАВЬТЕ_SERVICE_ROLE_KEY'; // Замените на service_role key!

const SQL_SCRIPT = `
-- Таблица союзов
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

-- Таблица участников
CREATE TABLE IF NOT EXISTS union_members (
  id BIGSERIAL PRIMARY KEY,
  union_id BIGINT REFERENCES unions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  role TEXT DEFAULT 'Участник',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(union_id, user_id)
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_unions_code ON unions(code);
CREATE INDEX IF NOT EXISTS idx_unions_score ON unions(score DESC);
CREATE INDEX IF NOT EXISTS idx_union_members_user ON union_members(user_id);
CREATE INDEX IF NOT EXISTS idx_union_members_union ON union_members(union_id);

-- RLS
ALTER TABLE unions ENABLE ROW LEVEL SECURITY;
ALTER TABLE union_members ENABLE ROW LEVEL SECURITY;

-- Политики unions
DROP POLICY IF EXISTS "Unions are viewable by everyone" ON unions;
CREATE POLICY "Unions are viewable by everyone" ON unions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create unions" ON unions;
CREATE POLICY "Users can create unions" ON unions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update their unions" ON unions;
CREATE POLICY "Users can update their unions" ON unions FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their unions" ON unions;
CREATE POLICY "Users can delete their unions" ON unions FOR DELETE USING (true);

-- Политики union_members
DROP POLICY IF EXISTS "Members are viewable by everyone" ON union_members;
CREATE POLICY "Members are viewable by everyone" ON union_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage members" ON union_members;
CREATE POLICY "Users can manage members" ON union_members FOR ALL USING (true);
`;

async function createTables() {
  console.log('🚀 Создание таблиц в Supabase...\n');
  console.log(`URL: ${SUPABASE_URL}`);
  
  if (SUPABASE_SERVICE_KEY.includes('ВСТАВЬТЕ')) {
    console.error('\n❌ ОШИБКА: Вставьте service_role key вместо заглушки!');
    console.error('\nГде найти:');
    console.error('1. Откройте https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/settings/api');
    console.error('2. Скопируйте "service_role key" (не anon key!)');
    console.error('3. Вставьте в SUPABASE_SERVICE_KEY в этом файле');
    process.exit(1);
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SERVICE_KEY,
      },
      body: JSON.stringify({ sql_string: SQL_SCRIPT })
    });

    const result = await response.json();

    if (response.ok) {
      console.log('\n✅ Таблицы успешно созданы!');
      console.log('\n📊 Проверьте результат:');
      console.log(`   https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/editor`);
    } else {
      console.error('\n❌ Ошибка:', result);
      console.error('\n💡 Попробуйте создать таблицы вручную через SQL Editor:');
      console.log(`   https://app.supabase.com/project/pjwdlwbujcdhkxrptxpn/sql`);
    }
  } catch (error) {
    console.error('\n❌ Ошибка подключения:', error.message);
    console.error('\n💡 Попробуйте создать таблицы вручную через SQL Editor');
  }
}

createTables();
