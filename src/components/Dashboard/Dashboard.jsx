import { useGame, selectPortfolioValue, selectPositions, selectTotalPnL, selectBenchmarkValue, STARTING_CASH } from '../../context/GameContext';
import { formatCurrency, formatPct, formatPrice, gameDate } from '../../utils/formatters';
import Sparkline from '../MarketScreen/Sparkline';
import { ASSET_CLASSES } from '../../data/assets';

export default function Dashboard({ onNavigate }) {
  const { state } = useGame();
  const totalValue = selectPortfolioValue(state);
  const pnl = selectTotalPnL(state);
  const pnlPct = (pnl / 100000) * 100;
  const benchmarkValue = selectBenchmarkValue(state);
  const positions = selectPositions(state);

  // Portfolio equity history
  const equityHistory = state.portfolio.history.map(h => h.value);

  // Asset class allocation
  const allocationByClass = {};
  for (const pos of positions) {
    const cls = pos.asset?.class ?? 'OTHER';
    allocationByClass[cls] = (allocationByClass[cls] ?? 0) + pos.currentValue;
  }
  allocationByClass['CASH'] = state.portfolio.cash;
  const totalForAlloc = Object.values(allocationByClass).reduce((s, v) => s + v, 0);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr', height: '100%', gap: '0' }}>

      {/* ── TOP LEFT: Portfolio Summary ── */}
      <div className="terminal-panel" style={{ borderRight: '1px solid rgba(255,102,0,0.15)', borderBottom: '1px solid rgba(255,102,0,0.15)' }}>
        <div className="terminal-panel-header">
          <span>PORTFOLIO SUMMARY</span>
          <span className="panel-label">F1</span>
        </div>

        {/* Key metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
          <MetricBox label="NET ASSET VALUE" value={formatCurrency(totalValue)} color="#ff6600" big />
          <MetricBox
            label="TOTAL P&L"
            value={`${pnl >= 0 ? '+' : ''}${formatCurrency(pnl)}`}
            color={pnl >= 0 ? '#39ff14' : '#ff2222'}
            big
          />
          <MetricBox
            label="RETURN"
            value={`${pnlPct >= 0 ? '+' : ''}${pnlPct.toFixed(2)}%`}
            color={pnlPct >= 0 ? '#39ff14' : '#ff2222'}
            big
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginBottom: '12px' }}>
          <MetricBox label="CASH" value={formatCurrency(state.portfolio.cash)} color="#ffaa00" />
          <MetricBox label="INVESTED" value={formatCurrency(totalValue - state.portfolio.cash)} color="#fff" />
          <MetricBox label="POSITIONS" value={String(positions.length)} color="#ff6600" />
        </div>

        {/* vs Benchmark */}
        <div style={{ borderTop: '1px solid rgba(255,102,0,0.1)', paddingTop: '8px' }}>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', marginBottom: '6px' }}>BENCHMARK COMPARISON — SPY</div>
          <div style={{ display: 'flex', gap: '16px', fontSize: '11px' }}>
            <div>
              <span style={{ color: '#666' }}>PORTFOLIO: </span>
              <span className={pnlPct >= 0 ? 'positive' : 'negative'}>
                {pnlPct >= 0 ? '+' : ''}{pnlPct.toFixed(2)}%
              </span>
            </div>
            <div>
              <span style={{ color: '#666' }}>S&P 500: </span>
              <span style={{ color: '#ffaa00' }}>
                {(((benchmarkValue - 100000) / 100000) * 100).toFixed(2)}%
              </span>
            </div>
            <div>
              <span style={{ color: '#666' }}>ALPHA: </span>
              <span className={pnlPct - (((benchmarkValue - 100000) / 100000) * 100) >= 0 ? 'positive' : 'negative'}>
                {(pnlPct - (((benchmarkValue - 100000) / 100000) * 100)).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Equity sparkline */}
        <div style={{ marginTop: '10px' }}>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', marginBottom: '4px' }}>EQUITY CURVE</div>
          <Sparkline history={equityHistory} width={380} height={36} />
        </div>
      </div>

      {/* ── TOP RIGHT: Positions ── */}
      <div className="terminal-panel" style={{ borderBottom: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>OPEN POSITIONS</span>
          <span className="panel-label">{positions.length} POS</span>
        </div>

        <div className="bb-scroll" style={{ flex: 1 }}>
          {positions.length === 0 ? (
            <div style={{ color: '#444', padding: '20px', textAlign: 'center', fontSize: '12px' }}>
              NO OPEN POSITIONS<br />
              <span style={{ fontSize: '10px', marginTop: '6px', display: 'block' }}>
                PRESS F2 TO VIEW MARKETS | F3 TO TRADE
              </span>
            </div>
          ) : (
            <table className="bb-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>TICKER</th>
                  <th>SHARES</th>
                  <th>AVG COST</th>
                  <th>LAST</th>
                  <th>VALUE</th>
                  <th>P&amp;L</th>
                  <th>P&amp;L %</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(pos => (
                  <tr key={pos.ticker}>
                    <td style={{ textAlign: 'left' }}>
                      <span style={{ color: '#ff6600', fontWeight: 700 }}>{pos.ticker}</span>
                    </td>
                    <td>{pos.shares}</td>
                    <td>{formatPrice(pos.avgCost)}</td>
                    <td>{formatPrice(pos.asset?.currentPrice ?? 0)}</td>
                    <td>{formatCurrency(pos.currentValue)}</td>
                    <td className={pos.pnl >= 0 ? 'positive' : 'negative'}>
                      {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                    </td>
                    <td className={pos.pnlPct >= 0 ? 'positive' : 'negative'}>
                      {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── BOTTOM LEFT: Market Snapshot ── */}
      <div className="terminal-panel" style={{ borderRight: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>MARKET SNAPSHOT</span>
          <span className="panel-label">TOP MOVERS</span>
        </div>

        <div className="bb-scroll" style={{ flex: 1 }}>
          <TopMovers assets={state.assets} />
        </div>
      </div>

      {/* ── BOTTOM RIGHT: Allocation ── */}
      <div className="terminal-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>ASSET ALLOCATION</span>
          <span className="panel-label">BY CLASS</span>
        </div>

        <div style={{ flex: 1, padding: '8px', overflow: 'auto' }}>
          <AllocationView alloc={allocationByClass} total={totalForAlloc} />
        </div>

        {/* Quick navigation hint */}
        <div style={{ borderTop: '1px solid rgba(255,102,0,0.08)', padding: '6px 8px', fontSize: '10px', color: '#333', display: 'flex', gap: '12px' }}>
          <span onClick={() => onNavigate('market')} style={{ cursor: 'pointer', color: '#555' }}>F2 MARKET</span>
          <span onClick={() => onNavigate('trade')} style={{ cursor: 'pointer', color: '#555' }}>F3 TRADE</span>
          <span onClick={() => onNavigate('analytics')} style={{ cursor: 'pointer', color: '#555' }}>F4 CHARTS</span>
          <span onClick={() => onNavigate('news')} style={{ cursor: 'pointer', color: '#555' }}>F5 NEWS</span>
        </div>
      </div>

    </div>
  );
}

function MetricBox({ label, value, color, big = false }) {
  return (
    <div className="bb-metric">
      <div className="bb-metric-label">{label}</div>
      <div style={{
        fontSize: big ? '16px' : '13px',
        fontWeight: 700,
        color: color,
        textShadow: `0 0 8px ${color}66`,
        letterSpacing: '0.02em',
      }}>
        {value}
      </div>
    </div>
  );
}

function TopMovers({ assets }) {
  const list = Object.values(assets)
    .sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct))
    .slice(0, 10);

  return (
    <table className="bb-table">
      <thead>
        <tr>
          <th style={{ textAlign: 'left' }}>TICKER</th>
          <th>PRICE</th>
          <th>CHG%</th>
          <th>CHART</th>
        </tr>
      </thead>
      <tbody>
        {list.map(asset => (
          <tr key={asset.ticker}>
            <td style={{ textAlign: 'left' }}>
              <span style={{ color: '#ff6600', fontWeight: 700 }}>{asset.ticker}</span>
              <span style={{ color: '#444', fontSize: '10px', marginLeft: '6px' }}>{asset.class}</span>
            </td>
            <td style={{ color: '#fff' }}>{formatPrice(asset.currentPrice)}</td>
            <td className={asset.changePct >= 0 ? 'positive' : 'negative'}>
              {asset.changePct >= 0 ? '▲' : '▼'}{Math.abs(asset.changePct).toFixed(2)}%
            </td>
            <td><Sparkline history={asset.history} width={60} height={18} /></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const CLASS_COLORS = {
  STOCK: '#ff6600',
  ETF: '#ffaa00',
  CRYPTO: '#ff44ff',
  COMMODITY: '#44aaff',
  BOND: '#39ff14',
  CASH: '#ffffff',
};

function AllocationView({ alloc, total }) {
  const entries = Object.entries(alloc)
    .filter(([, v]) => v > 0)
    .sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {entries.map(([cls, value]) => {
        const pct = total > 0 ? (value / total) * 100 : 0;
        const color = CLASS_COLORS[cls] ?? '#888';
        return (
          <div key={cls}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
              <span style={{ color }}>{cls}</span>
              <span style={{ color: '#888' }}>
                {formatCurrency(value)} <span style={{ color: '#555' }}>({pct.toFixed(1)}%)</span>
              </span>
            </div>
            <div className="alloc-bar">
              <div className="alloc-fill" style={{ width: `${pct}%`, background: color, opacity: 0.7 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
