import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, checkConnection } from './supabase';
import BottomNav from './components/BottomNav';
import Profile from './components/Profile';
import Clicker from './components/Clicker';
import Union from './components/Union';
import Rating from './components/Rating';
import Cards from './components/Cards';
import Toast from './components/Toast';
import DailyBonus from './components/DailyBonus';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('clicker');
  const [telegramUser, setTelegramUser] = useState(null);
  const [totalEarned, setTotalEarned] = useState(0);
  const [level, setLevel] = useState(1);
  const [union, setUnion] = useState(null);
  const [boosts, setBoosts] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [showDailyBonus, setShowDailyBonus] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Ref для хранения последних значений
  const lastSavedStats = useRef({ totalEarned: 0, saveTimeout: null });

  // Функция для добавления уведомлений
  const addToast = (message, type = 'info', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type, duration }]);
  };

  const removeToast = (id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  // Обновление данных игрока (монеты, уровень, клики)
  const updatePlayerStats = async (playerId, stats) => {
    try {
      await supabase
        .from('players')
        .update({
          total_earned: stats.totalEarned,
          level: stats.level,
          total_clicks: stats.totalClicks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', playerId);
    } catch (error) {
      console.warn('⚠️ Не удалось обновить статистику:', error.message);
    }
  };

  // Принудительное сохранение в БД
  const forceSaveToSupabase = useCallback(() => {
    if (lastSavedStats.current.saveTimeout) {
      clearTimeout(lastSavedStats.current.saveTimeout);
    }
    if (telegramUser?.id) {
      const totalClicks = parseInt(localStorage.getItem('clicker_total_clicks') || '0');
      updatePlayerStats(telegramUser.id.toString(), {
        level: Math.floor(lastSavedStats.current.totalEarned / 1000) + 1,
        totalClicks,
        totalEarned: lastSavedStats.current.totalEarned,
      });
    }
  }, [telegramUser]);

  // Сохранение данных игрока в Supabase
  const savePlayerToSupabase = async (user) => {
    try {
      const playerId = user.id.toString();
      
      // Проверяем существующего игрока
      const { data: existingPlayer } = await supabase
        .from('players')
        .select('id, referral_code')
        .eq('id', playerId)
        .single();

      const playerData = {
        id: playerId,
        username: user.username || null,
        first_name: user.first_name || 'Игрок',
        last_name: user.last_name || null,
        photo_url: user.photo_url || null,
        updated_at: new Date().toISOString(),
      };

      if (existingPlayer) {
        // Обновляем существующего игрока
        await supabase
          .from('players')
          .update(playerData)
          .eq('id', playerId);
        
        // Генерируем referral_code если его нет
        if (!existingPlayer.referral_code) {
          const newCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
          await supabase
            .from('players')
            .update({ referral_code: newCode })
            .eq('id', playerId);
        }
      } else {
        // Создаём нового игрока с referral_code
        const referralCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        await supabase
          .from('players')
          .insert([{
            ...playerData,
            referral_code: referralCode,
            referrals_count: 0,
          }]);
      }

      console.log('✅ Данные игрока сохранены в Supabase');
    } catch (error) {
      console.warn('⚠️ Не удалось сохранить игрока в Supabase:', error.message);
    }
  };

  // Обработчик обновления счёта - ТЕПЕРЬ ОДНО ЗНАЧЕНИЕ ДЛЯ ВСЕХ
  const handleScoreUpdate = useCallback((newTotalEarned) => {
    // Обновляем состояние - это обновит ВСЕ компоненты
    setTotalEarned(newTotalEarned);
    setLevel(Math.floor(newTotalEarned / 1000) + 1);
    
    // Сохраняем для БД
    lastSavedStats.current.totalEarned = newTotalEarned;

    // Отменяем предыдущий таймаут
    if (lastSavedStats.current.saveTimeout) {
      clearTimeout(lastSavedStats.current.saveTimeout);
    }

    // Сохраняем в БД с задержкой
    lastSavedStats.current.saveTimeout = setTimeout(() => {
      if (telegramUser?.id) {
        const totalClicks = parseInt(localStorage.getItem('clicker_total_clicks') || '0');
        updatePlayerStats(telegramUser.id.toString(), {
          level: Math.floor(newTotalEarned / 1000) + 1,
          totalClicks,
          totalEarned: newTotalEarned,
        });
      }
    }, 2000);
  }, [telegramUser]);

  // Загрузка данных из Supabase при старте
  useEffect(() => {
    const loadFromSupabase = async () => {
      if (!telegramUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('players')
          .select('total_earned, level')
          .eq('id', telegramUser.id.toString())
          .single();

        if (error) throw error;

        if (data) {
          const earned = data.total_earned || 0;
          setTotalEarned(earned);
          setLevel(data.level || Math.floor(earned / 1000) + 1);
          lastSavedStats.current.totalEarned = earned;
        }
      } catch (err) {
        console.error('Ошибка загрузки данных из Supabase:', err);
        addToast('❌ Ошибка подключения к базе данных', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    if (telegramUser) {
      loadFromSupabase();
    }
  }, [telegramUser]);

  // Инициализация Telegram WebApp
  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();

      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const user = tg.initDataUnsafe.user;
        setTelegramUser(user);
        savePlayerToSupabase(user);
        
        // Проверяем реферальную ссылку
        const startParam = tg.initDataUnsafe.start_param;
        if (startParam) {
          // Игрок пришёл по реферальной ссылке
          handleReferral(user.id.toString(), startParam);
        }
      }

      // Применяем тему Telegram
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');

      // Сохраняем при закрытии
      window.addEventListener('beforeunload', () => {
        forceSaveToSupabase();
      });

      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          forceSaveToSupabase();
        }
      });

      tg.onEvent('main_button_pressed', () => {
        forceSaveToSupabase();
      });
    }

    return () => {
      forceSaveToSupabase();
      if (lastSavedStats.current.saveTimeout) {
        clearTimeout(lastSavedStats.current.saveTimeout);
      }
    };
  }, [forceSaveToSupabase]);

  // Обработка реферала
  const handleReferral = async (playerId, referralCode) => {
    try {
      // Проверяем, не использовал ли уже этот игрок реферала
      const { data: player } = await supabase
        .from('players')
        .select('referrer_id')
        .eq('id', playerId)
        .single();

      if (player?.referrer_id) {
        console.log('Реферал уже использован');
        return;
      }

      // Находим реферера по коду
      const { data: referrer } = await supabase
        .from('players')
        .select('id, referrals_count')
        .eq('referral_code', referralCode)
        .single();

      if (referrer && referrer.id !== playerId) {
        // Обновляем реферала
        await supabase
          .from('players')
          .update({ referrer_id: referrer.id })
          .eq('id', playerId);

        // Увеличиваем счётчик рефералов у реферера
        const newReferralsCount = (referrer.referrals_count || 0) + 1;
        await supabase
          .from('players')
          .update({ referrals_count: newReferralsCount })
          .eq('id', referrer.id);

        // Начисляем бонус рефереру (500 монет)
        const { data: referrerData } = await supabase
          .from('players')
          .select('total_earned')
          .eq('id', referrer.id)
          .single();

        if (referrerData) {
          await supabase
            .from('players')
            .update({ total_earned: (referrerData.total_earned || 0) + 500 })
            .eq('id', referrer.id);
        }

        // Начисляем бонус новому игроку (1000 монет)
        await supabase
          .from('players')
          .update({ total_earned: 1000 })
          .eq('id', playerId);

        console.log('✅ Реферал успешно зачислен!');
      }
    } catch (error) {
      console.error('Ошибка обработки реферала:', error);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: '#fff' }}>
          <div>⏳ Загрузка...</div>
        </div>
      );
    }

    switch (activeTab) {
      case 'profile':
        return <Profile telegramUser={telegramUser} totalEarned={totalEarned} level={level} union={union} addToast={addToast} />;
      case 'clicker':
        return <Clicker onScoreUpdate={handleScoreUpdate} totalEarned={totalEarned} />;
      case 'union':
        return <Union totalEarned={totalEarned} telegramUser={telegramUser} addToast={addToast} />;
      case 'rating':
        return <Rating telegramUser={telegramUser} />;
      case 'cards':
        return <Cards totalEarned={totalEarned} onScoreUpdate={handleScoreUpdate} telegramUser={telegramUser} level={level} />;
      default:
        return <Clicker onScoreUpdate={handleScoreUpdate} totalEarned={totalEarned} />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="toast-container">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>

      {telegramUser && (
        <DailyBonus
          telegramUser={telegramUser}
          onBonusClaimed={(coins, unionPoints, streak) => {
            // Обновляем монеты
            const newTotalEarned = totalEarned + coins;
            setTotalEarned(newTotalEarned);
            setLevel(Math.floor(newTotalEarned / 1000) + 1);
            lastSavedStats.current.totalEarned = newTotalEarned;
            
            // Сохраняем в БД
            if (telegramUser?.id) {
              updatePlayerStats(telegramUser.id.toString(), {
                level: Math.floor(newTotalEarned / 1000) + 1,
                totalClicks: parseInt(localStorage.getItem('clicker_total_clicks') || '0'),
                totalEarned: newTotalEarned,
              });
            }
            
            addToast(`🎁 Получено ${coins.toLocaleString()} монет!`, 'success', 5000);
            setShowDailyBonus(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
