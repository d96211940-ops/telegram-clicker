import { useState, useEffect } from 'react';
import './Union.css';

const Union = ({ score }) => {
  const [myUnion, setMyUnion] = useState(() => {
    const saved = localStorage.getItem('clicker_my_union');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [unionName, setUnionName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    localStorage.setItem('clicker_my_union', JSON.stringify(myUnion));
  }, [myUnion]);

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
    };
    
    setMyUnion(newUnion);
    setShowCreateModal(false);
    setUnionName('');
  };

  const joinUnion = () => {
    if (myUnion) {
      alert('❌ Вы уже состоите в союзе!');
      return;
    }

    // Здесь будет логика поиска по коду (нужен бэкенд)
    alert('🔜 Функция вступления по коду скоро будет доступна!');
    setShowJoinModal(false);
  };

  const leaveUnion = () => {
    if (confirm('Вы уверены, что хотите покинуть союз?')) {
      setMyUnion(null);
    }
  };

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
        </>
      ) : (
        <div className="my-union">
          <div className="my-union-header">
            <div className="my-union-icon">🛡️</div>
            <div>
              <h3 className="my-union-name">{myUnion.name}</h3>
              <div className="my-union-code">Код: <span className="code">{myUnion.code}</span></div>
            </div>
          </div>
          
          <div className="my-union-stats">
            <div className="mu-stat">
              <span className="mu-stat-value">{myUnion.members}</span>
              <span className="mu-stat-label">Участников</span>
            </div>
            <div className="mu-stat">
              <span className="mu-stat-value">{myUnion.score.toLocaleString()}</span>
              <span className="mu-stat-label">Очко союза</span>
            </div>
            <div className="mu-stat">
              <span className="mu-stat-value">{myUnion.role}</span>
              <span className="mu-stat-label">Ваша роль</span>
            </div>
          </div>

          <div className="union-tasks">
            <h4>📌 Задачи союза</h4>
            <div className="task-item">
              <span className="task-icon">👆</span>
              <div className="task-info">
                <div className="task-name">Сделать 100 кликов</div>
                <div className="task-progress">
                  <div className="task-bar">
                    <div className="task-fill" style={{ width: '65%' }}></div>
                  </div>
                  <span className="task-percent">65%</span>
                </div>
              </div>
            </div>
            <div className="task-item">
              <span className="task-icon">💎</span>
              <div className="task-info">
                <div className="task-name">Заработать 50,000 монет</div>
                <div className="task-progress">
                  <div className="task-bar">
                    <div className="task-fill" style={{ width: '30%' }}></div>
                  </div>
                  <span className="task-percent">30%</span>
                </div>
              </div>
            </div>
          </div>

          <button className="leave-union-btn" onClick={leaveUnion}>
            🚪 Покинуть союз
          </button>
        </div>
      )}

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
