import { useEffect, useState } from 'react';
import BottomNav from './components/BottomNav';
import Profile from './components/Profile';
import Clicker from './components/Clicker';
import Union from './components/Union';
import Rating from './components/Rating';
import Cards from './components/Cards';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('clicker');
  const [telegramUser, setTelegramUser] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [union, setUnion] = useState(null);
  const [boosts, setBoosts] = useState(null);

  useEffect(() => {
    // Инициализация Telegram WebApp
    if (window.Telegram && window.Telegram.WebApp) {
      const tg = window.Telegram.WebApp;
      tg.ready();
      tg.expand();
      
      if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        setTelegramUser(tg.initDataUnsafe.user);
      }
      
      document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#1a1a2e');
      document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#ffffff');
    }
  }, []);

  useEffect(() => {
    const savedScore = parseInt(localStorage.getItem('clicker_score') || '0');
    setScore(savedScore);
    setLevel(Math.floor(savedScore / 1000) + 1);
    
    const savedUnion = localStorage.getItem('clicker_my_union');
    if (savedUnion) {
      setUnion(JSON.parse(savedUnion));
    }
    
    const savedBoosts = localStorage.getItem('clicker_boosts');
    if (savedBoosts) {
      setBoosts(JSON.parse(savedBoosts));
    }
  }, []);

  const handleScoreUpdate = (newScore) => {
    setScore(newScore);
    setLevel(Math.floor(newScore / 1000) + 1);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <Profile telegramUser={telegramUser} score={score} level={level} union={union} />;
      case 'clicker':
        return <Clicker onScoreUpdate={handleScoreUpdate} />;
      case 'union':
        return <Union score={score} telegramUser={telegramUser} />;
      case 'rating':
        return <Rating />;
      case 'cards':
        return <Cards score={score} onScoreUpdate={handleScoreUpdate} />;
      default:
        return <Clicker onScoreUpdate={handleScoreUpdate} />;
    }
  };

  return (
    <div className="app">
      <div className="content">
        {renderContent()}
      </div>
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
