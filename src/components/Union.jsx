import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabase';
import './Union.css';

const LOGO_EMOJIS = ['🔱', '🔆', '⚜', '🎮', '🐣', '🕷', '🐢', '🐍', '🦊', '💫', '⭐', '☀', '⛅', '⚡', '☃'];
const LOGO_COLORS = [
  { name: 'Синий', value: '#667eea' },
  { name: 'Фиолетовый', value: '#764ba2' },
  { name: 'Красный', value: '#e74c3c' },
  { name: 'Зелёный', value: '#27ae60' },
  { name: 'Оранжевый', value: '#f39c12' },
  { name: 'Золотой', value: '#f1c40f' },
  { name: 'Розовый', value: '#e84393' },
  { name: 'Голубой', value: '#00d2d3' },
];

// Функция для красивого форматирования чисел (1к, 1м, 1млрд)
const formatNumber = (num) => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'млрд';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'м';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'к';
  }
  return num.toLocaleString();
};

const Union = ({ totalEarned, telegramUser, addToast }) => {
  const [myUnion, setMyUnion] = useState(null);
  const [unions, setUnions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [unionName, setUnionName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [selectedLogo, setSelectedLogo] = useState('🔱');
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [unionMembers, setUnionMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [showMemberActions, setShowMemberActions] = useState(false);
  const [refreshingCode, setRefreshingCode] = useState(false);

  // Функция для расчёта score союза на основе участников
  const calculateUnionScore = async (unionId) => {
    try {
      const { data: members } = await supabase
        .from('union_members')
        .select('user_id')
        .eq('union_id', unionId);

      if (!members || members.length === 0) {
        return 0;
      }

      const userIds = members.map(m => m.user_id);
      const { data: players } = await supabase
        .from('players')
        .select('id, total_earned')
        .in('id', userIds);

      return (players || []).reduce(
        (sum, player) => sum + (player.total_earned || 0),
        0
      );
    } catch (err) {
      console.warn('Ошибка расчёта score:', err);
      return 0;
    }
  };

  // Ref для актуального значения myUnion
  const myUnionRef = useRef(myUnion);
  useEffect(() => {
    myUnionRef.current = myUnion;
  }, [myUnion]);

  // Обновление score союза при кликах игрока
  useEffect(() => {
    const handleScoreUpdate = async (event) => {
      const { totalEarned } = event.detail || {};
      if (!myUnionRef.current?.id || totalEarned === undefined) return;

      try {
        // Пересчитываем score союза
        const newScore = await calculateUnionScore(myUnionRef.current.id);

        // Обновляем локальное состояние
        setMyUnion(prev => prev ? { ...prev, score: newScore } : null);

        // Обновляем в списке союзов
        setUnions(prev =>
          prev.map(u =>
            u.id === myUnionRef.current.id ? { ...u, score: newScore } : u
          )
        );

        // Обновляем localStorage
        const updatedUnion = { ...myUnionRef.current, score: newScore };
        localStorage.setItem('clicker_my_union', JSON.stringify(updatedUnion));
      } catch (error) {
        console.warn('Ошибка обновления score союза:', error);
      }
    };

    window.addEventListener('score-updated', handleScoreUpdate);
    return () => window.removeEventListener('score-updated', handleScoreUpdate);
  }, []);

  // Загрузка данных
  useEffect(() => {
    loadUnions();
    if (telegramUser?.id) {
      loadMyUnion(telegramUser.id.toString());
    }
  }, [telegramUser]);

  // Загрузка всех союзов для рейтинга с динамическим расчётом score
  const loadUnions = async () => {
    try {
      // Загружаем все союзы
      const { data: unionsData, error } = await supabase
        .from('unions')
        .select('*')
        .order('name', { ascending: true })
        .limit(100);

      if (error) throw error;

      // Для каждого союза получаем участников и их total_earned
      const unionsWithScore = await Promise.all(
        (unionsData || []).map(async (union) => {
          try {
            // Получаем всех участников союза
            const { data: members } = await supabase
              .from('union_members')
              .select('user_id')
              .eq('union_id', union.id);

            if (!members || members.length === 0) {
              return { ...union, score: 0 };
            }

            // Получаем total_earned для каждого участника
            const userIds = members.map(m => m.user_id);
            const { data: players } = await supabase
              .from('players')
              .select('id, total_earned')
              .in('id', userIds);

            // Суммируем total_earned всех участников
            const totalScore = (players || []).reduce(
              (sum, player) => sum + (player.total_earned || 0),
              0
            );

            return { ...union, score: totalScore };
          } catch (err) {
            console.warn('Ошибка расчёта score для союза:', union.id, err);
            return { ...union, score: union.score || 0 };
          }
        })
      );

      // Сортируем по score (от большего к меньшему)
      const sortedUnions = unionsWithScore.sort((a, b) => b.score - a.score);
      setUnions(sortedUnions);
    } catch (error) {
      console.error('Ошибка загрузки союзов:', error);
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
      // СНАЧАЛА проверяем БД - игрок может быть кикнут или вышел
      const { data: memberData, error: memberError } = await supabase
        .from('union_members')
        .select('union_id, role, total_contributed')
        .eq('user_id', userId)
        .single();

      if (memberError && memberError.code !== 'PGRST116') {
        console.warn('Ошибка загрузки участника:', memberError);
      }

      if (memberData) {
        // Игрок состоит в союзе - загружаем данные
        const { data: unionData, error: unionError } = await supabase
          .from('unions')
          .select('*')
          .eq('id', memberData.union_id)
          .single();

        if (unionError) {
          console.warn('Ошибка загрузки союза:', unionError);
          return;
        }

        // Рассчитываем актуальный score на основе участников
        const actualScore = await calculateUnionScore(memberData.union_id);

        const unionWithRole = {
          ...unionData,
          score: actualScore,
          role: memberData.role,
          total_contributed: memberData.total_contributed,
        };
        setMyUnion(unionWithRole);
        localStorage.setItem('clicker_my_union', JSON.stringify(unionWithRole));
        return;
      }

      // Проверяем, не является ли пользователь владельцем союза
      const { data: ownerData, error: ownerError } = await supabase
        .from('unions')
        .select('*')
        .eq('owner_id', userId)
        .single();

      if (ownerError && ownerError.code !== 'PGRST116') {
        console.warn('Ошибка загрузки владельца:', ownerError);
      }

      if (ownerData) {
        // Рассчитываем актуальный score на основе участников
        const actualScore = await calculateUnionScore(ownerData.id);

        const unionWithRole = {
          ...ownerData,
          score: actualScore,
          role: 'owner',
          total_contributed: 0,
        };
        setMyUnion(unionWithRole);
        localStorage.setItem('clicker_my_union', JSON.stringify(unionWithRole));
        return;
      }
      
      // Игрок НЕ состоит ни в каком союзе - очищаем localStorage
      setMyUnion(null);
      localStorage.removeItem('clicker_my_union');
      
    } catch (error) {
      console.error('Ошибка загрузки моего союза:', error);
      // При ошибке всё равно пытаемся получить актуальные данные из БД
      // Не используем старый localStorage чтобы избежать бага
      setMyUnion(null);
      localStorage.removeItem('clicker_my_union');
    }
  };

  // Создание союза
  const createUnion = async () => {
    // Проверка: уже создаём союз
    if (loading) {
      return;
    }
    
    // Проверка: уже есть союз
    if (myUnion) {
      if (addToast) addToast('❌ Вы уже состоите в союзе!', 'error');
      return;
    }
    
    if (totalEarned < 5000) {
      if (addToast) addToast('❌ Нужно минимум 5000 монет!', 'error');
      return;
    }
    if (unionName.length < 3) {
      if (addToast) addToast('❌ Название должно быть не менее 3 символов!', 'error');
      return;
    }

    try {
      setLoading(true);
      const userId = telegramUser?.id?.toString();
      
      // Проверка: нет ли союза с таким названием
      const { data: existingUnion } = await supabase
        .from('unions')
        .select('id, name')
        .ilike('name', unionName.trim())
        .single();
      
      if (existingUnion) {
        if (addToast) addToast(`❌ Союз с названием "${unionName}" уже существует!`, 'error');
        setLoading(false);
        return;
      }
      
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const newTotalEarned = totalEarned - 5000;
      
      // Списываем монеты у игрока
      localStorage.setItem('clicker_total_earned', newTotalEarned.toString());

      if (userId) {
        const { error: updateError } = await supabase
          .from('players')
          .update({ total_earned: newTotalEarned, updated_at: new Date().toISOString() })
          .eq('id', userId);
        
        if (updateError) {
          console.error('Ошибка обновления монет:', updateError);
          throw updateError;
        }
      }

      // Создаём союз
      const { data: newUnion, error: unionError } = await supabase
        .from('unions')
        .insert([{
          name: unionName.trim(),
          code,
          members: 1,
          score: 0,
          description: 'Новый перспективный союз',
          owner_id: userId,
          logo_emoji: selectedLogo,
          logo_color: selectedColor,
        }])
        .select()
        .single();

      if (unionError) {
        console.error('Ошибка создания союза:', unionError);
        throw unionError;
      }

      // Добавляем владельца в участники
      const { error: memberError } = await supabase
        .from('union_members')
        .insert([{
          union_id: newUnion.id,
          user_id: userId,
          role: 'owner',
        }]);
      
      if (memberError) {
        console.error('Ошибка добавления участника:', memberError);
        throw memberError;
      }

      // Обновляем состояние
      const unionData = { ...newUnion, role: 'owner', total_contributed: 0 };
      setMyUnion(unionData);
      setUnions(prev => [...prev, newUnion]);
      localStorage.setItem('clicker_my_union', JSON.stringify(unionData));
      localStorage.setItem('clicker_unions', JSON.stringify([...unions, newUnion]));
      localStorage.setItem('clicker_total_earned', newTotalEarned.toString());

      // Уведомляем об обновлении монет
      window.dispatchEvent(new CustomEvent('score-updated', { detail: { totalEarned: newTotalEarned } }));

      setShowCreateModal(false);
      setUnionName('');
      setSelectedLogo('🔱');
      setSelectedColor('#667eea');
      if (addToast) addToast('✅ Союз успешно создан!', 'success');
    } catch (error) {
      console.error('Ошибка создания союза:', error);
      if (addToast) addToast('❌ Ошибка при создании союза: ' + error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Вступление в союз
  const joinUnion = async () => {
    if (myUnion) {
      if (addToast) addToast('❌ Вы уже состоите в союзе!', 'error');
      return;
    }

    try {
      setLoading(true);

      const { data: targetUnion, error: findError } = await supabase
        .from('unions')
        .select('*')
        .eq('code', joinCode)
        .single();

      if (findError || !targetUnion) {
        if (addToast) addToast('❌ Союз с таким кодом не найден!', 'error');
        return;
      }

      const userId = telegramUser?.id?.toString();

      await supabase
        .from('union_members')
        .insert([{
          union_id: targetUnion.id,
          user_id: userId,
          role: 'player',
        }]);

      const { data: updatedUnion } = await supabase
        .from('unions')
        .update({ members: targetUnion.members + 1 })
        .eq('id', targetUnion.id)
        .select()
        .single();

      setMyUnion({ ...updatedUnion, role: 'player', total_contributed: 0 });
      setUnions(unions.map(u => u.id === targetUnion.id ? { ...u, members: u.members + 1 } : u));
      localStorage.setItem('clicker_my_union', JSON.stringify({ ...updatedUnion, role: 'player' }));

      setShowJoinModal(false);
      setJoinCode('');
      if (addToast) addToast(`✅ Вы вступили в союз "${updatedUnion.name}"!`, 'success');
    } catch (error) {
      console.error('Ошибка вступления в союз:', error);
      if (addToast) addToast('❌ Ошибка при вступлении в союз', 'error');
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

      if (myUnion.role === 'owner') {
        await deleteUnion();
        return;
      }

      await supabase
        .from('union_members')
        .delete()
        .eq('user_id', userId)
        .eq('union_id', myUnion.id);

      await supabase
        .from('unions')
        .update({ members: Math.max(0, myUnion.members - 1) })
        .eq('id', myUnion.id);

      setMyUnion(null);
      setUnions(unions.map(u => u.id === myUnion.id ? { ...u, members: Math.max(0, u.members - 1) } : u));
      localStorage.removeItem('clicker_my_union');
      if (addToast) addToast('✅ Вы покинули союз', 'info');
    } catch (error) {
      console.error('Ошибка выхода из союза:', error);
      if (addToast) addToast('❌ Ошибка при выходе из союза', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Удаление союза
  const deleteUnion = async () => {
    if (!confirm('⚠️ Вы уверены, что хотите удалить союз?')) return;
    if (!confirm('❗ Все участники будут исключены. Продолжить?')) return;

    try {
      setLoading(true);

      await supabase
        .from('unions')
        .delete()
        .eq('id', myUnion.id);

      setMyUnion(null);
      setUnions(unions.filter(u => u.id !== myUnion.id));
      localStorage.removeItem('clicker_my_union');
      if (addToast) addToast('✅ Союз удалён', 'info');
    } catch (error) {
      console.error('Ошибка удаления союза:', error);
      if (addToast) addToast('❌ Ошибка при удалении союза', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Загрузка участников союза
  const loadUnionMembers = async () => {
    if (!myUnion?.id) return;

    try {
      // Сначала получаем всех участников
      const { data: members, error: membersError } = await supabase
        .from('union_members')
        .select('user_id, role, joined_at, total_contributed')
        .eq('union_id', myUnion.id);

      if (membersError) throw membersError;

      // Затем получаем данные игроков с total_earned
      const userIds = members.map(m => m.user_id);
      const { data: players, error: playersError } = await supabase
        .from('players')
        .select('id, first_name, username, photo_url, total_earned')
        .in('id', userIds);

      if (playersError) throw playersError;

      // Объединяем данные и сортируем по total_earned (от большего к меньшему)
      const membersWithPlayers = members.map(member => {
        const player = players.find(p => p.id === member.user_id);
        return {
          ...member,
          total_earned: player?.total_earned || 0,
          players: player || { first_name: 'Неизвестный', username: null, photo_url: null }
        };
      }).sort((a, b) => b.total_earned - a.total_earned);

      setUnionMembers(membersWithPlayers);
      setShowMembersModal(true);
    } catch (error) {
      console.error('Ошибка загрузки участников:', error);
      if (addToast) addToast('❌ Не удалось загрузить список участников', 'error');
    }
  };

  // Управление участником
  const handleMemberAction = async (action, member) => {
    try {
      if (action === 'promote') {
        await supabase
          .from('union_members')
          .update({ role: 'admin' })
          .eq('user_id', member.user_id)
          .eq('union_id', myUnion.id);
        
        setUnionMembers(members => members.map(m => 
          m.user_id === member.user_id ? { ...m, role: 'admin' } : m
        ));
        if (addToast) addToast(`✅ ${member.players?.first_name} повышен до офицера`, 'success');
      } else if (action === 'demote') {
        await supabase
          .from('union_members')
          .update({ role: 'player' })
          .eq('user_id', member.user_id)
          .eq('union_id', myUnion.id);
        
        setUnionMembers(members => members.map(m => 
          m.user_id === member.user_id ? { ...m, role: 'player' } : m
        ));
        if (addToast) addToast(`✅ ${member.players?.first_name} понижен до игрока`, 'info');
      } else if (action === 'kick') {
        if (member.role === 'owner') {
          if (addToast) addToast('❌ Нельзя выгнать создателя союза!', 'error');
          return;
        }

        await supabase
          .from('union_members')
          .delete()
          .eq('user_id', member.user_id)
          .eq('union_id', myUnion.id);

        await supabase
          .from('unions')
          .update({ members: Math.max(0, myUnion.members - 1) })
          .eq('id', myUnion.id);

        setUnionMembers(members => members.filter(m => m.user_id !== member.user_id));
        setMyUnion(prev => ({ ...prev, members: prev.members - 1 }));
        if (addToast) addToast(`✅ ${member.players?.first_name} исключён из союза`, 'info');
      }

      setShowMemberActions(false);
      setSelectedMember(null);
    } catch (error) {
      console.error('Ошибка действия с участником:', error);
      if (addToast) addToast('❌ Ошибка при действии с участником', 'error');
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'owner': return 'Создатель';
      case 'admin': return 'Офицер';
      default: return 'Игрок';
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'owner': return '#e74c3c';
      case 'admin': return '#3498db';
      default: return '#6b7280';
    }
  };

  // Обновление кода приглашения
  const refreshInviteCode = async () => {
    if (!myUnion || (myUnion.role !== 'owner' && myUnion.role !== 'admin')) return;
    if (!confirm('Обновить код приглашения? Старый код перестанет работать!')) return;

    try {
      setRefreshingCode(true);
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      await supabase
        .from('unions')
        .update({ code: newCode })
        .eq('id', myUnion.id);

      const updatedUnion = { ...myUnion, code: newCode };
      setMyUnion(updatedUnion);
      localStorage.setItem('clicker_my_union', JSON.stringify(updatedUnion));

      if (addToast) addToast('✅ Код приглашения обновлён!', 'success');
    } catch (error) {
      console.error('Ошибка обновления кода:', error);
      if (addToast) addToast('❌ Не удалось обновить код', 'error');
    } finally {
      setRefreshingCode(false);
    }
  };

  // Получение места союза в рейтинге
  const getUnionRank = () => {
    const currentUnionId = myUnion?.id;
    if (!currentUnionId || unions.length === 0) return null;
    
    const index = unions.findIndex(u => u.id === currentUnionId);
    return index >= 0 ? index + 1 : null;
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
              disabled={totalEarned < 5000 || loading}
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

          {!loading && unions.length > 0 && (
            <div className="unions-rating">
              <div className="rating-header-small">
                <h3>🏆 Рейтинг союзов</h3>
              </div>
              <div className="unions-rating-list">
                {sortedUnions.slice(0, 5).map((union, index) => (
                  <div key={union.id} className="rating-item-small">
                    <span className="rating-rank-small">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </span>
                    <span className="rating-logo-small" style={{ background: union.logo_color || '#667eea' }}>
                      {union.logo_emoji || '🔱'}
                    </span>
                    <span className="rating-name-small">{union.name}</span>
                    <span className="rating-score-small">{union.members} 👥</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="my-union">
          <div className="mu-section mu-header-section">
            <div className="mu-header">
              <div className="mu-logo-large" style={{ background: myUnion.logo_color || '#667eea' }}>
                {myUnion.logo_emoji || '🔱'}
              </div>
              <div className="mu-title">
                <h3 className="mu-name">{myUnion.name}</h3>
                <div className="mu-role-badge" style={{ color: getRoleColor(myUnion.role) }}>
                  {getRoleName(myUnion.role)}
                </div>
              </div>
            </div>
            <div className="mu-code-block">
              <span className="mu-code-label">Код приглашения:</span>
              <span className="mu-code-value">
                {(myUnion.role === 'owner' || myUnion.role === 'admin') 
                  ? myUnion.code 
                  : '******'}
              </span>
              {(myUnion.role === 'owner' || myUnion.role === 'admin') && (
                <>
                  <button
                    className="copy-code-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(myUnion.code);
                      if (addToast) addToast('✅ Код скопирован!', 'success');
                    }}
                  >
                    📋
                  </button>
                  <button
                    className="refresh-code-btn"
                    onClick={refreshInviteCode}
                    disabled={refreshingCode}
                    title="Обновить код"
                  >
                    {refreshingCode ? '⏳' : '🔄'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mu-section mu-stats-section">
            <h4 className="mu-section-title">📊 Статистика союза</h4>
            <div className="mu-stats-grid">
              <div className="mu-stat-card">
                <span className="mu-stat-icon">🏆</span>
                <span className="mu-stat-value">#{getUnionRank() || '...'}</span>
                <span className="mu-stat-label">Место в топе</span>
              </div>
              <div className="mu-stat-card">
                <span className="mu-stat-icon">👥</span>
                <span className="mu-stat-value">{myUnion.members}</span>
                <span className="mu-stat-label">Участников</span>
              </div>
            </div>
          </div>

          <div className="mu-section mu-members-section">
            <h4 className="mu-section-title">
              👥 Участники
              <button className="view-members-btn" onClick={loadUnionMembers}>
                📜 Список
              </button>
            </h4>
          </div>

          <div className="mu-actions">
            {myUnion.role === 'owner' ? (
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
          <div className="modal create-union-modal" onClick={e => e.stopPropagation()}>
            <h3>✨ Создать союз</h3>
            
            <div className="logo-selection">
              <label>Выберите логотип:</label>
              <div className="logo-grid">
                {LOGO_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    className={`logo-option ${selectedLogo === emoji ? 'selected' : ''}`}
                    onClick={() => setSelectedLogo(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="color-selection">
              <label>Выберите цвет:</label>
              <div className="color-grid">
                {LOGO_COLORS.map(color => (
                  <button
                    key={color.value}
                    className={`color-option ${selectedColor === color.value ? 'selected' : ''}`}
                    style={{ background: color.value }}
                    onClick={() => setSelectedColor(color.value)}
                  >
                    {color.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="logo-preview">
              <div className="preview-circle" style={{ background: selectedColor }}>
                <span className="preview-emoji">{selectedLogo}</span>
              </div>
            </div>

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
              onChange={e => setJoinCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="modal-input"
            />
            <div className="modal-actions">
              <button className="modal-cancel" onClick={() => setShowJoinModal(false)}>
                Отмена
              </button>
              <button className="modal-confirm" onClick={joinUnion} disabled={loading}>
                {loading ? '⏳...' : 'Вступить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное участников */}
      {showMembersModal && (
        <div className="modal-overlay" onClick={() => setShowMembersModal(false)}>
          <div className="modal members-modal" onClick={e => e.stopPropagation()}>
            <h3>👥 Участники союза</h3>
            <div className="members-list">
              {unionMembers.map((member, index) => (
                <div
                  key={member.user_id}
                  className="member-item"
                  onClick={() => {
                    if (myUnion.role === 'owner' || (myUnion.role === 'admin' && member.role !== 'owner')) {
                      setSelectedMember(member);
                      setShowMemberActions(true);
                    }
                  }}
                >
                  <div className="member-rank">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                  </div>
                  <div className="member-avatar">
                    {member.players?.photo_url ? (
                      <img src={member.players.photo_url} alt="" />
                    ) : (
                      <span>{member.players?.first_name?.[0] || '👤'}</span>
                    )}
                  </div>
                  <div className="member-info">
                    <div className="member-name">{member.players?.first_name || 'Игрок'}</div>
                    <div className="member-username">@{member.players?.username || ''}</div>
                  </div>
                  <div className="member-role" style={{ color: getRoleColor(member.role) }}>
                    {getRoleName(member.role)}
                  </div>
                  <div className="member-coins">
                    <span className="coins-icon">💰</span>
                    <span className="coins-value">{formatNumber(member.total_earned)}</span>
                  </div>
                </div>
              ))}
            </div>
            <button className="modal-close-btn" onClick={() => setShowMembersModal(false)}>
              Закрыть
            </button>
          </div>
        </div>
      )}

      {/* Действия с участником */}
      {showMemberActions && selectedMember && (
        <div className="modal-overlay" onClick={() => { setShowMemberActions(false); setSelectedMember(null); }}>
          <div className="modal member-actions-modal" onClick={e => e.stopPropagation()}>
            <h3>Действия с участником</h3>
            <div className="member-name-large">
              {selectedMember.players?.first_name} (@{selectedMember.players?.username})
            </div>
            
            {myUnion.role === 'owner' && selectedMember.role === 'player' && (
              <button
                className="action-btn-modal"
                onClick={() => handleMemberAction('promote', selectedMember)}
              >
                ⬆️ Повысить до офицера
              </button>
            )}
            
            {myUnion.role === 'owner' && selectedMember.role === 'admin' && (
              <button
                className="action-btn-modal"
                onClick={() => handleMemberAction('demote', selectedMember)}
              >
                ⬇️ Понизить до игрока
              </button>
            )}
            
            {selectedMember.role !== 'owner' && (
              <button
                className="action-btn-modal danger"
                onClick={() => handleMemberAction('kick', selectedMember)}
              >
                ❌ Выгнать из союза
              </button>
            )}
            
            <button className="modal-cancel-btn" onClick={() => { setShowMemberActions(false); setSelectedMember(null); }}>
              Отмена
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Union;
