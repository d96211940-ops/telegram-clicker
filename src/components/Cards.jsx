import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Cards.css';

const Cards = ({ totalEarned, onScoreUpdate, telegramUser, level }) => {
  const [allCards, setAllCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [showGiftAnimation, setShowGiftAnimation] = useState(false);
  const [giftCard, setGiftCard] = useState(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedCard, setSelectedCard] = useState(null);
  
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

  // Загрузка карт из Supabase
  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('cards')
        .select('*')
        .order('price', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAllCards(data);
      } else {
        // Fallback - используем встроенный массив если БД пустая
        setAllCards(getFallbackCards());
      }
    } catch (error) {
      console.error('Ошибка загрузки карт:', error);
      setAllCards(getFallbackCards());
    } finally {
      setLoading(false);
    }
  };

  // Fallback карты (если БД недоступна)
  const getFallbackCards = () => [
    { id: 1, name: '💪 Маленькая Сила', description: '+1 к силе клика', price: 300, rarity: 'common', type: 'clickPower', value: 1, icon: '💪' },
    { id: 2, name: '⚡ Малая Энергия', description: '+1 к регенерации', price: 350, rarity: 'common', type: 'energyRegen', value: 1, icon: '⚡' },
    { id: 3, name: '🔋 Батарейка', description: '+100 к макс. энергии', price: 400, rarity: 'common', type: 'maxEnergy', value: 100, icon: '🔋' },
    { id: 4, name: '💪 Средняя Сила', description: '+8 к силе клика', price: 2000, rarity: 'rare', type: 'clickPower', value: 8, icon: '💪' },
    { id: 5, name: '⚡ Заряд', description: '+6 к регенерации', price: 2200, rarity: 'rare', type: 'energyRegen', value: 6, icon: '⚡' },
    { id: 6, name: '🚀 Ракетный Двигатель', description: '+20 к силе клика', price: 8000, rarity: 'epic', type: 'clickPower', value: 20, icon: '🚀' },
    { id: 7, name: '👑 Корона Императора', description: '+50 к силе клика', price: 30000, rarity: 'legendary', type: 'clickPower', value: 50, icon: '👑' },
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
      const card = allCards.find(c => c.id === cardId);
      if (card) {
        newBoosts[card.type] += card.value;
      }
    });

    setBoosts(newBoosts);
    
    // Сохраняем бусты для использования в кликере
    localStorage.setItem('clicker_boosts', JSON.stringify(newBoosts));
  }, [activeCards, allCards]);

  const handleBuyClick = (card) => {
    setSelectedCard(card);
    setShowPurchaseModal(true);
  };

  const buyCard = async () => {
    const card = selectedCard;
    if (totalEarned < card.price) {
      alert('❌ Недостаточно монет!');
      return;
    }
    if (ownedCards.includes(card.id)) {
      alert('❌ Эта карта уже у вас есть!');
      return;
    }

    // Проверка условия покупки (требуемая карта)
    if (card.requires_card_id && !ownedCards.includes(card.requires_card_id)) {
      const requiredCard = allCards.find(c => c.id === card.requires_card_id);
      if (requiredCard) {
        alert(`❌ Сначала купите карту "${requiredCard.name}"!`);
        return;
      }
    }

    // Проверка минимального уровня
    if (card.min_level && level < card.min_level) {
      alert(`❌ Нужен ${card.min_level} уровень для покупки!`);
      return;
    }

    try {
      // Списываем монеты
      const newTotalEarned = totalEarned - card.price;
      localStorage.setItem('clicker_total_earned', newTotalEarned.toString());

      // Обновляем в Supabase
      if (telegramUser?.id) {
        await supabase
          .from('players')
          .update({
            total_earned: newTotalEarned,
            updated_at: new Date().toISOString()
          })
          .eq('id', telegramUser.id.toString());
      }

      // Покупаем карту
      onScoreUpdate(newTotalEarned);
      setOwnedCards([...ownedCards, card.id]);
      
      // Показываем анимацию подарка
      setGiftCard(card);
      setShowGiftAnimation(true);
      setTimeout(() => {
        setShowGiftAnimation(false);
        setGiftCard(null);
      }, 2500);
      
      setShowPurchaseModal(false);
      setSelectedCard(null);
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
      // Деактивируем
      setActiveCards(activeCards.filter(id => id !== cardId));
    } else {
      // Проверяем лимит
      if (activeCards.length >= 4) {
        alert('❌ Максимум 4 активные карты! Деактивируйте одну из них.');
        return;
      }
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

  const getRarityName = (rarity) => {
    switch (rarity) {
      case 'common': return 'Обычная';
      case 'rare': return 'Редкая';
      case 'epic': return 'Эпическая';
      case 'legendary': return 'Легендарная';
      default: return rarity;
    }
  };

  const totalBoosts = {
    clickPower: boosts.clickPower,
    energyRegen: boosts.energyRegen,
    maxEnergy: boosts.maxEnergy,
    scoreMultiplier: ((boosts.scoreMultiplier - 1) * 100).toFixed(0),
  };

  // Фильтрация карт
  const filteredCards = activeFilter === 'all' 
    ? allCards 
    : allCards.filter(card => card.rarity === activeFilter);

  const ownedFilteredCards = filteredCards.filter(card => ownedCards.includes(card.id));
  const shopFilteredCards = filteredCards.filter(card => !ownedCards.includes(card.id));

  return (
    <div className="cards">
      {/* Анимация подарка */}
      {showGiftAnimation && giftCard && (
        <div className="gift-animation">
          <div className="gift-container">
            <div className="gift-box">
              <div className="gift-lid"></div>
              <div className="gift-body">
                <span className="gift-icon">{giftCard.icon}</span>
              </div>
            </div>
            <div className="gift-sparkles">
              <span>✨</span><span>⭐</span><span>💫</span><span>🌟</span><span>✨</span>
            </div>
            <div className="gift-text">
              <div className="gift-title">Получено!</div>
              <div className="gift-name">{giftCard.name}</div>
            </div>
          </div>
        </div>
      )}

      <div className="cards-header">
        <h2>🃏 Магазин Карточек</h2>
        <p className="cards-subtitle">Улучшай свои возможности!</p>
      </div>

      {/* Фильтры */}
      <div className="cards-filters">
        <button 
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
        >
          Все
        </button>
        <button 
          className={`filter-btn common ${activeFilter === 'common' ? 'active' : ''}`}
          onClick={() => setActiveFilter('common')}
        >
          🟤 Обычные
        </button>
        <button 
          className={`filter-btn rare ${activeFilter === 'rare' ? 'active' : ''}`}
          onClick={() => setActiveFilter('rare')}
        >
          🔵 Редкие
        </button>
        <button 
          className={`filter-btn epic ${activeFilter === 'epic' ? 'active' : ''}`}
          onClick={() => setActiveFilter('epic')}
        >
          🟣 Эпические
        </button>
        <button 
          className={`filter-btn legendary ${activeFilter === 'legendary' ? 'active' : ''}`}
          onClick={() => setActiveFilter('legendary')}
        >
          🟡 Легендарные
        </button>
      </div>

      <div className="active-boosts">
        <h3>🔥 Активные бусты ({activeCards.length}/4)</h3>
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
        <h3>📚 Мои карты ({ownedCards.length}/{allCards.length})</h3>
        {loading ? (
          <div className="cards-loading">🔄 Загрузка карт...</div>
        ) : ownedFilteredCards.length > 0 ? (
          <div className="cards-grid">
            {ownedFilteredCards.map(card => (
              <div
                key={card.id}
                className={`card owned ${activeCards.includes(card.id) ? 'active' : ''}`}
                data-rarity={card.rarity}
                style={{
                  borderColor: getRarityBorder(card.rarity),
                  background: `linear-gradient(135deg, ${getRarityColor(card.rarity)}15 0%, transparent 100%)`
                }}
                onClick={() => toggleCard(card.id)}
              >
                <div className="card-icon">{card.icon}</div>
                <div className="card-name">{card.name}</div>
                <div className="card-description">{card.description}</div>
                <div 
                  className="card-rarity-badge"
                  style={{ background: getRarityColor(card.rarity) }}
                >
                  {getRarityName(card.rarity)}
                </div>
                <div className="card-status">
                  {activeCards.includes(card.id) ? '✅ Активно' : '⏸️ Не активно'}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-cards">У вас пока нет карт этой редкости. Купите первую!</div>
        )}
      </div>

      <div className="shop">
        <h3>🏪 Магазин</h3>
        {shopFilteredCards.length > 0 ? (
          <div className="cards-grid">
            {shopFilteredCards.map(card => {
              const hasRequiredCard = !card.requires_card_id || ownedCards.includes(card.requires_card_id);
              const hasMinLevel = !card.min_level || level >= card.min_level;
              const canBuy = hasRequiredCard && hasMinLevel;
              const requiredCard = card.requires_card_id ? allCards.find(c => c.id === card.requires_card_id) : null;

              return (
                <div
                  key={card.id}
                  className="card shop-card"
                  data-rarity={card.rarity}
                  style={{
                    borderColor: getRarityBorder(card.rarity),
                    background: `linear-gradient(135deg, ${getRarityColor(card.rarity)}15 0%, transparent 100%)`,
                    opacity: canBuy ? 1 : 0.6
                  }}
                >
                  <div className="card-header">
                    <div className="card-icon">{card.icon}</div>
                    <div
                      className="card-rarity-badge"
                      style={{ background: getRarityColor(card.rarity) }}
                    >
                      {getRarityName(card.rarity)}
                    </div>
                  </div>
                  <div className="card-name">{card.name}</div>
                  <div className="card-description">{card.description}</div>
                  
                  {!canBuy && (
                    <div className="card-requirements">
                      {requiredCard && !hasRequiredCard && (
                        <div className="requirement-item">
                          <span>🔒 Требуется: {requiredCard.name}</span>
                        </div>
                      )}
                      {card.min_level && !hasMinLevel && (
                        <div className="requirement-item">
                          <span>🔒 Нужен {card.min_level} ур.</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <button
                    className="buy-btn"
                    onClick={() => handleBuyClick(card)}
                    disabled={totalEarned < card.price || !canBuy}
                  >
                    {canBuy ? `Купить за ${card.price.toLocaleString()} 💰` : '🔒 Заблокировано'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="no-cards">В этой категории все карты куплены!</div>
        )}
      </div>

      {/* Модальное окно покупки */}
      {showPurchaseModal && selectedCard && (
        <div className="modal-overlay" onClick={() => setShowPurchaseModal(false)}>
          <div className="modal purchase-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-gift-icon">{selectedCard.icon}</div>
            <h3>Получить карту?</h3>
            <div 
              className="modal-card-preview"
              style={{ borderColor: getRarityBorder(selectedCard.rarity) }}
            >
              <div className="modal-card-name" style={{ color: getRarityColor(selectedCard.rarity) }}>
                {selectedCard.name}
              </div>
              <div className="modal-card-desc">{selectedCard.description}</div>
              <div 
                className="modal-card-rarity"
                style={{ background: getRarityColor(selectedCard.rarity) }}
              >
                {getRarityName(selectedCard.rarity)}
              </div>
            </div>
            <div className="modal-cost">💰 {selectedCard.price.toLocaleString()} монет</div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowPurchaseModal(false)}>
                Отмена
              </button>
              <button className="modal-confirm buy" onClick={buyCard} disabled={totalEarned < selectedCard.price}>
                Купить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cards;
