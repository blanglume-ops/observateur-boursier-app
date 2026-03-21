import { useState, useEffect } from 'react';
import { GameProvider } from './context/GameContext';
import TerminalShell from './components/Terminal/TerminalShell';
import Dashboard from './components/Dashboard/Dashboard';
import MarketScreen from './components/MarketScreen/MarketScreen';
import TradingPanel from './components/TradingPanel/TradingPanel';
import Analytics from './components/Analytics/Analytics';
import NewsFeed from './components/NewsFeed/NewsFeed';
import GoalsPanel from './components/Goals/GoalsPanel';

const VIEW_MAP = {
  F1: 'dashboard',
  F2: 'market',
  F3: 'trade',
  F4: 'analytics',
  F5: 'news',
  F6: 'goals',
};

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedTicker, setSelectedTicker] = useState('AAPL');

  // Keyboard shortcuts F1-F6
  useEffect(() => {
    function handleKey(e) {
      const view = VIEW_MAP[e.key];
      if (view) {
        e.preventDefault();
        setCurrentView(view);
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  function handleSelectAsset(ticker) {
    setSelectedTicker(ticker);
    setCurrentView('trade');
  }

  return (
    <GameProvider>
      <TerminalShell currentView={currentView} onViewChange={setCurrentView}>
        <ViewContent
          view={currentView}
          onNavigate={setCurrentView}
          onSelectAsset={handleSelectAsset}
          selectedTicker={selectedTicker}
        />
      </TerminalShell>
    </GameProvider>
  );
}

function ViewContent({ view, onNavigate, onSelectAsset, selectedTicker }) {
  switch (view) {
    case 'dashboard':
      return <Dashboard onNavigate={onNavigate} />;
    case 'market':
      return <MarketScreen onSelectAsset={onSelectAsset} selectedTicker={selectedTicker} />;
    case 'trade':
      return <TradingPanel />;
    case 'analytics':
      return <Analytics />;
    case 'news':
      return <NewsFeed />;
    case 'goals':
      return <GoalsPanel />;
    default:
      return <Dashboard onNavigate={onNavigate} />;
  }
}
