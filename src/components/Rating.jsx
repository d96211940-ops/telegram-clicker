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
        .order('score', { ascending: false })
        .limit(100);

      if (playersError) throw playersError;
      setPlayersRating(playersData || []);
    } catch (error) {
      console.error('Ошибка загрузки рейтинга:', error);
      // Fallback к пустым массивам
      setUnionsRating([]);
      setPlayersRating([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRating();

    // Таймер обновления каждые 60 секунд
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

  const getChangeIcon = (change) => {
    if (change > 0) return <span className="change-up">↑{change}</span>;
    if (change < 0) return <span className="change-down">↓{Math.abs(change)}</span>;
    return <span className="change-same">-</span>;
  };

  const currentData = activeTab === 'unions' ? unionsRating : playersRating;

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
          <div className="loading-icon">🔄</div>
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
          {currentData.map((item, index) => (
            <div
              key={activeTab === 'unions' ? item.id : item.id}
              className={`rating-item ${index < 3 ? `rank-${index + 1}` : ''}`}
            >
              <div className="rating-rank">
                <span className={`rank-number ${index < 3 ? `rank-${index + 1}` : ''}`}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                {getChangeIcon(0)}
              </div>

              <div className="rating-info">
                <div className="rating-name">
                  {activeTab === 'unions' ? item.name : (
                    <>
                      {item.first_name}
                      {item.username && <span className="rating-username">@{item.username}</span>}
                    </>
                  )}
                </div>
                {activeTab === 'players' && item.level && (
                  <div className="rating-level">Уровень {item.level}</div>
                )}
                {activeTab === 'unions' && item.members && (
                  <div className="rating-members">👥 {item.members.toLocaleString()}</div>
                )}
              </div>

              <div className="rating-score">
                {activeTab === 'unions' 
                  ? `${item.score.toLocaleString()} 💰`
                  : `${item.total_clicks?.toLocaleString() || 0} 👆`}
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
