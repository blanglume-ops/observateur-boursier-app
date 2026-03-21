const TABS = [
  { key: 'dashboard', label: 'PORTF', icon: '▦' },
  { key: 'market',    label: 'MARKET', icon: '◈' },
  { key: 'trade',     label: 'TRADE',  icon: '⇅' },
  { key: 'analytics', label: 'CHARTS', icon: '▲' },
  { key: 'news',      label: 'NEWS',   icon: '◎' },
  { key: 'goals',     label: 'GOALS',  icon: '★' },
];

export default function MobileTabBar({ currentView, onViewChange }) {
  return (
    <nav className="mobile-tab-bar" role="tablist">
      {TABS.map(tab => (
        <button
          key={tab.key}
          className={`mobile-tab ${currentView === tab.key ? 'active' : ''}`}
          onClick={() => onViewChange(tab.key)}
          role="tab"
          aria-selected={currentView === tab.key}
          aria-label={tab.label}
        >
          <span className="tab-icon" style={{ fontSize: '16px', lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: '9px', letterSpacing: '0.04em' }}>{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
