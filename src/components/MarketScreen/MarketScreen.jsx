import { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { ASSET_CLASSES } from '../../data/assets';
import AssetRow from './AssetRow';

const FILTERS = [
  { key: 'ALL', label: 'ALL' },
  { key: ASSET_CLASSES.STOCK, label: 'STOCKS' },
  { key: ASSET_CLASSES.ETF, label: 'ETFs' },
  { key: ASSET_CLASSES.CRYPTO, label: 'CRYPTO' },
  { key: ASSET_CLASSES.COMMODITY, label: 'CMDTY' },
  { key: ASSET_CLASSES.BOND, label: 'BONDS' },
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
        <span>MARKET OVERVIEW — SECURITIES</span>
        <span style={{ display: 'flex', gap: '16px', fontSize: '10px', fontWeight: 400 }}>
          <span className="positive">▲ {gainers} GAINERS</span>
          <span className="negative">▼ {losers} LOSERS</span>
          <span className="dim">{assets.length} SECURITIES</span>
        </span>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '2px', padding: '4px 8px', borderBottom: '1px solid rgba(255,102,0,0.1)' }}>
        {FILTERS.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              padding: '2px 10px',
              background: filter === f.key ? 'rgba(255,102,0,0.2)' : 'transparent',
              border: filter === f.key ? '1px solid rgba(255,102,0,0.5)' : '1px solid rgba(255,255,255,0.1)',
              color: filter === f.key ? '#ff6600' : '#666',
              fontFamily: 'inherit',
              fontSize: '10px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bb-scroll" style={{ flex: 1 }}>
        <table className="bb-table" style={{ width: '100%' }}>
          <thead style={{ position: 'sticky', top: 0, background: '#060606', zIndex: 2 }}>
            <tr>
              {[
                { key: 'ticker', label: 'TICKER / NAME', align: 'left' },
                { key: null, label: 'CLASS', align: 'left' },
                { key: 'currentPrice', label: 'LAST', align: 'right' },
                { key: 'changePct', label: 'CHG %', align: 'right' },
                { key: 'change', label: 'CHG $', align: 'right' },
                { key: null, label: '60D CHART', align: 'center' },
                { key: 'risk', label: 'RISK', align: 'right' },
              ].map(col => (
                <th
                  key={col.label}
                  onClick={() => col.key && handleSort(col.key)}
                  style={{
                    textAlign: col.align,
                    cursor: col.key ? 'pointer' : 'default',
                    padding: '5px 8px',
                    color: col.key && sortKey === col.key ? '#ff6600' : 'rgba(255,255,255,0.4)',
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
