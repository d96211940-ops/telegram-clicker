import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Cards.css';

const Cards = ({ score, onScoreUpdate, telegramUser }) => {
  const [ownedCards, setOwnedCards] = useState(() => {
    const saved = localStorage.getItem('clicker_owned_cards');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeCards, setActiveCards] = useState(() => {
    const saved = localStorage.getItem('clicker_active_cards');
    return saved ? JSON.parse(saved) : [];
  });

  const [boosts, setBoosts] = useState({
    clickPower: 0,
    energyRegen: 0,
    maxEnergy: 0,
    scoreMultiplier: 1,
  });

  const cards = [
    { 
      id: 1, 
      name: '💪 Бустер Силы', 
      description: '+1 к силе клика',
      price: 500, 
      type: 'clickPower',
      value: 1,
      icon: '💪',
      rarity: 'common'
    },
    { 
      id: 2, 
      name: '⚡ Энерджайзер', 
      description: '+2 к регенерации энергии',
      price: 800, 
      type: 'energyRegen',
      value: 2,
      icon: '⚡',
      rarity: 'common'
    },
    { 
      id: 3, 
      name: '🔋 Мощный Аккумулятор', 
      description: '+500 к макс. энергии',
      price: 1000, 
      type: 'maxEnergy',
      value: 500,
      icon: '🔋',
      rarity: 'rare'
    },
    { 
      id: 4, 
      name: '💎 Кристалл Удачи', 
      description: '+10% к заработку',
      price: 2500, 
      type: 'scoreMultiplier',
      value: 0.1,
      icon: '💎',
      rarity: 'epic'
    },
    { 
      id: 5, 
      name: '🚀 Ракетный Ускоритель', 
      description: '+5 к силе клика',
      price: 5000, 
      type: 'clickPower',
      value: 5,
      icon: '🚀',
      rarity: 'epic'
    },
    { 
      id: 6, 
      name: '👑 Корона Чемпиона', 
      description: '+25% к заработку',
      price: 15000, 
      type: 'scoreMultiplier',
      value: 0.25,
      icon: '👑',
      rarity: 'legendary'
    },
    { 
      id: 7, 
      name: '🌟 Звёздная Пыль', 
      description: '+10 к регенерации',
      price: 8000, 
      type: 'energyRegen',
      value: 10,
      icon: '🌟',
      rarity: 'legendary'
    },
    { 
      id: 8, 
      name: '🔮 Магическая Сфера', 
      description: '+2000 к макс. энергии',
      price: 12000, 
      type: 'maxEnergy',
      value: 2000,
      icon: '🔮',
      rarity: 'epic'
    },
  ];

  useEffect(() => {
    localStorage.setItem('clicker_owned_cards', JSON.stringify(ownedCards));
    localStorage.setItem('clicker_active_cards', JSON.stringify(activeCards));
  }, [ownedCards, activeCards]);

  useEffect(() => {
    // Пересчитываем все бусты из активных карт
    const newBoosts = {
      clickPower: 0,
      energyRegen: 0,
      maxEnergy: 0,
      scoreMultiplier: 1,
    };

    activeCards.forEach(cardId => {
      const card = cards.find(c => c.id === cardId);
      if (card) {
        newBoosts[card.type] += card.value;
      }
    });

    setBoosts(newBoosts);
    
    // Сохраняем бусты для использования в кликере
    localStorage.setItem('clicker_boosts', JSON.stringify(newBoosts));
  }, [activeCards]);

  const buyCard = async (card) => {
    if (score < card.price) {
      alert('❌ Недостаточно монет!');
      return;
    }
    if (ownedCards.includes(card.id)) {
      alert('❌ Эта карта уже у вас есть!');
      return;
    }

    try {
      // Списываем монеты
      const newScore = score - card.price;
      localStorage.setItem('clicker_score', newScore.toString());
      
      // Обновляем в Supabase
      if (telegramUser?.id) {
        await supabase
          .from('players')
          .update({ 
            score: newScore,
            updated_at: new Date().toISOString()
          })
          .eq('id', telegramUser.id.toString());
      }
      
      // Покупаем карту
      onScoreUpdate(newScore);
      setOwnedCards([...ownedCards, card.id]);
      
      alert(`✅ Карта "${card.name}" куплена!`);
    } catch (error) {
      console.error('Ошибка покупки карты:', error);
      alert('❌ Ошибка при покупке карты: ' + error.message);
    }
  };

  const toggleCard = (cardId) => {
    if (!ownedCards.includes(cardId)) {
      alert('❌ Сначала купите эту карту!');
      return;
    }
    
    if (activeCards.includes(cardId)) {
      setActiveCards(activeCards.filter(id => id !== cardId));
    } else {
      setActiveCards([...activeCards, cardId]);
    }
  };

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return '#a0a0a0';
      case 'rare': return '#3498db';
      case 'epic': return '#9b59b6';
      case 'legendary': return '#f1c40f';
      default: return '#ffffff';
    }
  };

  const getRarityBorder = (rarity) => {
    switch (rarity) {
      case 'common': return 'rgba(160, 160, 160, 0.3)';
      case 'rare': return 'rgba(52, 152, 219, 0.5)';
      case 'epic': return 'rgba(155, 89, 182, 0.5)';
      case 'legendary': return 'rgba(241, 196, 15, 0.6)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  };

  const totalBoosts = {
    clickPower: boosts.clickPower,
    energyRegen: boosts.energyRegen,
    maxEnergy: boosts.maxEnergy,
    scoreMultiplier: ((boosts.scoreMultiplier - 1) * 100).toFixed(0),
  };

  return (
    <div className="cards">
      <div className="cards-header">
        <h2>🃏 Магазин Карточек</h2>
        <p className="cards-subtitle">Улучшай свои возможности!</p>
      </div>

      <div className="active-boosts">
        <h3>🔥 Активные бусты</h3>
        <div className="boosts-grid">
          <div className="boost-item">
            <span className="boost-icon">💪</span>
            <div>
              <div className="boost-value">+{totalBoosts.clickPower}</div>
              <div className="boost-label">Сила клика</div>
            </div>
          </div>
          <div className="boost-item">
            <span className="boost-icon">⚡</span>
            <div>
              <div className="boost-value">+{totalBoosts.energyRegen}</div>
              <div className="boost-label">Регенерация</div>
            </div>
          </div>
          <div className="boost-item">
            <span className="boost-icon">🔋</span>
            <div>
              <div className="boost-value">+{totalBoosts.maxEnergy}</div>
              <div className="boost-label">Макс. энергия</div>
            </div>
          </div>
          <div className="boost-item">
            <span className="boost-icon">💰</span>
            <div>
              <div className="boost-value">+{totalBoosts.scoreMultiplier}%</div>
              <div className="boost-label">Бонус заработка</div>
            </div>
          </div>
        </div>
      </div>

      <div className="my-cards">
        <h3>📚 Мои карты ({ownedCards.length}/{cards.length})</h3>
        <div className="cards-grid">
          {cards.filter(card => ownedCards.includes(card.id)).map(card => (
            <div 
              key={card.id} 
              className={`card owned ${activeCards.includes(card.id) ? 'active' : ''}`}
              style={{ 
                borderColor: getRarityBorder(card.rarity),
                background: `linear-gradient(135deg, ${getRarityColor(card.rarity)}15 0%, transparent 100%)`
              }}
              onClick={() => toggleCard(card.id)}
            >
              <div className="card-icon">{card.icon}</div>
              <div className="card-name">{card.name}</div>
              <div className="card-description">{card.description}</div>
              <div className="card-status">
                {activeCards.includes(card.id) ? '✅ Активно' : '⏸️ Не активно'}
              </div>
            </div>
          ))}
          {ownedCards.length === 0 && (
            <div className="no-cards">У вас пока нет карт. Купите первую!</div>
          )}
        </div>
      </div>

      <div className="shop">
        <h3>🏪 Магазин</h3>
        <div className="cards-grid">
          {cards.filter(card => !ownedCards.includes(card.id)).map(card => (
            <div 
              key={card.id} 
              className="card shop-card"
              style={{ 
                borderColor: getRarityBorder(card.rarity),
                background: `linear-gradient(135deg, ${getRarityColor(card.rarity)}15 0%, transparent 100%)`
              }}
            >
              <div className="card-header">
                <div className="card-icon">{card.icon}</div>
                <div 
                  className="card-rarity"
                  style={{ color: getRarityColor(card.rarity) }}
                >
                  {card.rarity === 'common' ? 'Обычная' : 
                   card.rarity === 'rare' ? 'Редкая' :
                   card.rarity === 'epic' ? 'Эпическая' : 'Легендарная'}
                </div>
              </div>
              <div className="card-name">{card.name}</div>
              <div className="card-description">{card.description}</div>
              <button 
                className="buy-btn"
                onClick={() => buyCard(card)}
                disabled={score < card.price}
              >
                Купить за {card.price} 💰
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Cards;
