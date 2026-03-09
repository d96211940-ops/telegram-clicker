import { useState, useEffect, useCallback } from 'react';
import './Clicker.css';

const Clicker = ({ onScoreUpdate, totalEarned: parentTotalEarned }) => {
  const [totalEarned, setTotalEarned] = useState(0);
  const [energy, setEnergy] = useState(1000);
  const [lastEnergySave, setLastEnergySave] = useState(Date.now());
  const [baseMaxEnergy, setBaseMaxEnergy] = useState(1000);
  const [baseClickPower, setBaseClickPower] = useState(1);
  const [baseEnergyRegen, setBaseEnergyRegen] = useState(3);
  const [boosts, setBoosts] = useState({
    clickPower: 0,
    energyRegen: 0,
    maxEnergy: 0,
    scoreMultiplier: 1,
  });

  const [clicks, setClicks] = useState([]);
  const [totalClicks, setTotalClicks] = useState(0);

  const clickPower = baseClickPower + boosts.clickPower;
  const energyRegen = baseEnergyRegen + boosts.energyRegen;
  const maxEnergy = baseMaxEnergy + boosts.maxEnergy;
  const scoreMultiplier = boosts.scoreMultiplier;

  // Синхронизация с родителем - ТЕПЕРЬ ВСЕГДА БЕРЁМ ИЗ ПРОПСОВ
  useEffect(() => {
    if (parentTotalEarned !== undefined) {
      setTotalEarned(parentTotalEarned);
    }
  }, [parentTotalEarned]);

  // Загрузка бустов
  useEffect(() => {
    const loadBoosts = () => {
      const savedBoosts = localStorage.getItem('clicker_boosts');
      if (savedBoosts) {
        setBoosts(JSON.parse(savedBoosts));
      }
    };
    loadBoosts();
    const checkInterval = setInterval(loadBoosts, 500);
    return () => clearInterval(checkInterval);
  }, []);

  // Загрузка энергии при монтировании
  useEffect(() => {
    const savedEnergy = localStorage.getItem('clicker_energy');
    const savedTime = localStorage.getItem('clicker_energy_time');
    
    if (savedEnergy && savedTime) {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - parseInt(savedTime)) / 1000);
      const savedEnergyValue = parseInt(savedEnergy);
      
      // Восстанавливаем энергию с учётом прошедшего времени
      const recovered = Math.min(savedEnergyValue + (elapsedSeconds * energyRegen), maxEnergy);
      setEnergy(recovered);
      setLastEnergySave(now);
    }
  }, []);

  // Регенерация энергии
  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => {
        const newValue = Math.min(prev + energyRegen, maxEnergy);
        if (newValue !== prev) {
          localStorage.setItem('clicker_energy', newValue.toString());
          localStorage.setItem('clicker_energy_time', Date.now().toString());
        }
        return newValue;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [energyRegen, maxEnergy]);

  // Сохранение энергии при размонтировании
  useEffect(() => {
    return () => {
      localStorage.setItem('clicker_energy', energy.toString());
      localStorage.setItem('clicker_energy_time', Date.now().toString());
    };
  }, [energy]);

  const handleClick = useCallback((e) => {
    if (energy >= clickPower) {
      const now = Date.now();
      setTotalClicks(prev => prev + 1);

      const earned = Math.floor(clickPower * scoreMultiplier);

      const newTotalEarned = totalEarned + earned;
      const newEnergy = energy - clickPower;

      // Обновляем состояние
      setTotalEarned(newTotalEarned);
      setEnergy(newEnergy);

      // Сохраняем энергию
      localStorage.setItem('clicker_energy', newEnergy.toString());
      localStorage.setItem('clicker_energy_time', Date.now().toString());

      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setClicks(prev => [...prev, { id, x, y, value: earned }]);

      setTimeout(() => {
        setClicks(prev => prev.filter(click => click.id !== id));
      }, 1000);

      // Уведомляем родителя - ЭТО ОБНОВИТ ВСЕ КОМПОНЕНТЫ
      onScoreUpdate?.(newTotalEarned);

      // Отправляем событие с приростом для задач
      window.dispatchEvent(new CustomEvent('score-updated', {
        detail: { totalEarned: newTotalEarned, earned }
      }));
    }
  }, [energy, clickPower, scoreMultiplier, totalEarned, onScoreUpdate]);

  const level = Math.floor(totalEarned / 1000) + 1;
  const currentLevelMin = (level - 1) * 1000;
  const nextLevelMin = level * 1000;
  const coinsToNextLevel = Math.max(0, nextLevelMin - totalEarned);
  const progressToNext = Math.min(((totalEarned - currentLevelMin) / 1000) * 100, 100);

  const energyPercent = (energy / maxEnergy) * 100;

  return (
    <div className="clicker-container">
      <div className="clicker-header">
        <div className="score-display">
          <span className="score-icon">💰</span>
          <span className="score-value">{totalEarned.toLocaleString()}</span>
        </div>
        <div className="level-display">
          <span className="level-icon">⭐</span>
          <span>Ур. {level}</span>
        </div>
      </div>

      <div className="level-progress-section">
        <div className="level-progress-text">
          <span>🎯 До {level + 1} ур. осталось: <strong>{coinsToNextLevel.toLocaleString()} 💰</strong></span>
        </div>
        <div className="level-progress-bar">
          <div className="level-progress-fill" style={{ width: `${progressToNext}%` }}></div>
        </div>
      </div>

      <div className="energy-section">
        <div className="energy-bar">
          <div className="energy-fill" style={{ width: `${energyPercent}%` }}>
            <div className="energy-shine"></div>
          </div>
        </div>
        <div className="energy-text">
          ⚡ {energy} / {maxEnergy}
        </div>
      </div>

      <div className="click-area">
        <button
          className="click-button"
          onClick={handleClick}
          disabled={energy < clickPower}
        >
          <div className="button-glow"></div>
          <div className="coin">🪙</div>
          <div className="coin-shine"></div>
          {clicks.map(click => (
            <span
              key={click.id}
              className="click-effect"
              style={{
                left: `${click.x}px`,
                top: `${click.y}px`,
              }}
            >
              +{click.value}
            </span>
          ))}
        </button>
      </div>

      <div className="click-stats">
        <div className="stat-item">
          <span className="stat-label">👆 Сила клика</span>
          <span className="stat-value">{clickPower}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">⚡ Регенерация</span>
          <span className="stat-value">{energyRegen}/сек</span>
        </div>
      </div>

      <div className="info-text">
        💡 <i>Зарабатывай монеты каждым кликом!</i>
      </div>
    </div>
  );
};

export default Clicker;
