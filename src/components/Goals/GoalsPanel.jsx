import { useGame, selectPortfolioValue, STARTING_CASH } from '../../context/GameContext';
import { formatCurrency } from '../../utils/formatters';

const GOALS = [
  {
    key: 'g1',
    title: 'APPRENTI TRADER',
    titleFr: 'NIVEAU DÉBUTANT',
    description: 'Atteindre $120,000 — +20% de gain',
    target: STARTING_CASH * 1.2,
    icon: '★',
    color: '#00FF66',
    reward: 'BADGE: APPRENTI TRADER',
  },
  {
    key: 'g2',
    title: 'GESTIONNAIRE CONFIRMÉ',
    titleFr: 'NIVEAU INTERMÉDIAIRE',
    description: 'Atteindre $150,000 — +50% de gain',
    target: STARTING_CASH * 1.5,
    icon: '★★',
    color: '#FFB300',
    reward: 'BADGE: GESTIONNAIRE CONFIRMÉ',
  },
  {
    key: 'g3',
    title: 'HEDGE FUND MANAGER',
    titleFr: 'NIVEAU EXPERT',
    description: 'Atteindre $200,000 — +100% de gain',
    target: STARTING_CASH * 2.0,
    icon: '★★★',
    color: '#FF6A00',
    reward: 'BADGE: HEDGE FUND MANAGER',
  },
];

const TIPS = [
  'DIVERSIFIEZ: Ne mettez pas tous vos œufs dans le même panier.',
  'CRYPTO HIGH-RISK: BTC/ETH/SOL ont une volatilité extrême — gérez votre exposition.',
  'BONDS = STABILITÉ: TLT et LQD protègent le capital en période de crise.',
  'SPY/QQQ: Les ETF indiciels suivent le marché — idéaux pour le long terme.',
  'FRAIS: Chaque transaction coûte 0.15% — évitez le surtrading.',
  'SHARPE RATIO > 1: Un bon ratio indique un rendement ajusté au risque solide.',
  'DRAWDOWN: Ne perdez jamais plus de 20% — c\'est la règle d\'or du risk management.',
  'GOLD & OIL: Couverture naturelle contre l\'inflation et les crises géopolitiques.',
  'ACHETER LA BAISSE: Les corrections sont des opportunités pour les investisseurs patients.',
  'POSITION SIZING: Ne risquez jamais plus de 5-10% du portefeuille sur un seul actif.',
];

export default function GoalsPanel() {
  const { state } = useGame();
  const totalValue = selectPortfolioValue(state);
  const { goals } = state;

  const tipIdx = Math.floor((state.gameDay / 5)) % TIPS.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div className="terminal-panel-header">
        <span>OBJECTIFS & PROGRESSION</span>
        <span className="panel-label">DAY {state.gameDay}</span>
      </div>

      <div className="bb-scroll" style={{ flex: 1, padding: '10px' }}>

        {/* Starting info */}
        <div style={{ background: 'rgba(255,102,0,0.04)', border: '1px solid rgba(255,102,0,0.1)', padding: '10px', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#555', letterSpacing: '0.1em', marginBottom: '6px' }}>CAPITAL DE DÉPART</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
            <span style={{ color: '#888' }}>Investissement initial:</span>
            <span className="glow-orange">{formatCurrency(STARTING_CASH)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
            <span style={{ color: '#888' }}>Valeur actuelle:</span>
            <span className={totalValue >= STARTING_CASH ? 'glow-green' : 'glow-red'}>
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '4px' }}>
            <span style={{ color: '#888' }}>Jours simulés:</span>
            <span className="glow-amber">{state.gameDay} / 252</span>
          </div>
        </div>

        {/* Goals */}
        <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '10px' }}>OBJECTIFS DE PERFORMANCE</div>

        {GOALS.map(goal => {
          const achieved = goals.achieved.includes(goal.key);
          const progress = Math.min(totalValue / goal.target, 1);
          const pct = (progress * 100).toFixed(1);
          const remaining = goal.target - totalValue;

          return (
            <div
              key={goal.key}
              style={{
                background: achieved ? `rgba(${goal.color === '#00FF66' ? '57,255,20' : goal.color === '#FFB300' ? '255,170,0' : '255,102,0'},0.06)` : '#050505',
                border: `1px solid ${achieved ? goal.color + '55' : 'rgba(255,102,0,0.1)'}`,
                padding: '12px',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <span style={{ color: goal.color, fontSize: '14px' }}>{goal.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: achieved ? goal.color : '#888', fontWeight: 700, fontSize: '12px', letterSpacing: '0.06em' }}>
                    {goal.title}
                    {achieved && <span style={{ marginLeft: '8px', fontSize: '10px' }}>✓ ACCOMPLI</span>}
                  </div>
                  <div style={{ color: '#555', fontSize: '10px' }}>{goal.description}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: goal.color, fontWeight: 700, fontSize: '13px' }}>
                    {formatCurrency(goal.target)}
                  </div>
                  <div style={{ color: '#555', fontSize: '10px' }}>OBJECTIF</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="bb-progress-track">
                <div
                  className="bb-progress-fill"
                  style={{
                    width: `${pct}%`,
                    background: achieved ? goal.color : `linear-gradient(90deg, ${goal.color}88, ${goal.color})`,
                    boxShadow: achieved ? `0 0 8px ${goal.color}88` : 'none',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '10px' }}>
                <span style={{ color: goal.color }}>{pct}% ATTEINT</span>
                {!achieved && remaining > 0 && (
                  <span style={{ color: '#555' }}>
                    MANQUE: {formatCurrency(remaining)}
                  </span>
                )}
                {achieved && (
                  <span style={{ color: goal.color, fontSize: '10px' }}>{goal.reward}</span>
                )}
              </div>
            </div>
          );
        })}

        {/* Pro tips */}
        <div style={{ borderTop: '1px solid rgba(255,102,0,0.1)', paddingTop: '12px', marginTop: '8px' }}>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '8px' }}>
            CONSEIL DU TRADER
          </div>
          <div style={{ background: 'rgba(255,170,0,0.04)', border: '1px solid rgba(255,170,0,0.15)', padding: '10px' }}>
            <span style={{ color: '#FFB300', fontSize: '11px', lineHeight: 1.6 }}>
              💡 {TIPS[tipIdx]}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,102,0,0.1)', paddingTop: '10px' }}>
          <div style={{ fontSize: '11px', color: '#555', letterSpacing: '0.1em', marginBottom: '8px' }}>
            STATISTIQUES DU JEU
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
            <StatRow label="Transactions" value={state.portfolio.history.length > 1 ? state.portfolio.history.length - 1 : 0} />
            <StatRow label="Jours simulés" value={state.gameDay} />
            <StatRow label="Objectifs atteints" value={`${goals.achieved.length} / ${GOALS.length}`} />
            <StatRow label="Cash disponible" value={formatCurrency(state.portfolio.cash)} />
          </div>
        </div>

      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ background: 'rgba(255,102,0,0.03)', border: '1px solid rgba(255,102,0,0.08)', padding: '6px 8px' }}>
      <div style={{ color: '#555', fontSize: '10px', marginBottom: '2px' }}>{label.toUpperCase()}</div>
      <div style={{ color: '#FF6A00' }}>{value}</div>
    </div>
  );
}
