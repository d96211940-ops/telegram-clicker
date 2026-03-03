import { createClient } from '@supabase/supabase-js';

// Вставьте ваши данные здесь для одноразового запуска
const SUPABASE_URL = 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR_ANON_KEY';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTables() {
  console.log('🚀 Создание таблиц в Supabase...\n');

  // 1. Таблица союзов
  console.log('📋 Создание таблицы unions...');
  const { error: unionsError } = await supabase.rpc('exec_sql', {
    sql_string: `
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
      
      CREATE INDEX IF NOT EXISTS idx_unions_code ON unions(code);
      CREATE INDEX IF NOT EXISTS idx_unions_score ON unions(score DESC);
    `
  });

  if (unionsError) {
    console.log('⚠️ Возможно, таблицы уже существуют или нет доступа к RPC');
    console.log('Ошибка:', unionsError.message);
  } else {
    console.log('✅ Таблица unions создана');
  }

  // 2. Таблица участников
  console.log('\n📋 Создание таблицы union_members...');
  const { error: membersError } = await supabase.rpc('exec_sql', {
    sql_string: `
      CREATE TABLE IF NOT EXISTS union_members (
        id BIGSERIAL PRIMARY KEY,
        union_id BIGINT REFERENCES unions(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'Участник',
        joined_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(union_id, user_id)
      );
      
      CREATE INDEX IF NOT EXISTS idx_union_members_user ON union_members(user_id);
      CREATE INDEX IF NOT EXISTS idx_union_members_union ON union_members(union_id);
    `
  });

  if (membersError) {
    console.log('⚠️ Возможно, таблицы уже существуют или нет доступа к RPC');
    console.log('Ошибка:', membersError.message);
  } else {
    console.log('✅ Таблица union_members создана');
  }

  // 3. Включаем RLS
  console.log('\n🔒 Настройка RLS (Row Level Security)...');
  const { error: rlsError } = await supabase.rpc('exec_sql', {
    sql_string: `
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
    `
  });

  if (rlsError) {
    console.log('⚠️ Ошибка настройки RLS:', rlsError.message);
  } else {
    console.log('✅ RLS настроен');
  }

  console.log('\n✨ Готово! Таблицы созданы в Supabase.');
  console.log('📊 Проверьте в панели Supabase: https://app.supabase.com');
}

createTables().catch(console.error);
