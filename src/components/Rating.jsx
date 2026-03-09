import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Rating.css';

const Rating = ({ telegramUser }) => {
  const [activeTab, setActiveTab] = useState('unions');
  const [unionsRating, setUnionsRating] = useState([]);
  const [playersRating, setPlayersRating] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilUpdate, setTimeUntilUpdate] = useState(60);

  // Загрузка рейтинга
  const loadRating = async () => {
    setLoading(true);
    try {
      // Загружаем союзы
      const { data: unionsData, error: unionsError } = await supabase
        .from('unions')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (unionsError) throw unionsError;
      setUnionsRating(unionsData || []);

      // Загружаем игроков
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('total_earned', { ascending: false })
        .limit(100);

      if (playersError) throw playersError;
      setPlayersRating(playersData || []);
    } catch (error) {
      console.error('Ошибка загрузки рейтинга:', error);
      setUnionsRating([]);
      setPlayersRating([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRating();

    const countdownInterval = setInterval(() => {
      setTimeUntilUpdate(prev => {
        if (prev <= 1) {
          loadRating();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const currentData = activeTab === 'unions' ? unionsRating : playersRating;

  // Медали для топ-3
  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return null;
  };

  // Класс для позиции
  const getRankClass = (index) => {
    if (index === 0) return 'rank-1';
    if (index === 1) return 'rank-2';
    if (index === 2) return 'rank-3';
    return '';
  };

  return (
    <div className="rating">
      <div className="rating-header">
        <h2>🏆 Рейтинг</h2>
        <p className="rating-subtitle">Лучшие игроки и союзы</p>
      </div>

      <div className="rating-tabs">
        <button
          className={`tab-btn ${activeTab === 'unions' ? 'active' : ''}`}
          onClick={() => setActiveTab('unions')}
        >
          🤝 Союзы
        </button>
        <button
          className={`tab-btn ${activeTab === 'players' ? 'active' : ''}`}
          onClick={() => setActiveTab('players')}
        >
          👥 Игроки
        </button>
      </div>

      {loading ? (
        <div className="rating-loading">
          <div className="loading-spinner">🔄</div>
          <p>Загрузка рейтинга...</p>
        </div>
      ) : currentData.length === 0 ? (
        <div className="rating-empty">
          <div className="empty-icon">📊</div>
          <h3>Рейтинг пуст</h3>
          <p>
            {activeTab === 'unions'
              ? 'Создайте союз или вступите в существующий,\nчтобы попасть в рейтинг!'
              : 'Играйте активно и зарабатывайте монеты,\nчтобы попасть в топ игроков!'}
          </p>
        </div>
      ) : (
        <div className="rating-list">
          {/* Топ-3 с особым оформлением */}
          {currentData.slice(0, 3).map((item, index) => (
            <div
              key={`top-${item.id}`}
              className={`rating-item rating-item-top ${getRankClass(index)}`}
            >
              <div className="top-medal">{getMedal(index)}</div>
              <div className="top-avatar">
                {activeTab === 'unions' ? (
                  <div className="union-avatar" style={{ background: item.logo_color || '#667eea' }}>
                    {item.logo_emoji || '🔱'}
                  </div>
                ) : (
                  <div className="player-avatar">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.first_name} />
                    ) : (
                      <span>{item.first_name?.[0]?.toUpperCase() || '👤'}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="top-info">
                <div className="top-name">
                  {activeTab === 'unions' ? item.name : (
                    <>
                      {item.first_name} {item.last_name || ''}
                      {item.username && <span className="rating-username">@{item.username}</span>}
                    </>
                  )}
                </div>
                {activeTab === 'players' && item.level && (
                  <div className="top-level">⭐ Уровень {item.level}</div>
                )}
                {activeTab === 'unions' && item.members && (
                  <div className="top-members">👥 {item.members.toLocaleString()} участников</div>
                )}
              </div>
              <div className="top-score">
                <div className="score-value">
                  {activeTab === 'unions'
                    ? item.score?.toLocaleString()
                    : item.total_earned?.toLocaleString() || 0}
                </div>
                <div className="score-label">💰 монет</div>
              </div>
              <div className="top-glow"></div>
            </div>
          ))}

          {/* Остальные игроки */}
          {currentData.slice(3).map((item, index) => (
            <div
              key={item.id}
              className="rating-item"
            >
              <div className="rating-rank">
                <span className="rank-number">#{index + 4}</span>
              </div>

              <div className="rating-info">
                {activeTab === 'unions' && item.logo_emoji && (
                  <div className="rating-union-logo" style={{ background: item.logo_color || '#667eea' }}>
                    {item.logo_emoji}
                  </div>
                )}
                {activeTab === 'players' && (
                  <div className="rating-player-avatar">
                    {item.photo_url ? (
                      <img src={item.photo_url} alt={item.first_name} />
                    ) : (
                      <span>{item.first_name?.[0]?.toUpperCase() || '👤'}</span>
                    )}
                  </div>
                )}
                <div className="rating-name">
                  {activeTab === 'unions' ? item.name : (
                    <>
                      {item.first_name} {item.last_name || ''}
                      {item.username && <span className="rating-username">@{item.username}</span>}
                    </>
                  )}
                </div>
                {activeTab === 'players' && item.level && (
                  <div className="rating-level">Ур. {item.level}</div>
                )}
                {activeTab === 'unions' && item.members && (
                  <div className="rating-members">👥 {item.members.toLocaleString()}</div>
                )}
              </div>

              <div className="rating-score">
                {activeTab === 'unions'
                  ? `${item.score?.toLocaleString() || 0} 💰`
                  : `${item.total_earned?.toLocaleString() || 0} 💰`}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rating-footer">
        <p>📊 Обновляется каждые 60 секунд</p>
        {timeUntilUpdate <= 10 && (
          <p className="update-soon">Обновление через {timeUntilUpdate}с...</p>
        )}
      </div>
    </div>
  );
};

export default Rating;
