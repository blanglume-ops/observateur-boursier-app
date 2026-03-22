const FKEYS = [
  { key: 'F1', label: 'PORTF', view: 'dashboard' },
  { key: 'F2', label: 'MARKET', view: 'market' },
  { key: 'F3', label: 'TRADE', view: 'trade' },
  { key: 'F4', label: 'CHARTS', view: 'analytics' },
  { key: 'F5', label: 'NEWS', view: 'news' },
  { key: 'F6', label: 'GOALS', view: 'goals' },
];

export default function FunctionKeyBar({ currentView, onViewChange }) {
  return (
    <div className="fkey-bar">
      {FKEYS.map(({ key, label, view }) => (
        <button
          key={key}
          className={`fkey ${currentView === view ? 'active' : ''}`}
          onClick={() => onViewChange(view)}
          title={`${key}: ${label}`}
        >
          <span className="fnum">{key}</span>
          {label}
        </button>
      ))}
      <span style={{ flex: 1 }} />
      <span style={{ color: '#333', fontSize: '10px', alignSelf: 'center', letterSpacing: '0.06em' }}>
        OBSERVATEUR BOURSIER v1.0
      </span>
    </div>
  );
}
