import { useState } from 'react';
import './Rating.css';

const Rating = () => {
  const [activeTab, setActiveTab] = useState('unions');

  const unionsRating = [
    { rank: 1, name: '🚀 Космические Таперы', score: 5000000, members: 1247, change: 0 },
    { rank: 2, name: '💎 Крипто Магнаты', score: 3500000, members: 892, change: 1 },
    { rank: 3, name: '🔥 Огненные Комбо', score: 2100000, members: 654, change: -1 },
    { rank: 4, name: '⚡ Молниеносные', score: 1800000, members: 445, change: 2 },
    { rank: 5, name: '🌟 Звёздная Лига', score: 1200000, members: 321, change: 0 },
    { rank: 6, name: '👑 Короли Клика', score: 980000, members: 287, change: -2 },
    { rank: 7, name: '💫 Галактика', score: 850000, members: 234, change: 3 },
    { rank: 8, name: '🎯 Снайперы', score: 720000, members: 198, change: -1 },
    { rank: 9, name: '🏆 Чемпионы', score: 650000, members: 176, change: 1 },
    { rank: 10, name: '⚛️ Атомы', score: 580000, members: 154, change: -2 },
  ];

  const playersRating = [
    { rank: 1, name: 'AlexKing', score: 15000000, union: '🚀 Космические Таперы', change: 0 },
    { rank: 2, name: 'CryptoMaster', score: 12500000, union: '💎 Крипто Магнаты', change: 0 },
    { rank: 3, name: 'ClickerPro', score: 9800000, union: '🔥 Огненные Комбо', change: 1 },
    { rank: 4, name: 'TapGod', score: 8200000, union: '🚀 Космические Таперы', change: -1 },
    { rank: 5, name: 'MoonWalker', score: 7100000, union: '🌟 Звёздная Лига', change: 2 },
    { rank: 6, name: 'NightHacker', score: 6500000, union: '⚡ Молниеносные', change: 0 },
    { rank: 7, name: 'DiamondHands', score: 5800000, union: '💎 Крипто Магнаты', change: -2 },
    { rank: 8, name: 'ThunderStrike', score: 5200000, union: '👑 Короли Клика', change: 1 },
    { rank: 9, name: 'PhoenixRise', score: 4700000, union: '🔥 Огненные Комбо', change: -1 },
    { rank: 10, name: 'QuantumLeap', score: 4200000, union: '⚛️ Атомы', change: 0 },
  ];

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

      <div className="rating-footer">
        <p>📊 Обновляется каждые 24 часа</p>
      </div>
    </div>
  );
};

export default Rating;
