import React from 'react';
import { useGame, selectPortfolioValue, selectTotalPnL } from '../../context/GameContext';
import { formatCurrency, formatCurrencyCompact, gameDate } from '../../utils/formatters';

export default function StatusBar({ currentView, onViewChange }) {
  const { state, toggleMarket, toggleRunning, speed, setSpeed } = useGame();
  const totalValue = selectPortfolioValue(state);
  const totalPnL = selectTotalPnL(state);
  const pnlPct = (totalPnL / 100000) * 100;

  return (
    <div className="status-bar" style={{ fontSize: '11px', userSelect: 'none' }}>
      {/* Logo — hide on very small screens */}
      <span className="glow-orange status-hide-mobile" style={{ fontWeight: 700, letterSpacing: '0.15em', fontSize: '12px', whiteSpace: 'nowrap' }}>
        BLOOMBERG TERMINAL
      </span>
      {/* Short logo on mobile */}
      <span className="glow-orange status-show-mobile" style={{ fontWeight: 700, letterSpacing: '0.1em', fontSize: '11px', whiteSpace: 'nowrap' }}>
        BB
      </span>

      <span className="dim status-hide-mobile">│</span>

      {/* Game date — hide on mobile */}
      <span className="status-hide-mobile" style={{ color: '#888', whiteSpace: 'nowrap' }}>
        {gameDate(state.gameDay)}
      </span>

      {/* Market status */}
      <span
        className={`status-badge ${state.marketOpen ? 'open' : 'closed'}`}
        onClick={toggleMarket}
        style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}
        title="Toggle market"
      >
        {state.marketOpen ? '● OUV.' : '● FERM.'}
      </span>

      {/* Day counter — hide on mobile */}
      <span className="status-hide-mobile" style={{ color: '#666', whiteSpace: 'nowrap' }}>
        JOUR <span className="glow-amber">{String(state.gameDay).padStart(3, '0')}</span>
      </span>

      {/* Net worth — always visible, compact on mobile */}
      <span style={{ color: '#888', whiteSpace: 'nowrap' }}>NAV:</span>
      <span className="glow-orange" style={{ marginLeft: '2px', fontWeight: 700, whiteSpace: 'nowrap' }}>
        <span className="status-hide-mobile">{formatCurrency(totalValue)}</span>
        <span className="status-show-mobile">{formatCurrencyCompact(totalValue)}</span>
      </span>

      {/* P&L — always visible */}
      <span
        className={totalPnL >= 0 ? 'glow-green' : 'glow-red'}
        style={{ fontWeight: 700, whiteSpace: 'nowrap' }}
      >
        {totalPnL >= 0 ? '+' : ''}{pnlPct.toFixed(1)}%
      </span>

      {/* Spacer */}
      <span style={{ flex: 1 }} />

      {/* Speed control */}
      <span className="status-hide-mobile" style={{ display: 'flex', gap: '2px', alignItems: 'center', marginRight: '4px' }}>
        {[1, 2, 4].map(s => (
          <span
            key={s}
            onClick={() => setSpeed(s)}
            style={{
              cursor: 'pointer',
              fontSize: '10px',
              padding: '3px 6px',
              border: '1px solid',
              borderColor: speed === s ? 'rgba(255,179,0,0.6)' : 'rgba(255,255,255,0.1)',
              color: speed === s ? '#FFB300' : '#444',
              background: speed === s ? 'rgba(255,179,0,0.08)' : 'transparent',
              letterSpacing: '0.05em',
              minHeight: '28px',
              display: 'flex',
              alignItems: 'center',
            }}
            title={`Vitesse ×${s}`}
          >
            ×{s}
          </span>
        ))}
      </span>

      {/* Pause/Play */}
      <span
        onClick={toggleRunning}
        style={{
          cursor: 'pointer',
          color: state.running ? '#00FF66' : '#FFB300',
          fontSize: '10px',
          letterSpacing: '0.08em',
          padding: '4px 8px',
          border: '1px solid',
          borderColor: state.running ? 'rgba(57,255,20,0.4)' : 'rgba(255,170,0,0.4)',
          whiteSpace: 'nowrap',
          minHeight: '28px',
          display: 'flex',
          alignItems: 'center',
        }}
        title={state.running ? 'Mettre en pause' : 'Reprendre la simulation'}
      >
        {state.running ? '▶' : '⏸'}
      </span>

      {/* Clock — hide on mobile */}
      <span className="status-hide-mobile" style={{ marginLeft: '4px' }}>
        <LiveClock />
      </span>
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
      {time.toLocaleTimeString('fr-FR', { hour12: false })}
    </span>
  );
}
