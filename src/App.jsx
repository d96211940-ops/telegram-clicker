import { useEffect, useState } from 'react';
import { supabase, checkConnection } from './supabase';
import BottomNav from './components/BottomNav';
import Profile from './components/Profile';
import Clicker from './components/Clicker';
import Union from './components/Union';
import Rating from './components/Rating';
import Cards from './components/Cards';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('clicker');
  const [telegramUser, setTelegramUser] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [union, setUnion] = useState(null);
  const [boosts, setBoosts] = useState(null);

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        setTelegramUser(user);
        
        // Сохраняем игрока в Supabase
        savePlayerToSupabase(user);
      }

      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');

      // Сохраняем время выхода при закрытии приложения
      window.addEventListener('beforeunload', () => {
        localStorage.setItem('clicker_last_logout', Date.now().toString());
      });

      // Также сохраняем при сворачивании
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          localStorage.setItem('clicker_last_logout', Date.now().toString());
        }
      });

      // Для Telegram Mini Apps - при закрытии
      tg.onEvent('main_button_pressed', () => {
        localStorage.setItem('clicker_last_logout', Date.now().toString());
      });
    }

    // Сохраняем при размонтировании компонента
    return () => {
      localStorage.setItem('clicker_last_logout', Date.now().toString());
    };
  }, []);

  // Сохранение данных игрока в Supabase
  const savePlayerToSupabase = async (user) => {
    try {
      const playerId = user.id.toString();
      const playerData = {
        id: playerId,
        username: user.username || null,
        first_name: user.first_name || 'Игрок',
        last_name: user.last_name || null,
        photo_url: user.photo_url || null,
        updated_at: new Date().toISOString(),
      };

      // Пробуем обновить или создать запись
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id')
        .eq('id', playerId)
        .single();

      if (existingPlayer) {
        // Обновляем существующего игрока
        await supabase
          .from('players')
          .update(playerData)
          .eq('id', playerId);
      } else {
        // Создаём нового игрока
        await supabase
          .from('players')
          .insert([playerData]);
      }

      console.log('✅ Данные игрока сохранены в Supabase');
    } catch (error) {
      console.warn('⚠️ Не удалось сохранить игрока в Supabase:', error.message);
    }
  };

  // Обновление данных игрока (монеты, уровень, клики)
  const updatePlayerStats = async (playerId, stats) => {
    try {
      await supabase
        .from('players')
        .update({
          score: stats.score,
          level: stats.level,
          total_clicks: stats.totalClicks,
          total_earned: stats.totalEarned,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerId);
    } catch (error) {
      console.warn('⚠️ Не удалось обновить статистику:', error.message);
    }
  };

  useEffect(() => {
    const savedScore = parseInt(localStorage.getItem('clicker_score') || '0');
    setScore(savedScore);
    setLevel(Math.floor(savedScore / 1000) + 1);

    const savedUnion = localStorage.getItem('clicker_my_union');
    if (savedUnion) {
      setUnion(JSON.parse(savedUnion));
    }

    const savedBoosts = localStorage.getItem('clicker_boosts');
    if (savedBoosts) {
      setBoosts(JSON.parse(savedBoosts));
    }
  }, []);

  const handleScoreUpdate = (newScore) => {
    setScore(newScore);
    setLevel(Math.floor(newScore / 1000) + 1);

    // Обновляем статистику в Supabase
    if (telegramUser?.id) {
      const totalClicks = parseInt(localStorage.getItem('clicker_total_clicks') || '0');
      const totalEarned = parseInt(localStorage.getItem('clicker_total_earned') || '0');
      
      updatePlayerStats(telegramUser.id.toString(), {
        score: newScore,
        level: Math.floor(newScore / 1000) + 1,
        totalClicks,
        totalEarned,
      });
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile telegramUser={telegramUser} score={score} level={level} union={union} />;
      case 'clicker':
        return <Clicker onScoreUpdate={handleScoreUpdate} />;
      case 'union':
        return <Union score={score} telegramUser={telegramUser} />;
      case 'rating':
        return <Rating telegramUser={telegramUser} />;
      case 'cards':
        return <Cards score={score} onScoreUpdate={handleScoreUpdate} />;
      default:
        return <Clicker onScoreUpdate={handleScoreUpdate} />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
