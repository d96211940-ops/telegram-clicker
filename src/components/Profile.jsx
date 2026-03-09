import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './Profile.css';

const Profile = ({ telegramUser, totalEarned, level, union: parentUnion, addToast }) => {
  const [userId, setUserId] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [referralCount, setReferralCount] = useState(0);
  const [theme, setTheme] = useState('dark');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [union, setUnion] = useState(null);

  // Загрузка союза
  useEffect(() => {
    if (parentUnion) {
      setUnion(parentUnion);
    } else if (telegramUser?.id) {
      loadUnionData(telegramUser.id.toString());
    }
  }, [telegramUser, parentUnion]);

  useEffect(() => {
    if (telegramUser?.id) {
      setUserId(telegramUser.id.toString());
      loadReferralData(telegramUser.id.toString());
      loadSettings(telegramUser.id.toString());
      loadStats(telegramUser.id.toString());
    }
  }, [telegramUser]);

  const [stats, setStats] = useState({
    totalClicks: 0,
    totalEarned: 0,
    playTime: 0,
  });

  const loadReferralData = async (playerId) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('referral_code, referrals_count')
        .eq('id', playerId)
        .single();

      if (error) throw error;

      if (data) {
        setReferralCode(data.referral_code || 'REF' + playerId.substring(0, 6));
        setReferralCount(data.referrals_count || 0);
      } else {
        const newCode = 'REF' + Math.random().toString(36).substring(2, 8).toUpperCase();
        setReferralCode(newCode);
      }
    } catch (error) {
      console.error('Ошибка загрузки реферальных данных:', error);
      if (addToast) addToast('❌ Ошибка загрузки рефералов', 'error');
    }
  };

  const loadSettings = async (playerId) => {
    try {
      // Сначала пробуем загрузить из localStorage
      const savedTheme = localStorage.getItem('clicker_theme');
      const savedNotifications = localStorage.getItem('clicker_notifications');
      
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
          document.documentElement.style.setProperty('--tg-theme-bg-color', '#f5f5f5');
          document.documentElement.style.setProperty('--tg-theme-text-color', '#1a1a2e');
        } else {
          document.documentElement.style.setProperty('--tg-theme-bg-color', '#1a1a2e');
          document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
        }
      }
      
      if (savedNotifications !== null) {
        setNotificationsEnabled(savedNotifications === 'true');
      }

      // Затем загружаем из базы данных
      const { data, error } = await supabase
        .from('players')
        .select('theme, notifications_enabled')
        .eq('id', playerId)
        .single();

      if (error) throw error;

      if (data) {
        // Используем данные из БД если они есть
        if (data.theme) {
          setTheme(data.theme);
          document.documentElement.setAttribute('data-theme', data.theme);
          if (data.theme === 'light') {
            document.documentElement.style.setProperty('--tg-theme-bg-color', '#f5f5f5');
            document.documentElement.style.setProperty('--tg-theme-text-color', '#1a1a2e');
          } else {
            document.documentElement.style.setProperty('--tg-theme-bg-color', '#1a1a2e');
            document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
          }
        }
        if (data.notifications_enabled !== undefined) {
          setNotificationsEnabled(data.notifications_enabled !== false);
        }
      }
    } catch (error) {
      console.error('Ошибка загрузки настроек:', error);
      if (addToast) addToast('❌ Ошибка загрузки настроек', 'error');
    }
  };

  const loadStats = async (playerId) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('total_clicks, total_earned')
        .eq('id', playerId)
        .single();

      if (error) throw error;

      if (data) {
        setStats({
          totalClicks: data.total_clicks || 0,
          totalEarned: data.total_earned || 0,
          playTime: 0,
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки статистики:', error);
      if (addToast) addToast('❌ Ошибка загрузки статистики', 'error');
    }
  };

  const loadUnionData = async (playerId) => {
    try {
      // Загружаем из БД - проверяем участника
      const { data: memberData } = await supabase
        .from('union_members')
        .select('union_id, role')
        .eq('user_id', playerId)
        .single();

      if (memberData) {
        const { data: unionData } = await supabase
          .from('unions')
          .select('*')
          .eq('id', memberData.union_id)
          .single();

        if (unionData) {
          setUnion({ ...unionData, role: memberData.role });
          return;
        }
      }

      // Проверяем, не является ли игрок владельцем
      const { data: ownerData } = await supabase
        .from('unions')
        .select('*')
        .eq('owner_id', playerId)
        .single();

      if (ownerData) {
        setUnion({ ...ownerData, role: 'owner' });
      }
    } catch (error) {
      console.warn('Ошибка загрузки союза:', error);
    }
  };

  const copyReferralLink = () => {
    const botUsername = 'dz001_bot'; // ЗАМЕНИТЕ на username вашего бота
    const link = `https://t.me/${botUsername}?start=${referralCode}`;
    navigator.clipboard.writeText(link);
    if (addToast) addToast('✅ Реферальная ссылка скопирована!', 'success');
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    
    // Применяем тему немедленно
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('clicker_theme', newTheme);
    
    // Применяем CSS переменные
    if (newTheme === 'light') {
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#f5f5f5');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#1a1a2e');
    } else {
      document.documentElement.style.setProperty('--tg-theme-bg-color', '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', '#ffffff');
    }

    if (telegramUser?.id) {
      await supabase
        .from('players')
        .update({ theme: newTheme })
        .eq('id', telegramUser.id.toString());
    }

    if (addToast) addToast(`🎨 Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'}`, 'info');
  };

  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    // Сохраняем в localStorage
    localStorage.setItem('clicker_notifications', newValue ? 'true' : 'false');

    if (telegramUser?.id) {
      await supabase
        .from('players')
        .update({ notifications_enabled: newValue })
        .eq('id', telegramUser.id.toString());
    }

    if (addToast) addToast(`🔔 Уведомления ${newValue ? 'включены' : 'отключены'}`, 'info');
  };

  const handleDeleteAccount = async () => {
    if (!telegramUser?.id) return;

    try {
      const playerId = telegramUser.id.toString();
      const playerData = {
        id: playerId,
        username: telegramUser?.username,
        first_name: telegramUser?.first_name,
        level,
        totalEarned,
      };

      await supabase
        .from('deleted_accounts')
        .insert([{
          player_id: playerId,
          player_data: playerData,
          restore_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        }]);

      await supabase
        .from('players')
        .update({
          deleted_at: new Date().toISOString(),
          restore_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', playerId);

      localStorage.clear();

      if (addToast) addToast('❌ Аккаунт удалён. 5 дней на восстановление.', 'error', 5000);
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
      if (addToast) addToast('❌ Ошибка при удалении аккаунта', 'error');
    }
  };

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
    const progress = ((totalEarned - currentLevelMin) / (nextLevelMin - currentLevelMin)) * 100;
    return Math.min(progress, 100);
  };

  const coinsToNextLevel = () => {
    const nextLevelMin = level * 1000;
    return Math.max(0, nextLevelMin - totalEarned);
  };

  const getAvatarUrl = () => {
    if (telegramUser?.photo_url) return telegramUser.photo_url;
    return null;
  };

  const avatarUrl = getAvatarUrl();

  return (
    <div className="profile">
      {/* Header */}
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
            <div className="progress-fill" style={{ width: `${progressToNextLevel(level)}%` }}></div>
          </div>
          <div className="progress-text">
            🎯 До {level + 1} ур. осталось: <strong>{coinsToNextLevel().toLocaleString()} 💰</strong>
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="profile-actions">
        <button className="profile-action-btn" onClick={() => setShowReferral(true)}>
          👥 Рефералы
        </button>
        <button className="profile-action-btn" onClick={() => setShowSettings(true)}>
          ⚙️ Настройки
        </button>
        <button className="profile-action-btn" onClick={() => setShowHelp(true)}>
          ❓ Помощь
        </button>
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

      {/* Компактная статистика */}
      <div className="mini-stats">
        <div className="mini-stat-item">
          <span className="mini-stat-icon">👆</span>
          <span className="mini-stat-value">{stats.totalClicks.toLocaleString()}</span>
          <span className="mini-stat-label">Клики</span>
        </div>
        <div className="mini-stat-item">
          <span className="mini-stat-icon">💰</span>
          <span className="mini-stat-value">{totalEarned.toLocaleString()}</span>
          <span className="mini-stat-label">Всего</span>
        </div>
        <div className="mini-stat-item">
          <span className="mini-stat-icon">⭐</span>
          <span className="mini-stat-value">{level}</span>
          <span className="mini-stat-label">Уровень</span>
        </div>
      </div>

      {/* Достижения */}
      <div className="achievements-section">
        <h3 className="section-title">🏅 Достижения</h3>
        <div className="achievements-grid">
          <div className={`achievement ${level >= 5 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥉</span>
            <span className="achievement-name">Первые шаги</span>
            <span className="achievement-desc">5 уровень</span>
          </div>
          <div className={`achievement ${level >= 10 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥈</span>
            <span className="achievement-name">Опытный</span>
            <span className="achievement-desc">10 уровень</span>
          </div>
          <div className={`achievement ${level >= 25 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">🥇</span>
            <span className="achievement-name">Мастер</span>
            <span className="achievement-desc">25 уровень</span>
          </div>
          <div className={`achievement ${totalEarned >= 10000 ? 'unlocked' : 'locked'}`}>
            <span className="achievement-icon">💎</span>
            <span className="achievement-name">Богач</span>
            <span className="achievement-desc">10K монет</span>
          </div>
        </div>
      </div>

      {/* Модальное рефералов */}
      {showReferral && (
        <div className="modal-overlay" onClick={() => setShowReferral(false)}>
          <div className="modal referral-modal" onClick={e => e.stopPropagation()}>
            <h3>👥 Реферальная программа</h3>
            
            <div className="referral-info">
              <div className="referral-stat">
                <span className="referral-stat-value">{referralCount}</span>
                <span className="referral-stat-label">из 5</span>
              </div>
              <span className="referral-stat-text">приглашённых друзей</span>
            </div>

            <div className="referral-rewards">
              <div className="reward-item">
                <span>🎁 Друг получает:</span>
                <strong>1000 💰</strong>
              </div>
              <div className="reward-item">
                <span>🎁 Вы получаете:</span>
                <strong>500 💰</strong>
              </div>
            </div>

            <div className="referral-link-section">
              <label>Ваша реферальная ссылка:</label>
              <div className="referral-link-box">
                <input
                  type="text"
                  readOnly
                  value={`https://t.me/dz001_bot?start=${referralCode}`}
                  className="referral-input"
                />
                <button className="copy-link-btn" onClick={copyReferralLink}>
                  📋
                </button>
              </div>
            </div>

            {referralCount >= 5 && (
              <div className="referral-limit">
                ⚠️ Достигнут лимит в 5 приглашений
              </div>
            )}

            <button className="modal-close-btn" onClick={() => setShowReferral(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное настроек */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={e => e.stopPropagation()}>
            <h3>⚙️ Настройки</h3>
            
            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-icon">🎨</span>
                <div>
                  <div className="setting-name">Тема</div>
                  <div className="setting-desc">{theme === 'dark' ? 'Тёмная' : 'Светлая'}</div>
                </div>
              </div>
              <button className="setting-toggle" onClick={toggleTheme}>
                {theme === 'dark' ? '🌙' : '☀️'}
              </button>
            </div>

            <div className="setting-item">
              <div className="setting-info">
                <span className="setting-icon">🔔</span>
                <div>
                  <div className="setting-name">Уведомления</div>
                  <div className="setting-desc">{notificationsEnabled ? 'Включены' : 'Отключены'}</div>
                </div>
              </div>
              <button className="setting-toggle" onClick={toggleNotifications}>
                {notificationsEnabled ? '🔔' : '🔕'}
              </button>
            </div>

            <div className="setting-danger-zone">
              <h4>⚠️ Опасная зона</h4>
              <button className="delete-account-btn" onClick={() => {
                setShowSettings(false);
                setShowDeleteConfirm(true);
              }}>
                🗑️ Удалить аккаунт
              </button>
              <p className="delete-warning">
                У вас будет 5 дней на восстановление аккаунта
              </p>
            </div>

            <button className="modal-close-btn" onClick={() => setShowSettings(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное помощи */}
      {showHelp && (
        <div className="modal-overlay" onClick={() => setShowHelp(false)}>
          <div className="modal help-modal" onClick={e => e.stopPropagation()}>
            <h3>❓ Помощь</h3>
            
            <div className="help-content">
              <p>Здесь вы можете найти информацию о том, как играть в игру.</p>
              
              <div className="help-section">
                <h4>🎮 Как играть</h4>
                <ul>
                  <li>Тапайте по монете для заработка монет</li>
                  <li>Покупайте карты для улучшения характеристик</li>
                  <li>Вступайте в союзы для выполнения заданий</li>
                  <li>Приглашайте друзей для получения бонусов</li>
                </ul>
              </div>

              <div className="help-section">
                <h4>📞 Связаться с поддержкой</h4>
                <p>Если у вас возникли вопросы, напишите нам:</p>
                <a href="https://t.me/igra_support" target="_blank" rel="noopener noreferrer" className="support-link">
                  ✈️ Написать в Telegram
                </a>
              </div>
            </div>

            <button className="modal-close-btn" onClick={() => setShowHelp(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Модальное удаления аккаунта */}
      {showDeleteConfirm && (
        <div className="modal-overlay" onClick={() => setShowDeleteConfirm(false)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <h3>🗑️ Удаление аккаунта</h3>
            
            <div className="delete-warning-large">
              ⚠️ Вы уверены, что хотите удалить аккаунт?
            </div>

            <ul className="delete-consequences">
              <li>❌ Все ваши монеты и карты будут удалены</li>
              <li>❌ Вы покинете все союзы</li>
              <li>❌ Ваш прогресс будет потерян</li>
              <li>✅ У вас есть 5 дней на восстановление</li>
            </ul>

            <div className="delete-actions">
              <button className="modal-cancel-btn" onClick={() => setShowDeleteConfirm(false)}>
                Отмена
              </button>
              <button className="modal-confirm danger" onClick={handleDeleteAccount}>
                Удалить аккаунт
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
