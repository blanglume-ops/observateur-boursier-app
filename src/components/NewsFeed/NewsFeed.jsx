import { useGame } from '../../context/GameContext';
import { formatNewsTime } from '../../utils/formatters';

const CATEGORY_COLORS = {
  MACRO: '#FFB300',
  EARNINGS: '#FF6A00',
  SECTOR: '#44aaff',
  REGULATORY: '#FF3B30',
  CRYPTO: '#ff44ff',
  COMMODITY: '#44ffaa',
  BONDS: '#00FF66',
  MARKET: '#ffffff',
  GEOPOLITICAL: '#ff8800',
  PRODUCT: '#88ff44',
};

export default function NewsFeed() {
  const { state } = useGame();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="terminal-panel-header">
        <span>INTELLIGENCE DE MARCHÉ — ACTUALITÉS</span>
        <span className="panel-label">{state.news.length} ARTICLES</span>
      </div>

      {/* Live indicator */}
      <div style={{ padding: '4px 10px', background: '#050505', borderBottom: '1px solid rgba(255,102,0,0.1)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ color: '#00FF66', animation: 'blink 1s step-end infinite' }}>●</span>
        <span style={{ color: '#555' }}>FLUX EN DIRECT — ACTUALISATION AUTOMATIQUE</span>
        <span style={{ color: '#444', marginLeft: 'auto' }}>
          MOTEUR D'INTELLIGENCE SIMULÉE BLOOMBERG L.P.
        </span>
      </div>

      {state.news.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#333', fontSize: '12px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>📡</div>
            <div>EN ATTENTE D'ACTUALITÉS...</div>
            <div style={{ color: '#444', fontSize: '10px', marginTop: '6px' }}>
              SIMULATION EN COURS — LES ACTUALITÉS APPARAÎTRONT BIENTÔT
            </div>
          </div>
        </div>
      ) : (
        <div className="bb-scroll" style={{ flex: 1, padding: '0 8px' }}>
          {state.news.map(item => (
            <NewsItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function NewsItem({ item }) {
  const categoryColor = CATEGORY_COLORS[item.category] ?? '#888';

  return (
    <div className="news-item">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '3px' }}>
        {/* Category badge */}
        <span style={{
          fontSize: '9px',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: categoryColor,
          border: `1px solid ${categoryColor}44`,
          padding: '1px 5px',
          background: `${categoryColor}11`,
          whiteSpace: 'nowrap',
        }}>
          {item.category}
        </span>

        {/* Sentiment badge */}
        <span className={`news-badge ${item.sentiment}`}>
          {item.sentiment === 'bullish' ? '▲ HAUSSE' : item.sentiment === 'bearish' ? '▼ BAISSE' : '◆ NEUTRE'}
        </span>

        {/* Affected tickers */}
        {item.affectedTickers?.length > 0 && (
          <span style={{ fontSize: '10px', color: '#FF6A00' }}>
            [{item.affectedTickers.join(', ')}]
          </span>
        )}

        {/* Timestamp */}
        <span style={{ fontSize: '10px', color: '#444', marginLeft: 'auto', whiteSpace: 'nowrap' }}>
          {formatNewsTime(item.timestamp)}
        </span>
      </div>

      {/* Headline */}
      <div style={{ fontSize: '12px', color: '#ddd', letterSpacing: '0.02em', lineHeight: 1.4 }}>
        {item.text}
      </div>

      {/* Impact indicator */}
      <div style={{ marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span style={{ fontSize: '9px', color: '#555' }}>IMPACT :</span>
        <div style={{ display: 'flex', gap: '2px' }}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} style={{
              width: '16px',
              height: '3px',
              background: i < Math.ceil(item.impact) ? (item.sentiment === 'bullish' ? '#00FF6666' : item.sentiment === 'bearish' ? '#FF3B3066' : '#FFB30066') : '#1a1a1a',
            }} />
          ))}
        </div>
      </div>
    </div>
  );
}
