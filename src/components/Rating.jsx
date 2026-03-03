import { useState } from 'react';
import './Rating.css';

const Rating = () => {
  const [activeTab, setActiveTab] = useState('unions');

  // Рейтинги будут загружаться с бэкенда
  const unionsRating = [];
  const playersRating = [];

  const getRankStyle = (rank) => {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    return '';
  };

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

      {currentData.length === 0 ? (
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
              key={index}
              className={`rating-item ${getRankStyle(item.rank)}`}
            >
              <div className="rating-rank">
                <span className={`rank-number ${getRankStyle(item.rank)}`}>
                  {item.rank === 1 ? '🥇' : item.rank === 2 ? '🥈' : item.rank === 3 ? '🥉' : item.rank}
                </span>
                {getChangeIcon(item.change)}
              </div>

              <div className="rating-info">
                <div className="rating-name">{item.name}</div>
                {item.union && <div className="rating-union">{item.union}</div>}
                {item.members && <div className="rating-members">👥 {item.members.toLocaleString()}</div>}
              </div>

              <div className="rating-score">
                {item.score.toLocaleString()} 💰
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rating-footer">
        <p>📊 Обновляется каждые 24 часа</p>
      </div>
    </div>
  );
};

export default Rating;
