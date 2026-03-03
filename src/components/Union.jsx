import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import './Union.css';

const Union = ({ score, telegramUser }) => {
  const [myUnion, setMyUnion] = useState(null);
  const [unions, setUnions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [unionName, setUnionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [timeUntilUpdate, setTimeUntilUpdate] = useState(60);

  // Загрузка данных
  useEffect(() => {
    loadUnions();
    if (telegramUser?.id) {
      loadMyUnion(telegramUser.id.toString());
    }
  }, [telegramUser]);

  // Таймер обновления рейтинга
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setTimeUntilUpdate(prev => {
        if (prev <= 1) {
          loadUnions();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Загрузка всех союзов для рейтинга
  const loadUnions = async () => {
    try {
      const { data, error } = await supabase
        .from('unions')
        .select('*')
        .order('score', { ascending: false })
        .limit(100);

      if (error) throw error;
      setUnions(data || []);
    } catch (error) {
      console.error('Ошибка загрузки союзов:', error);
      // Fallback к localStorage если Supabase недоступен
      const saved = localStorage.getItem('clicker_unions');
      if (saved) {
        setUnions(JSON.parse(saved));
      }
    } finally {
      setLoading(false);
    }
  };

  // Загрузка моего союза
  const loadMyUnion = async (userId) => {
    try {
      // Сначала проверяем в union_members
      const { data: memberData, error: memberError } = await supabase
        .from('union_members')
        .select('union_id, role')
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') throw memberError;

      if (memberData) {
        // Получаем данные союза
        const { data: unionData, error: unionError } = await supabase
          .from('unions')
          .select('*')
          .eq('id', memberData.union_id)
          .single();

        if (unionError) throw unionError;

        setMyUnion({
          ...unionData,
          role: memberData.role,
        });
        return;
      }

      // Проверяем, не является ли пользователь владельцем союза
      const { data: ownerData, error: ownerError } = await supabase
        .from('unions')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

      if (ownerData) {
        setMyUnion({
          ...ownerData,
          role: 'Создатель',
        });
      }
    } catch (error) {
      console.error('Ошибка загрузки моего союза:', error);
      // Fallback к localStorage
      const saved = localStorage.getItem('clicker_my_union');
      if (saved) {
        setMyUnion(JSON.parse(saved));
      }
    }
  };

  // Создание союза
  const createUnion = async () => {
    if (score < 5000) {
      alert('❌ Нужно минимум 5000 монет для создания союза!');
      return;
    }
    if (unionName.length < 3) {
      alert('❌ Название должно быть не менее 3 символов!');
      return;
    }

    try {
      setLoading(true);
      const userId = telegramUser?.id?.toString();
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Списываем монеты
      const newScore = score - 5000;
      localStorage.setItem('clicker_score', newScore.toString());
      
      // Обновляем в Supabase
      if (userId) {
        await supabase
          .from('players')
          .update({ 
            score: newScore,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      }

      // Создаём союз в Supabase
      const { data: newUnion, error: unionError } = await supabase
        .from('unions')
        .insert([{
          name: unionName,
          code,
          members: 1,
          score: 0,
          description: 'Новый перспективный союз',
          owner_id: userId,
        }])
        .select()
        .single();

      if (unionError) throw unionError;

      // Добавляем создателя как участника
      const { error: memberError } = await supabase
        .from('union_members')
        .insert([{
          union_id: newUnion.id,
          user_id: userId,
          role: 'Создатель',
        }]);

      if (memberError) throw memberError;

      // Обновляем локальное состояние
      setMyUnion({
        ...newUnion,
        role: 'Создатель',
      });
      setUnions([...unions, newUnion]);

      // Сохраняем в localStorage для кэша
      localStorage.setItem('clicker_my_union', JSON.stringify({
        ...newUnion,
        role: 'Создатель',
      }));
      localStorage.setItem('clicker_unions', JSON.stringify([...unions, newUnion]));

      // Уведомляем родительский компонент об изменении счёта
      window.dispatchEvent(new CustomEvent('score-updated', { detail: newScore }));

      setShowCreateModal(false);
      setUnionName('');
      alert('✅ Союз успешно создан! 5000 💰 списано.');
    } catch (error) {
      console.error('Ошибка создания союза:', error);
      alert('❌ Ошибка при создании союза: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Вступление в союз
  const joinUnion = async () => {
    if (myUnion) {
      alert('❌ Вы уже состоите в союзе!');
      return;
    }

    try {
      setLoading(true);

      // Ищем союз по коду
      const { data: targetUnion, error: findError } = await supabase
        .from('unions')
        .select('*')
        .eq('code', joinCode)
        .single();

      if (findError || !targetUnion) {
        alert('❌ Союз с таким кодом не найден!');
        return;
      }

      const userId = telegramUser?.id?.toString();

      // Добавляем участника
      const { error: memberError } = await supabase
        .from('union_members')
        .insert([{
          union_id: targetUnion.id,
          user_id: userId,
          role: 'Участник',
        }]);

      if (memberError) throw memberError;

      // Обновляем количество участников
      const { data: updatedUnion } = await supabase
        .from('unions')
        .update({ members: targetUnion.members + 1 })
        .eq('id', targetUnion.id)
        .select()
        .single();

      setMyUnion({
        ...updatedUnion,
        role: 'Участник',
      });

      // Обновляем список
      setUnions(unions.map(u => 
        u.id === targetUnion.id ? { ...u, members: u.members + 1 } : u
      ));

      // Кэш в localStorage
      localStorage.setItem('clicker_my_union', JSON.stringify({
        ...updatedUnion,
        role: 'Участник',
      }));

      setShowJoinModal(false);
      setJoinCode('');
    } catch (error) {
      console.error('Ошибка вступления в союз:', error);
      alert('❌ Ошибка при вступлении в союз: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Выход из союза
  const leaveUnion = async () => {
    if (!confirm('Вы уверены, что хотите покинуть союз?')) return;

    try {
      setLoading(true);
      const userId = telegramUser?.id?.toString();

      if (myUnion.role === 'Создатель') {
        // Создатель удаляет союз
        await deleteUnion();
        return;
      }

      // Удаляем участника
      const { error } = await supabase
        .from('union_members')
        .delete()
        .eq('user_id', userId)
        .eq('union_id', myUnion.id);

      if (error) throw error;

      // Уменьшаем счётчик участников
      await supabase
        .from('unions')
        .update({ members: Math.max(0, myUnion.members - 1) })
        .eq('id', myUnion.id);

      setMyUnion(null);
      setUnions(unions.map(u => 
        u.id === myUnion.id ? { ...u, members: Math.max(0, u.members - 1) } : u
      ));

      localStorage.removeItem('clicker_my_union');
    } catch (error) {
      console.error('Ошибка выхода из союза:', error);
      alert('❌ Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Удаление союза (для создателя)
  const deleteUnion = async () => {
    if (!confirm('⚠️ Вы уверены, что хотите удалить союз? Это действие нельзя отменить!')) return;
    if (!confirm('❗ Все участники союза будут исключены. Продолжить?')) return;

    try {
      setLoading(true);

      // Удаляем союз (участники удалятся каскадом)
      const { error } = await supabase
        .from('unions')
        .delete()
        .eq('id', myUnion.id);

      if (error) throw error;

      setMyUnion(null);
      setUnions(unions.filter(u => u.id !== myUnion.id));
      localStorage.removeItem('clicker_my_union');
    } catch (error) {
      console.error('Ошибка удаления союза:', error);
      alert('❌ Ошибка: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

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
              disabled={score < 5000 || loading}
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
              disabled={loading}
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
          {!loading && unions.length > 0 && (
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

          {loading && unions.length === 0 && (
            <div className="loading-text">🔄 Загрузка...</div>
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
                  {new Date(myUnion.created_at || Date.now()).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
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
              <button className="mu-btn mu-btn-danger" onClick={deleteUnion} disabled={loading}>
                {loading ? '⏳...' : '🗑️ Удалить союз'}
              </button>
            ) : (
              <button className="mu-btn mu-btn-secondary" onClick={leaveUnion} disabled={loading}>
                {loading ? '⏳...' : '🚪 Покинуть союз'}
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
              <button className="modal-confirm" onClick={createUnion} disabled={loading}>
                {loading ? '⏳...' : 'Создать'}
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
              <button className="modal-confirm" onClick={joinUnion} disabled={joinCode.length < 6 || loading}>
                {loading ? '⏳...' : 'Вступить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Union;
