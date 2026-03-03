import { useState, useEffect } from 'react';
import './Union.css';

const Union = ({ score }) => {
  const [myUnion, setMyUnion] = useState(() => {
    const saved = localStorage.getItem('clicker_my_union');
    return saved ? JSON.parse(saved) : null;
  });

  const [unions, setUnions] = useState(() => {
    const saved = localStorage.getItem('clicker_unions');
    return saved ? JSON.parse(saved) : [];
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [unionName, setUnionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const [timeUntilUpdate, setTimeUntilUpdate] = useState(60);

  // Инициализация союзов при первом запуске
  useEffect(() => {
    if (unions.length === 0) {
      // Пустой массив - союзы создаются игроками
    }
  }, []);

  // Сохранение моего союза
  useEffect(() => {
    localStorage.setItem('clicker_my_union', JSON.stringify(myUnion));
  }, [myUnion]);

  // Сохранение всех союзов
  useEffect(() => {
    localStorage.setItem('clicker_unions', JSON.stringify(unions));
  }, [unions]);

  // Обновление рейтинга каждые 60 секунд
  useEffect(() => {
    const updateRating = () => {
      setLastUpdate(Date.now());
      setTimeUntilUpdate(60);
    };

    // Таймер обратного отсчета
    const countdownInterval = setInterval(() => {
      setTimeUntilUpdate(prev => {
        if (prev <= 1) {
          updateRating();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  const createUnion = () => {
    if (score < 5000) {
      alert('❌ Нужно минимум 5000 монет для создания союза!');
      return;
    }
    if (unionName.length < 3) {
      alert('❌ Название должно быть не менее 3 символов!');
      return;
    }

    const newUnion = {
      id: Date.now(),
      name: unionName,
      code: Math.floor(100000 + Math.random() * 900000).toString(),
      members: 1,
      score: 0,
      description: 'Новый перспективный союз',
      role: 'Создатель',
      createdAt: Date.now(),
    };

    // Добавляем союз в общий список
    setUnions([...unions, newUnion]);
    setMyUnion(newUnion);
    setShowCreateModal(false);
    setUnionName('');
  };

  const joinUnion = () => {
    if (myUnion) {
      alert('❌ Вы уже состоите в союзе!');
      return;
    }

    // Ищем союз по коду
    const targetUnion = unions.find(u => u.code === joinCode);
    
    if (!targetUnion) {
      alert('❌ Союз с таким кодом не найден! Проверьте код и попробуйте снова.');
      return;
    }

    // Вступаем в союз
    const joinedUnion = {
      ...targetUnion,
      role: 'Участник',
      members: targetUnion.members + 1,
    };

    // Обновляем союз в списке
    setUnions(unions.map(u => 
      u.id === targetUnion.id ? joinedUnion : u
    ));
    
    setMyUnion(joinedUnion);
    setShowJoinModal(false);
    setJoinCode('');
  };

  const leaveUnion = () => {
    if (confirm('Вы уверены, что хотите покинуть союз?')) {
      // Если это создатель - удаляем союз, иначе просто выходим
      if (myUnion.role === 'Создатель') {
        setUnions(unions.filter(u => u.id !== myUnion.id));
      } else {
        // Уменьшаем количество участников
        setUnions(unions.map(u => 
          u.id === myUnion.id ? { ...u, members: Math.max(0, u.members - 1) } : u
        ));
      }
      setMyUnion(null);
    }
  };

  const deleteUnion = () => {
    if (confirm('⚠️ Вы уверены, что хотите удалить союз? Это действие нельзя отменить!')) {
      if (confirm('❗ Все участники союза будут исключены. Продолжить?')) {
        setUnions(unions.filter(u => u.id !== myUnion.id));
        setMyUnion(null);
      }
    }
  };

  // Считаем количество союзов для рейтинга
  const sortedUnions = [...unions].sort((a, b) => b.score - a.score);

  return (
    <div className="union">
      <div className="union-header">
        <h2>🤝 Союзы</h2>
        <p className="union-subtitle">Объединяйся с другими игроками!</p>
      </div>

      {!myUnion ? (
        <>
          <div className="union-actions">
            <button
              className="action-btn create-btn"
              onClick={() => setShowCreateModal(true)}
              disabled={score < 5000}
            >
              <span className="btn-icon">✨</span>
              <div className="btn-text">
                <div>Создать союз</div>
                <small>5000 💰</small>
              </div>
            </button>

            <button
              className="action-btn join-btn"
              onClick={() => setShowJoinModal(true)}
            >
              <span className="btn-icon">🚪</span>
              <div className="btn-text">
                <div>Вступить по коду</div>
                <small>Бесплатно</small>
              </div>
            </button>
          </div>

          <div className="union-info-block">
            <h3>📖 Как это работает?</h3>
            <div className="info-card">
              <div className="info-icon">✨</div>
              <div className="info-text">
                <div className="info-title">Создайте свой союз</div>
                <div className="info-desc">Стоимость создания: 5000 монет. Пригласите друзей и развивайтесь вместе!</div>
              </div>
            </div>
            <div className="info-card">
              <div className="info-icon">🔑</div>
              <div className="info-text">
                <div className="info-title">Вступите по коду</div>
                <div className="info-desc">Получите код приглашения от друга и вступите в его союз бесплатно.</div>
              </div>
            </div>
          </div>

          {/* Рейтинг союзов */}
          {unions.length > 0 && (
            <div className="unions-rating">
              <div className="rating-header-small">
                <h3>🏆 Рейтинг союзов</h3>
                <span className="update-timer">🔄 {timeUntilUpdate}с</span>
              </div>
              <div className="unions-rating-list">
                {sortedUnions.slice(0, 5).map((union, index) => (
                  <div key={union.id} className="rating-item-small">
                    <span className="rating-rank-small">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="rating-name-small">{union.name}</span>
                    <span className="rating-score-small">{union.score.toLocaleString()} 💰</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="my-union">
          {/* Заголовок */}
          <div className="mu-section mu-header-section">
            <div className="mu-header">
              <div className="mu-icon-large">🛡️</div>
              <div className="mu-title">
                <h3 className="mu-name">{myUnion.name}</h3>
                <div className="mu-role-badge">{myUnion.role}</div>
              </div>
            </div>
            <div className="mu-code-block">
              <span className="mu-code-label">Код приглашения:</span>
              <span className="mu-code-value">{myUnion.code}</span>
              <button 
                className="copy-code-btn"
                onClick={() => {
                  navigator.clipboard.writeText(myUnion.code);
                  alert('✅ Код скопирован!');
                }}
              >
                📋
              </button>
            </div>
          </div>

          {/* Статистика */}
          <div className="mu-section mu-stats-section">
            <h4 className="mu-section-title">📊 Статистика союза</h4>
            <div className="mu-stats-grid">
              <div className="mu-stat-card">
                <span className="mu-stat-icon">👥</span>
                <span className="mu-stat-value">{myUnion.members}</span>
                <span className="mu-stat-label">Участников</span>
              </div>
              <div className="mu-stat-card">
                <span className="mu-stat-icon">💰</span>
                <span className="mu-stat-value">{myUnion.score.toLocaleString()}</span>
                <span className="mu-stat-label">Очки союза</span>
              </div>
              <div className="mu-stat-card">
                <span className="mu-stat-icon">📅</span>
                <span className="mu-stat-value">
                  {new Date(myUnion.createdAt || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                </span>
                <span className="mu-stat-label">Создан</span>
              </div>
            </div>
          </div>

          {/* Задачи */}
          <div className="mu-section mu-tasks-section">
            <h4 className="mu-section-title">📌 Задачи союза</h4>
            <div className="mu-tasks-list">
              <div className="mu-task-item">
                <span className="mu-task-icon">👆</span>
                <div className="mu-task-info">
                  <div className="mu-task-name">Сделать 100 кликов</div>
                  <div className="mu-task-progress">
                    <div className="mu-task-bar">
                      <div className="mu-task-fill" style={{ width: '65%' }}></div>
                    </div>
                    <span className="mu-task-percent">65%</span>
                  </div>
                </div>
              </div>
              <div className="mu-task-item">
                <span className="mu-task-icon">💎</span>
                <div className="mu-task-info">
                  <div className="mu-task-name">Заработать 50,000 монет</div>
                  <div className="mu-task-progress">
                    <div className="mu-task-bar">
                      <div className="mu-task-fill" style={{ width: '30%' }}></div>
                    </div>
                    <span className="mu-task-percent">30%</span>
                  </div>
                </div>
              </div>
              <div className="mu-task-item">
                <span className="mu-task-icon">🎯</span>
                <div className="mu-task-info">
                  <div className="mu-task-name">Привлечь 5 участников</div>
                  <div className="mu-task-progress">
                    <div className="mu-task-bar">
                      <div className="mu-task-fill" style={{ width: `${Math.min((myUnion.members / 5) * 100, 100)}%` }}></div>
                    </div>
                    <span className="mu-task-percent">{Math.min((myUnion.members / 5) * 100, 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="mu-actions">
            {myUnion.role === 'Создатель' ? (
              <button className="mu-btn mu-btn-danger" onClick={deleteUnion}>
                🗑️ Удалить союз
              </button>
            ) : (
              <button className="mu-btn mu-btn-secondary" onClick={leaveUnion}>
                🚪 Покинуть союз
              </button>
            )}
          </div>
        </div>
      )}

      {/* Модальное создание союза */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>✨ Создать союз</h3>
            <input
              type="text"
              placeholder="Название союза"
              value={unionName}
              onChange={e => setUnionName(e.target.value)}
              maxLength={20}
              className="modal-input"
            />
            <div className="modal-cost">💰 5000 монет</div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowCreateModal(false)}>
                Отмена
              </button>
              <button className="modal-confirm" onClick={createUnion}>
                Создать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное вступление */}
      {showJoinModal && (
        <div className="modal-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>🚪 Вступить в союз</h3>
            <input
              type="text"
              placeholder="Код приглашения"
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              maxLength={6}
              className="modal-input"
            />
            <div className="modal-hint">Введите код, который вам дал создатель союза</div>
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowJoinModal(false)}>
                Отмена
              </button>
              <button className="modal-confirm" onClick={joinUnion} disabled={joinCode.length < 6}>
                Вступить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Union;
