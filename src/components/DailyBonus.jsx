import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './DailyBonus.css';

const DailyBonus = ({ telegramUser, onBonusClaimed }) => {
  const [showBonus, setShowBonus] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [timeUntilBonus, setTimeUntilBonus] = useState(null);
  const [streak, setStreak] = useState(1);

  useEffect(() => {
    if (telegramUser?.id) {
      checkBonusAvailability();
    }
  }, [telegramUser]);

  // Проверка каждые 10 секунд
  useEffect(() => {
    if (!telegramUser?.id) return;

    const interval = setInterval(() => {
      checkBonusAvailability();
    }, 10000);

    return () => clearInterval(interval);
  }, [telegramUser]);

  const checkBonusAvailability = async () => {
    try {
      const playerId = telegramUser.id.toString();

      // Получаем данные о последнем бонусе
      const { data: bonusData } = await supabase
        .from('daily_bonuses')
        .select('*')
        .eq('player_id', playerId)
        .single();

      if (!bonusData) {
        // Бонус ещё не был получен - показываем сразу
        setShowBonus(true);
        return;
      }

      const now = new Date();
      const lastClaimed = new Date(bonusData.last_claimed_at);

      // Проверяем сколько времени прошло (в часах по МСК)
      const moscowTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));
      const lastClaimedMoscow = new Date(lastClaimed.toLocaleString('en-US', { timeZone: 'Europe/Moscow' }));

      const hoursPassed = (moscowTime - lastClaimedMoscow) / (1000 * 60 * 60);

      if (hoursPassed >= 24) {
        // Прошло 24 часа - можно получать
        setShowBonus(true);
        setStreak((bonusData.streak_count || 0) + 1);
      } else {
        // Ещё не время
        const secondsUntil = Math.ceil((24 - hoursPassed) * 3600);
        setTimeUntilBonus(secondsUntil);
        setShowBonus(false);
      }
    } catch (error) {
      console.error('Ошибка проверки бонуса:', error);
    }
  };

  const claimBonus = async () => {
    if (!telegramUser?.id) return;

    setIsClaiming(true);

    try {
      const playerId = telegramUser.id.toString();
      
      // Генерируем случайные награды (только монеты)
      const minCoins = 100;
      const maxCoins = 1000;
      
      const bonusCoins = Math.floor(Math.random() * (maxCoins - minCoins + 1)) + minCoins;
      
      // Итоговая награда с учётом серии
      const totalCoins = bonusCoins * streak;

      // Отправляем данные родителю для обновления
      onBonusClaimed?.(totalCoins, 0, streak);

      // Обновляем запись о бонусе
      const { data: existingBonus } = await supabase
        .from('daily_bonuses')
        .select('*')
        .eq('player_id', playerId)
        .single();

      if (existingBonus) {
        await supabase
          .from('daily_bonuses')
          .update({
            last_claimed_at: new Date().toISOString(),
            streak_count: streak
          })
          .eq('player_id', playerId);
      } else {
        await supabase
          .from('daily_bonuses')
          .insert([{
            player_id: playerId,
            last_claimed_at: new Date().toISOString(),
            streak_count: 1
          }]);
      }

      setShowBonus(false);
      setTimeUntilBonus(24 * 60 * 60);
    } catch (error) {
      console.error('Ошибка получения бонуса:', error);
      alert('❌ Ошибка при получении бонуса');
    } finally {
      setIsClaiming(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (timeUntilBonus && timeUntilBonus > 0) {
      const timer = setInterval(() => {
        setTimeUntilBonus(prev => {
          if (prev <= 1) {
            checkBonusAvailability();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeUntilBonus]);

  if (!showBonus) return null;

  // Генерируем случайные числа для отображения
  const displayCoins = Math.floor(Math.random() * (1000 - 100 + 1)) + 100;

  return (
    <div className="daily-bonus-overlay" onClick={() => !isClaiming && claimBonus()}>
      <div className="daily-bonus-content" onClick={e => e.stopPropagation()}>
        <div className="bonus-gift">
          <div className="gift-box-large">
            <div className="gift-lid-large"></div>
            <div className="gift-body-large">🎁</div>
          </div>
        </div>
        <h2>🎉 Ежедневный бонус!</h2>
        <p className="bonus-streak">Серия: {streak} дн.</p>
        <div className="bonus-rewards">
          <div className="reward-item">
            <span className="reward-icon">💰</span>
            <span className="reward-value">+{(displayCoins * streak).toLocaleString()}</span>
            <span className="reward-label">монет</span>
          </div>
        </div>
        <button
          className="claim-bonus-btn"
          onClick={claimBonus}
          disabled={isClaiming}
        >
          {isClaiming ? '⏳...' : '🎁 Забрать бонус!'}
        </button>
      </div>
    </div>
  );
};

export default DailyBonus;
