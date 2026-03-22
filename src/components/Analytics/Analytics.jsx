import { useGame, selectPortfolioValue, selectPositions, STARTING_CASH } from '../../context/GameContext';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  calcSharpeRatio, calcMaxDrawdown, calcVaR, calcBeta
} from '../../utils/priceSimulation';
import { formatCurrency, formatSharpe, formatDrawdown, formatVaR, formatBeta } from '../../utils/formatters';

const CHART_COLORS = {
  portfolio: '#ff6600',
  benchmark: '#ffaa00',
  gain: '#39ff14',
  loss: '#ff2222',
};

const PIE_COLORS = ['#ff6600', '#ffaa00', '#ff44ff', '#44aaff', '#39ff14', '#ffffff'];

export default function Analytics() {
  const { state } = useGame();
  const positions = selectPositions(state);

  // Equity curve data
  const equityData = state.portfolio.history.map((h, i) => ({
    day: h.day,
    portfolio: h.value,
    benchmark: STARTING_CASH * (state.assets.SPY?.history?.[Math.min(i, (state.assets.SPY?.history?.length ?? 1) - 1)] ?? state.assets.SPY?.currentPrice ?? STARTING_CASH) / (state.assets.SPY?.history?.[0] ?? state.assets.SPY?.currentPrice ?? 1),
  }));

  // Risk metrics
  const returns = state.portfolio.dailyReturns;
  const spyReturns = (state.assets.SPY?.history ?? []).map((p, i, arr) =>
    i > 0 ? (p - arr[i - 1]) / arr[i - 1] : 0
  ).slice(1);

  const sharpe = calcSharpeRatio(returns);
  const maxDD = calcMaxDrawdown(state.portfolio.history.map(h => h.value));
  const varValue = calcVaR(returns);
  const beta = calcBeta(returns, spyReturns);
  const totalValue = selectPortfolioValue(state);
  const totalReturn = ((totalValue - STARTING_CASH) / STARTING_CASH) * 100;

  // Allocation for pie chart
  const allocData = [];
  const classMap = {};
  for (const pos of positions) {
    const cls = pos.asset?.class ?? 'OTHER';
    classMap[cls] = (classMap[cls] ?? 0) + pos.currentValue;
  }
  if (state.portfolio.cash > 0) classMap['CASH'] = state.portfolio.cash;
  for (const [name, value] of Object.entries(classMap)) {
    allocData.push({ name, value });
  }

  // Drawdown series
  let peak = STARTING_CASH;
  const drawdownData = state.portfolio.history.map(h => {
    if (h.value > peak) peak = h.value;
    const dd = peak > 0 ? ((h.value - peak) / peak) * 100 : 0;
    return { day: h.day, drawdown: dd };
  });

  const customTooltipStyle = {
    background: '#080808',
    border: '1px solid rgba(255,102,0,0.3)',
    color: '#ff6600',
    fontSize: '11px',
    fontFamily: 'IBM Plex Mono, monospace',
  };

  return (
    <div className="analytics-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: 'auto 1fr 1fr', height: '100%', gap: '0', overflow: 'hidden' }}>

      {/* ── Risk Metrics Row ── */}
      <div
        className="terminal-panel"
        style={{ gridColumn: '1 / -1', borderBottom: '1px solid rgba(255,102,0,0.15)' }}
      >
        <div className="terminal-panel-header">
          <span>ANALYSE DES RISQUES</span>
          <span className="panel-label">JOUR {state.gameDay}</span>
        </div>
        <div className="analytics-metrics-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
          <RiskMetric label="RENDEMENT TOTAL" value={`${totalReturn >= 0 ? '+' : ''}${totalReturn.toFixed(2)}%`} color={totalReturn >= 0 ? '#39ff14' : '#ff2222'} />
          <RiskMetric label="RATIO DE SHARPE" value={formatSharpe(sharpe)} color={sharpe > 1 ? '#39ff14' : sharpe > 0 ? '#ffaa00' : '#ff2222'} desc={sharpe > 1 ? 'EXCELLENT' : sharpe > 0 ? 'BON' : 'MAUVAIS'} />
          <RiskMetric label="DRAWDOWN MAX" value={`-${formatDrawdown(maxDD)}`} color={maxDD > 0.15 ? '#ff2222' : maxDD > 0.05 ? '#ffaa00' : '#39ff14'} />
          <RiskMetric label="VaR (95%)" value={formatVaR(varValue)} color="#ffaa00" desc="1 JOUR" />
          <RiskMetric label="BÊTA vs SPY" value={formatBeta(beta)} color={Math.abs(beta - 1) < 0.3 ? '#39ff14' : '#ffaa00'} />
          <RiskMetric label="POSITIONS" value={String(positions.length)} color="#ff6600" />
        </div>
      </div>

      {/* ── Equity Curve ── */}
      <div className="terminal-panel" style={{ borderRight: '1px solid rgba(255,102,0,0.15)', borderBottom: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>COURBE DU PORTEFEUILLE</span>
          <span className="panel-label">vs S&P 500</span>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="portfolioGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff6600" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ff6600" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="benchmarkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ffaa00" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ffaa00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#333" tick={{ fill: '#555', fontSize: 9 }} tickLine={false} />
              <YAxis
                stroke="#333"
                tick={{ fill: '#555', fontSize: 9 }}
                tickLine={false}
                tickFormatter={v => `$${(v / 1000).toFixed(0)}K`}
                width={48}
              />
              <Tooltip
                contentStyle={customTooltipStyle}
                formatter={(val, name) => [formatCurrency(val), name === 'portfolio' ? 'PORTEFEUILLE' : 'S&P 500']}
                labelFormatter={l => `JOUR ${l}`}
              />
              <Area type="monotone" dataKey="portfolio" stroke="#ff6600" fill="url(#portfolioGrad)" strokeWidth={1.5} dot={false} />
              <Area type="monotone" dataKey="benchmark" stroke="#ffaa00" fill="url(#benchmarkGrad)" strokeWidth={1} dot={false} strokeDasharray="4 2" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Allocation Pie ── */}
      <div className="terminal-panel" style={{ borderBottom: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>RÉPARTITION DES ACTIFS</span>
          <span className="panel-label">PAR CLASSE</span>
        </div>
        <div style={{ flex: 1 }}>
          {allocData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={allocData}
                  cx="50%"
                  cy="50%"
                  innerRadius="35%"
                  outerRadius="65%"
                  dataKey="value"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {allocData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} opacity={0.8} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={customTooltipStyle}
                  formatter={(val) => [formatCurrency(val), 'VALEUR']}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#444', fontSize: '12px' }}>
              AUCUNE POSITION — 100% LIQUIDITÉS
            </div>
          )}
        </div>
      </div>

      {/* ── Drawdown Chart ── */}
      <div className="terminal-panel" style={{ borderRight: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>ANALYSE DU DRAWDOWN</span>
          <span className="panel-label">% DEPUIS SOMMET</span>
        </div>
        <div style={{ flex: 1 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={drawdownData} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ff2222" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#ff2222" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#333" tick={{ fill: '#555', fontSize: 9 }} tickLine={false} />
              <YAxis stroke="#333" tick={{ fill: '#555', fontSize: 9 }} tickLine={false} tickFormatter={v => `${v.toFixed(1)}%`} width={44} />
              <Tooltip contentStyle={customTooltipStyle} formatter={val => [`${val.toFixed(2)}%`, 'DRAWDOWN']} labelFormatter={l => `JOUR ${l}`} />
              <Area type="monotone" dataKey="drawdown" stroke="#ff2222" fill="url(#ddGrad)" strokeWidth={1.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Positions P&L ── */}
      <div className="terminal-panel" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div className="terminal-panel-header">
          <span>P&amp;L DES POSITIONS</span>
          <span className="panel-label">{positions.length} OUVERTES</span>
        </div>
        <div className="bb-scroll" style={{ flex: 1 }}>
          {positions.length === 0 ? (
            <div style={{ color: '#444', padding: '20px', textAlign: 'center', fontSize: '12px' }}>
              AUCUNE POSITION
            </div>
          ) : (
            <table className="bb-table">
              <thead>
                <tr>
                  <th style={{ textAlign: 'left' }}>TICKER</th>
                  <th>ACTIONS</th>
                  <th>VALEUR</th>
                  <th>P&amp;L LATENT</th>
                  <th>RENDEMENT</th>
                </tr>
              </thead>
              <tbody>
                {positions.sort((a, b) => b.pnl - a.pnl).map(pos => (
                  <tr key={pos.ticker}>
                    <td style={{ textAlign: 'left', color: '#ff6600', fontWeight: 700 }}>{pos.ticker}</td>
                    <td>{pos.shares}</td>
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

    </div>
  );
}

function RiskMetric({ label, value, color, desc }) {
  return (
    <div className="bb-metric">
      <div className="bb-metric-label">{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color, textShadow: `0 0 8px ${color}66` }}>
        {value}
      </div>
      {desc && <div style={{ fontSize: '9px', color: '#555', marginTop: '2px' }}>{desc}</div>}
    </div>
  );
}
