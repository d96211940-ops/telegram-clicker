import { useEffect, useState } from 'react';
import './Profile.css';

const Profile = ({ telegramUser, score, level, union }) => {
  const [userId] = useState(() => {
    const saved = localStorage.getItem('clicker_user_id');
    if (saved) return saved;
    const newId = Math.floor(1000000000 + Math.random() * 9000000000);
    localStorage.setItem('clicker_user_id', newId.toString());
    return newId.toString();
  });

  const [stats] = useState({
    totalClicks: parseInt(localStorage.getItem('clicker_total_clicks') || '0'),
    totalEarned: parseInt(localStorage.getItem('clicker_total_earned') || '0'),
    playTime: parseInt(localStorage.getItem('clicker_play_time') || '0'),
  });

  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    localStorage.setItem('clicker_total_clicks', stats.totalClicks.toString());
    localStorage.setItem('clicker_total_earned', stats.totalEarned.toString());
  }, [stats]);

  const getLevelTitle = (lvl) => {
    if (lvl < 5) return '🥉 Новичок';
    if (lvl < 10) return '🥈 Любитель';
    if (lvl < 20) return '🥇 Профессионал';
    if (lvl < 50) return '💎 Эксперт';
    if (lvl < 100) return '👑 Мастер';
    return '🌟 Легенда';
  };

  const progressToNextLevel = (level) => {
    const currentLevelMin = (level - 1) * 1000;
    const nextLevelMin = level * 1000;
    const progress = ((score - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progress, 100);
  };

  return (
    <div className="profile">
      <div className="profile-header">
        <div className="avatar-container">
          <div className="avatar">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" />
            ) : (
              <span>{telegramUser?.first_name?.[0] || '👤'}</span>
            )}
          </div>
          <div className="avatar-glow"></div>
        </div>
        
        <h2 className="username">
          {telegramUser?.first_name || 'Игрок'} 
          {telegramUser?.last_name ? ` ${telegramUser.last_name}` : ''}
        </h2>
        
        <div className="user-id">ID: {userId}</div>
        
        <div className="level-badge">
          <span className="level-emoji">{level < 10 ? '🌟' : level < 25 ? '💫' : '🔥'}</span>
          <span>Уровень {level}</span>
        </div>
        
        <div className="level-title">{getLevelTitle(level)}</div>
      </div>

      <div className="level-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progressToNextLevel(level)}%` }}
          ></div>
        </div>
        <div className="progress-text">
          {progressToNextLevel(level).toFixed(0)}% до {level + 1} уровня
        </div>
      </div>

      <div className="union-info">
        <div className="union-icon">🤝</div>
        <div className="union-text">
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
        
        <div className="stat-card">
          <div className="stat-icon">🪙</div>
          <div className="stat-value">{score.toLocaleString()}</div>
          <div className="stat-label">Монеты</div>
        </div>
      </div>

      <div className="achievements">
        <h3>🏅 Достижения</h3>
        <div className="achievements-grid">
          <div className={`achievement ${level >= 5 ? 'unlocked' : ''}`}>
            <span className="achievement-icon">🥉</span>
            <span className="achievement-name">Первые шаги</span>
          </div>
          <div className={`achievement ${level >= 10 ? 'unlocked' : ''}`}>
            <span className="achievement-icon">🥈</span>
            <span className="achievement-name">Опытный</span>
          </div>
          <div className={`achievement ${level >= 25 ? 'unlocked' : ''}`}>
            <span className="achievement-icon">🥇</span>
            <span className="achievement-name">Мастер</span>
          </div>
          <div className={`achievement ${score >= 10000 ? 'unlocked' : ''}`}>
            <span className="achievement-icon">💎</span>
            <span className="achievement-name">Богач</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
