import { useState, useEffect, useCallback } from 'react';
import './Clicker.css';

const Clicker = ({ onScoreUpdate, onStatsUpdate }) => {
  const [score, setScore] = useState(() => {
    const saved = localStorage.getItem('clicker_score');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [energy, setEnergy] = useState(() => {
    const saved = localStorage.getItem('clicker_energy');
    return saved ? parseInt(saved, 10) : 1000;
  });

  const [baseMaxEnergy, setBaseMaxEnergy] = useState(() => {
    const saved = localStorage.getItem('clicker_max_energy');
    return saved ? parseInt(saved, 10) : 1000;
  });

  const [baseClickPower, setBaseClickPower] = useState(() => {
    const saved = localStorage.getItem('clicker_power');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [baseEnergyRegen, setBaseEnergyRegen] = useState(() => {
    const saved = localStorage.getItem('clicker_regen');
    return saved ? parseInt(saved, 10) : 3;
  });

  const [boosts, setBoosts] = useState({
    clickPower: 0,
    energyRegen: 0,
    maxEnergy: 0,
    scoreMultiplier: 1,
  });

  const [clicks, setClicks] = useState([]);
  const [combo, setCombo] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [totalClicks, setTotalClicks] = useState(0);
  const [totalEarned, setTotalEarned] = useState(0);

  // Вычисляемые значения с учётом бустов
  const clickPower = baseClickPower + boosts.clickPower;
  const energyRegen = baseEnergyRegen + boosts.energyRegen;
  const maxEnergy = baseMaxEnergy + boosts.maxEnergy;
  const scoreMultiplier = boosts.scoreMultiplier;

  // Восстановление энергии за время отсутствия
  useEffect(() => {
    const lastLogout = parseInt(localStorage.getItem('clicker_last_logout') || '0');
    const now = Date.now();
    
    if (lastLogout > 0) {
      const secondsPassed = Math.floor((now - lastLogout) / 1000);
      
      if (secondsPassed > 0) {
        const savedEnergy = parseInt(localStorage.getItem('clicker_energy') || '0');
        const savedMaxEnergy = parseInt(localStorage.getItem('clicker_max_energy') || '1000');
        const savedRegen = parseInt(localStorage.getItem('clicker_regen') || '3');
        
        // Считаем сколько энергии восстановилось
        const regenAmount = secondsPassed * savedRegen;
        const newEnergy = Math.min(savedEnergy + regenAmount, savedMaxEnergy);
        
        if (newEnergy > savedEnergy) {
          setEnergy(newEnergy);
          console.log(`⚡ Восстановлено ${regenAmount} энергии за ${secondsPassed}с отсутствия`);
        }
      }
    }
    
    // Удаляем метку выхода (игрок зашёл)
    localStorage.removeItem('clicker_last_logout');
  }, []);

  useEffect(() => {
    localStorage.setItem('clicker_score', score.toString());
    localStorage.setItem('clicker_energy', energy.toString());
    localStorage.setItem('clicker_max_energy', baseMaxEnergy.toString());
    localStorage.setItem('clicker_power', baseClickPower.toString());
    localStorage.setItem('clicker_regen', baseEnergyRegen.toString());
    localStorage.setItem('clicker_total_clicks', totalClicks.toString());
    localStorage.setItem('clicker_total_earned', totalEarned.toString());

    onScoreUpdate?.(score);
    onStatsUpdate?.({ totalClicks, totalEarned });
  }, [score, energy, baseMaxEnergy, baseClickPower, baseEnergyRegen, totalClicks, totalEarned]);

  // Загрузка и отслеживание бустов
  useEffect(() => {
    const loadBoosts = () => {
      const savedBoosts = localStorage.getItem('clicker_boosts');
      if (savedBoosts) {
        setBoosts(JSON.parse(savedBoosts));
      }
    };

    // Загружаем при монтировании
    loadBoosts();

    // Проверяем изменения при фокусе
    const handleFocus = () => loadBoosts();
    window.addEventListener('focus', handleFocus);

    // Периодически проверяем изменения
    const checkInterval = setInterval(loadBoosts, 500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(checkInterval);
    };
  }, []);

  useEffect(() => {
    const newLevel = Math.floor(score / 1000) + 1;
    setLevel(newLevel);
  }, [score]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEnergy(prev => Math.min(prev + energyRegen, maxEnergy));
    }, 1000);
    return () => clearInterval(interval);
  }, [energyRegen, maxEnergy]);

  useEffect(() => {
    const comboInterval = setInterval(() => {
      if (Date.now() - lastClickTime > 2000 && combo > 0) {
        setCombo(0);
      }
    }, 500);
    return () => clearInterval(comboInterval);
  }, [lastClickTime, combo]);

  const handleClick = useCallback((e) => {
    if (energy >= clickPower) {
      const now = Date.now();
      const timeDiff = now - lastClickTime;

      let newCombo = combo;
      if (timeDiff < 2000) {
        newCombo = Math.min(combo + 1, 10);
      } else {
        newCombo = 1;
      }
      setCombo(newCombo);
      setLastClickTime(now);
      setTotalClicks(prev => prev + 1);

      const comboMultiplier = 1 + (newCombo * 0.1);
      const earned = Math.floor(clickPower * comboMultiplier * scoreMultiplier);

      setScore(prev => prev + earned);
      setTotalEarned(prev => prev + earned);
      setEnergy(prev => prev - clickPower);

      const rect = e.target.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setClicks(prev => [...prev, { id, x, y, value: earned, combo: newCombo }]);

      setTimeout(() => {
        setClicks(prev => prev.filter(click => click.id !== id));
      }, 1000);
    }
  }, [energy, clickPower, combo, lastClickTime, scoreMultiplier]);

  const energyPercent = (energy / maxEnergy) * 100;
  const comboColors = ['#fff', '#4ade80', '#22d3ee', '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#f1c40f'];

  return (
    <div className="clicker-container">
      <div className="clicker-header">
        <div className="score-display">
          <span className="score-icon">💰</span>
          <span className="score-value">{score.toLocaleString()}</span>
        </div>
        <div className="level-display">
          <span className="level-icon">⭐</span>
          <span>Ур. {level}</span>
        </div>
      </div>

      {combo > 1 && (
        <div className="combo-display" style={{ color: comboColors[Math.min(combo, 10)] }}>
          🔥 Комбо x{combo}!
        </div>
      )}

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
              className={`click-effect ${click.combo >= 5 ? 'critical' : ''}`}
              style={{ 
                left: `${click.x}px`, 
                top: `${click.y}px`,
                color: comboColors[Math.min(click.combo, 10)]
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
        💡 <i>Тапай быстро для комбо-множителя!</i>
      </div>
    </div>
  );
};

export default Clicker;
