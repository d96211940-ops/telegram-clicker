import { createClient } from '@supabase/supabase-js';

// Ваши данные из Supabase
const SUPABASE_URL = 'https://pjwdlwbujcdhkxrptxpn.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_LFO2HQSFTntahx7YGj5BSg_Cxs9wcvV';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка подключения
export const checkConnection = async () => {
  try {
    const { data, error } = await supabase.from('unions').select('count').limit(1);
    if (error) {
      if (error.code === '42P01') {
        console.warn('⚠️ Таблицы ещё не созданы! Выполните SQL скрипт в Supabase SQL Editor.');
        return false;
      }
      console.error('❌ Ошибка подключения:', error.message);
      return false;
    }
    console.log('✅ Supabase подключён!');
    return true;
  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    return false;
  }
};
