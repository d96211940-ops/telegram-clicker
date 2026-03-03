import './BottomNav.css';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'profile', icon: '👤', label: 'Профиль' },
    { id: 'clicker', icon: '🪙', label: 'Кликер' },
    { id: 'union', icon: '🤝', label: 'Союз' },
    { id: 'rating', icon: '🏆', label: 'Рейтинг' },
    { id: 'cards', icon: '🃏', label: 'Карточки' },
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="nav-icon">{tab.icon}</span>
          <span className="nav-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
