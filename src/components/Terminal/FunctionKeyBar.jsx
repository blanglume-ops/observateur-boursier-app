const FKEYS = [
  { key: 'F1', label: 'PORTEF.', view: 'dashboard' },
  { key: 'F2', label: 'MARCHÉS', view: 'market' },
  { key: 'F3', label: 'TRADER', view: 'trade' },
  { key: 'F4', label: 'GRAPH.', view: 'analytics' },
  { key: 'F5', label: 'ACTUS', view: 'news' },
  { key: 'F6', label: 'OBJECTIFS', view: 'goals' },
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
