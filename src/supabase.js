import { createClient } from '@supabase/supabase-js';

// Переменные окружения (создайте файл .env в корне проекта)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://YOUR_PROJECT_ID.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Проверка подключения
if (SUPABASE_URL.includes('YOUR_PROJECT_ID')) {
  console.warn('⚠️ Supabase не настроен! Создайте файл .env с вашими данными.');
  console.warn('Скопируйте .env.example в .env и заполните переменные.');
}
