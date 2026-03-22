import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ASSET_CLASSES } from '../../data/assets';
import AssetRow from './AssetRow';

const FILTERS = [
  { key: 'ALL', label: 'TOUS' },
  { key: ASSET_CLASSES.STOCK, label: 'ACTIONS' },
  { key: ASSET_CLASSES.ETF, label: 'ETFs' },
  { key: ASSET_CLASSES.CRYPTO, label: 'CRYPTO' },
  { key: ASSET_CLASSES.COMMODITY, label: 'MATIÈRES' },
  { key: ASSET_CLASSES.BOND, label: 'OBLIG.' },
];

const SORTS = [
  { key: 'ticker', label: 'TICKER' },
  { key: 'changePct', label: 'CHANGE %' },
  { key: 'currentPrice', label: 'PRICE' },
  { key: 'risk', label: 'RISK' },
];

export default function MarketScreen({ onSelectAsset, selectedTicker }) {
  const { state } = useGame();
  const [filter, setFilter] = useState('ALL');
  const [sortKey, setSortKey] = useState('ticker');
  const [sortDir, setSortDir] = useState(1); // 1=asc, -1=desc

  const assets = Object.values(state.assets);

  const filtered = assets
    .filter(a => filter === 'ALL' || a.class === filter)
    .sort((a, b) => {
      const av = sortKey === 'ticker' ? a.ticker : a[sortKey];
      const bv = sortKey === 'ticker' ? b.ticker : b[sortKey];
      if (typeof av === 'string') return av.localeCompare(bv) * sortDir;
      return (av - bv) * sortDir;
    });

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => -d);
    else { setSortKey(key); setSortDir(-1); }
  }

  // Summary stats
  const gainers = assets.filter(a => a.changePct > 0).length;
  const losers = assets.filter(a => a.changePct < 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Panel header */}
      <div className="terminal-panel-header">
        <span>APERÇU DU MARCHÉ — TITRES</span>
        <span style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: 400 }}>
          <span className="positive">▲ {gainers} EN HAUSSE</span>
          <span className="negative">▼ {losers} EN BAISSE</span>
          <span className="dim">{assets.length} TITRES</span>
        </span>
      </div>

      {/* Filter tabs — scrollable on mobile */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px 8px', borderBottom: '1px solid rgba(255,102,0,0.1)', overflowX: 'auto', flexShrink: 0 }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '6px 12px',
              minHeight: '36px',
              background: filter === f.key ? 'rgba(255,102,0,0.2)' : 'transparent',
              border: filter === f.key ? '1px solid rgba(255,102,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: filter === f.key ? '#FF6A00' : '#666',
              fontFamily: 'inherit',
              fontSize: '11px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bb-scroll" style={{ flex: 1 }}>
        <table className="bb-table market-table-mobile" style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#060606', zIndex: 2 }}>
            <tr>
              {[
                { key: 'ticker', label: 'TICKER / NOM', align: 'left', mobile: true },
                { key: null, label: 'CLASSE', align: 'left', mobile: false },
                { key: 'currentPrice', label: 'DERNIER', align: 'right', mobile: true },
                { key: 'changePct', label: 'VAR. %', align: 'right', mobile: true },
                { key: 'change', label: 'VAR. $', align: 'right', mobile: false },
                { key: null, label: '60J', align: 'center', mobile: false },
                { key: 'risk', label: 'RISQUE', align: 'right', mobile: false },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && handleSort(col.key)}
                  className={col.mobile ? '' : 'market-col-hide'}
                  style={{
                    textAlign: col.align,
                    cursor: col.key ? 'pointer' : 'default',
                    padding: '5px 8px',
                    color: col.key && sortKey === col.key ? '#FF6A00' : 'rgba(255,255,255,0.4)',
                    userSelect: 'none',
                  }}
                >
                  {col.label}
                  {col.key === sortKey && (sortDir === 1 ? ' ↑' : ' ↓')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(asset => (
              <AssetRow
                key={asset.ticker}
                asset={asset}
                selected={asset.ticker === selectedTicker}
                onClick={() => onSelectAsset(asset.ticker)}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
