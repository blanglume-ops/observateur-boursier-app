import React from 'react';
import { useGame, selectPortfolioValue, selectTotalPnL } from '../../context/GameContext';
import { formatCurrency, gameDate } from '../../utils/formatters';

export default function StatusBar({ currentView, onViewChange }) {
  const { state, toggleMarket, toggleRunning } = useGame();
  const totalValue = selectPortfolioValue(state);
  const totalPnL = selectTotalPnL(state);
  const pnlPct = (totalPnL / 100000) * 100;

  return (
    <div className="status-bar" style={{ fontSize: '11px', userSelect: 'none' }}>
      {/* Logo */}
      <span className="glow-orange" style={{ fontWeight: 700, letterSpacing: '0.15em', fontSize: '12px' }}>
        BLOOMBERG TERMINAL
      </span>

      <span className="dim">│</span>

      {/* Game date */}
      <span style={{ color: '#888' }}>
        {gameDate(state.gameDay)}
      </span>

      <span className="dim">│</span>

      {/* Market status */}
      <span
        className={`status-badge ${state.marketOpen ? 'open' : 'closed'}`}
        onClick={toggleMarket}
        style={{ cursor: 'pointer' }}
        title="Click to toggle market"
      >
        {state.marketOpen ? '● MARKET OPEN' : '● MARKET CLOSED'}
      </span>

      <span className="dim">│</span>

      {/* Day counter */}
      <span style={{ color: '#666' }}>DAY</span>
      <span className="glow-amber" style={{ marginLeft: '4px' }}>
        {String(state.gameDay).padStart(3, '0')}
      </span>

      <span className="dim">│</span>

      {/* Net worth */}
      <span style={{ color: '#888' }}>NAV:</span>
      <span className="glow-orange" style={{ marginLeft: '4px', fontWeight: 700 }}>
        {formatCurrency(totalValue)}
      </span>

      <span className="dim">│</span>

      {/* P&L */}
      <span style={{ color: '#888' }}>P&amp;L:</span>
      <span
        className={totalPnL >= 0 ? 'glow-green' : 'glow-red'}
        style={{ marginLeft: '4px', fontWeight: 700 }}
      >
        {totalPnL >= 0 ? '+' : ''}{formatCurrency(totalPnL)}
        {' '}
        ({pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%)
      </span>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Pause/Play */}
      <span
        onClick={toggleRunning}
        style={{
          cursor: 'pointer',
          color: state.running ? '#39ff14' : '#ffaa00',
          fontSize: '10px',
          letterSpacing: '0.1em',
          padding: '1px 6px',
          border: '1px solid',
          borderColor: state.running ? 'rgba(57,255,20,0.4)' : 'rgba(255,170,0,0.4)',
        }}
        title={state.running ? 'Pause simulation' : 'Resume simulation'}
      >
        {state.running ? '▶ LIVE' : '⏸ PAUSED'}
      </span>

      <span className="dim">│</span>

      {/* Clock */}
      <LiveClock />
    </div>
  );
}

function LiveClock() {
  const [time, setTime] = React.useState(new Date());
  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="glow-amber" style={{ letterSpacing: '0.05em' }}>
      {time.toLocaleTimeString('en-US', { hour12: false })}
    </span>
  );
}
