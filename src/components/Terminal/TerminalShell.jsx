import StatusBar from './StatusBar';
import FunctionKeyBar from './FunctionKeyBar';
import { useGame } from '../../context/GameContext';

export default function TerminalShell({ currentView, onViewChange, children }) {
  const { state } = useGame();

  return (
    <div
      className="crt"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* Top Status Bar */}
      <StatusBar currentView={currentView} onViewChange={onViewChange} />

      {/* Main Content Area */}
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        {children}
      </div>

      {/* Bottom: Ticker Tape */}
      <TickerBar />

      {/* Function Key Navigation */}
      <FunctionKeyBar currentView={currentView} onViewChange={onViewChange} />

      {/* Trade Notification */}
      {state.notification && <Notification note={state.notification} />}
    </div>
  );
}

function TickerBar() {
  const { state } = useGame();
  const items = Object.values(state.assets);

  // Duplicate for seamless scroll
  const tickerContent = [...items, ...items].map((asset, i) => (
    <span key={i} style={{ marginRight: '32px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <span className="glow-amber" style={{ fontWeight: 700, fontSize: '11px' }}>{asset.ticker}</span>
      <span style={{ color: '#fff', fontSize: '11px' }}>
        {asset.currentPrice >= 1000
          ? asset.currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : asset.currentPrice.toFixed(2)}
      </span>
      <span
        className={asset.changePct >= 0 ? 'positive' : 'negative'}
        style={{ fontSize: '10px' }}
      >
        {asset.changePct >= 0 ? '▲' : '▼'}
        {Math.abs(asset.changePct).toFixed(2)}%
      </span>
    </span>
  ));

  return (
    <div
      style={{
        background: '#050505',
        borderTop: '1px solid rgba(255,102,0,0.2)',
        borderBottom: '1px solid rgba(255,102,0,0.1)',
        overflow: 'hidden',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <span style={{ color: '#ff6600', padding: '0 8px', fontSize: '10px', fontWeight: 700, borderRight: '1px solid rgba(255,102,0,0.3)', marginRight: '8px', whiteSpace: 'nowrap' }}>
        LIVE
      </span>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <div className="ticker-scroll">
          {tickerContent}
        </div>
      </div>
    </div>
  );
}

function Notification({ note }) {
  const colorMap = {
    buy: '#39ff14',
    sell: '#ff6600',
    error: '#ff2222',
  };
  const color = colorMap[note.type] || '#ffaa00';
  return (
    <div
      style={{
        position: 'fixed',
        bottom: '70px',
        right: '16px',
        background: '#000',
        border: `1px solid ${color}`,
        color,
        padding: '8px 16px',
        fontSize: '12px',
        letterSpacing: '0.06em',
        zIndex: 9995,
        boxShadow: `0 0 20px ${color}44`,
        maxWidth: '420px',
        textShadow: `0 0 8px ${color}`,
      }}
    >
      ▶ {note.message}
    </div>
  );
}
