import { useEffect, useState } from 'react';
import './Profile.css';

const Profile = ({ telegramUser, score, level, union }) => {
  const [userId, setUserId] = useState('');
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalEarned: 0,
    playTime: 0,
  });

  useEffect(() => {
    // Получаем ID пользователя из Telegram или генерируем
    if (telegramUser?.id) {
      setUserId(telegramUser.id.toString());
    } else {
      const saved = localStorage.getItem('clicker_user_id');
      if (saved) {
        setUserId(saved);
      } else {
        const newId = Math.floor(1000000000 + Math.random() * 9000000000);
        localStorage.setItem('clicker_user_id', newId.toString());
        setUserId(newId.toString());
      }
    }

    // Загружаем статистику
    setStats({
      totalClicks: parseInt(localStorage.getItem('clicker_total_clicks') || '0'),
      totalEarned: parseInt(localStorage.getItem('clicker_total_earned') || '0'),
      playTime: parseInt(localStorage.getItem('clicker_play_time') || '0'),
    });
  }, [telegramUser]);

  useEffect(() => {
    localStorage.setItem('clicker_total_clicks', stats.totalClicks.toString());
    localStorage.setItem('clicker_total_earned', stats.totalEarned.toString());
  }, [stats]);

  const getLevelTitle = (lvl) => {
    if (lvl < 5) return 'Новичок';
    if (lvl < 10) return 'Любитель';
    if (lvl < 20) return 'Профессионал';
    if (lvl < 50) return 'Эксперт';
    if (lvl < 100) return 'Мастер';
    return 'Легенда';
  };

  const getLevelEmoji = (lvl) => {
    if (lvl < 10) return '🌟';
    if (lvl < 25) return '💫';
    if (lvl < 50) return '🔥';
    return '👑';
  };

  const progressToNextLevel = (lvl) => {
    const currentLevelMin = (lvl - 1) * 1000;
    const nextLevelMin = lvl * 1000;
    const progress = ((score - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progress, 100);
  };

  // Получаем аватар из Telegram
  const getAvatarUrl = () => {
    if (telegramUser?.photo_url) {
      return telegramUser.photo_url;
    }
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="profile">
      {/* Header с аватаром */}
      <div className="profile-header">
        <div className="avatar-wrapper">
          <div className="avatar-ring"></div>
          <div className="avatar-ring-2"></div>
          <div className="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-img" />
            ) : (
              <span className="avatar-placeholder">
                {telegramUser?.first_name?.[0]?.toUpperCase() || '👤'}
              </span>
            )}
          </div>
          {telegramUser?.is_premium && (
            <div className="premium-badge">★</div>
          )}
        </div>

        <h2 className="username">
          {telegramUser?.first_name || 'Игрок'}
          {telegramUser?.last_name && ` ${telegramUser.last_name}`}
        </h2>

        {telegramUser?.username && (
          <div className="user-username">@{telegramUser.username}</div>
        )}

        <div className="user-id">ID: {userId}</div>
      </div>

      {/* Уровень */}
      <div className="level-section">
        <div className="level-info">
          <span className="level-emoji">{getLevelEmoji(level)}</span>
          <div className="level-details">
            <span className="level-number">Уровень {level}</span>
            <span className="level-title">{getLevelTitle(level)}</span>
          </div>
        </div>
        <div className="level-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressToNextLevel(level)}%` }}
            ></div>
          </div>
          <div className="progress-text">
            {progressToNextLevel(level).toFixed(0)}% до {level + 1} ур.
          </div>
        </div>
      </div>

      {/* Союз */}
      <div className="union-section">
        <div className="union-icon">🤝</div>
        <div className="union-details">
          {union ? (
            <>
              <div className="union-name">{union.name}</div>
              <div className="union-role">{union.role}</div>
            </>
          ) : (
            <div className="no-union">Нет союза</div>
          )}
        </div>
      </div>

      {/* Статистика */}
      <div className="stats-section">
        <h3 className="section-title">📊 Статистика</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👆</div>
            <div className="stat-value">{stats.totalClicks.toLocaleString()}</div>
            <div className="stat-label">Всего кликов</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{stats.totalEarned.toLocaleString()}</div>
            <div className="stat-label">Заработано</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⏱️</div>
            <div className="stat-value">{Math.floor(stats.playTime / 60)}ч</div>
            <div className="stat-label">В игре</div>
          </div>

          <div className="stat-card highlight">
            <div className="stat-icon">🪙</div>
            <div className="stat-value">{score.toLocaleString()}</div>
            <div className="stat-label">Монеты</div>
          </div>
        </div>
      </div>

      {/* Достижения */}
      <div className="achievements-section">
        <h3 className="section-title">🏅 Достижения</h3>
        <div className="achievements-grid">
          <div className={`achievement ${level >= 5 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥉</span>
            <span className="achievement-name">Первые шаги</span>
            <span className="achievement-desc">Достигни 5 уровня</span>
          </div>
          <div className={`achievement ${level >= 10 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥈</span>
            <span className="achievement-name">Опытный</span>
            <span className="achievement-desc">Достигни 10 уровня</span>
          </div>
          <div className={`achievement ${level >= 25 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥇</span>
            <span className="achievement-name">Мастер</span>
            <span className="achievement-desc">Достигни 25 уровня</span>
          </div>
          <div className={`achievement ${score >= 10000 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">💎</span>
            <span className="achievement-name">Богач</span>
            <span className="achievement-desc">Накопи 10,000 монет</span>
          </div>
          <div className={`achievement ${stats.totalClicks >= 1000 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">👆</span>
            <span className="achievement-name">Кликер</span>
            <span className="achievement-desc">Сделай 1000 кликов</span>
          </div>
          <div className={`achievement ${stats.totalEarned >= 50000 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">💰</span>
            <span className="achievement-name">Магнат</span>
            <span className="achievement-desc">Заработай 50,000 монет</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
