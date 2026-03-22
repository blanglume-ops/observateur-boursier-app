import { useState } from 'react';
import { useGame, selectPositions } from '../../context/GameContext';
import { formatCurrency, formatPrice } from '../../utils/formatters';
import MarketScreen from '../MarketScreen/MarketScreen';
import Sparkline from '../MarketScreen/Sparkline';

const TRANSACTION_FEE = 0.0015;

export default function TradingPanel() {
  const { state, buy, sell } = useGame();
  const [selectedTicker, setSelectedTicker] = useState('AAPL');
  const [mode, setMode] = useState('BUY'); // 'BUY' | 'SELL'
  const [quantity, setQuantity] = useState('');
  const [orderType, setOrderType] = useState('MARKET');

  const asset = state.assets[selectedTicker];
  const positions = selectPositions(state);
  const currentPosition = positions.find(p => p.ticker === selectedTicker);

  const qty = parseFloat(quantity) || 0;
  const totalCost = qty * (asset?.currentPrice ?? 0);
  const fee = totalCost * TRANSACTION_FEE;
  const totalWithFee = mode === 'BUY' ? totalCost + fee : totalCost - fee;

  function handleTrade() {
    if (!asset || qty <= 0) return;
    if (mode === 'BUY') {
      buy(selectedTicker, qty);
    } else {
      sell(selectedTicker, qty);
    }
    setQuantity('');
  }

  // Max qty based on mode
  function setMax() {
    if (!asset) return;
    if (mode === 'BUY') {
      const maxShares = Math.floor(state.portfolio.cash / (asset.currentPrice * (1 + TRANSACTION_FEE)));
      setQuantity(String(maxShares));
    } else {
      setQuantity(String(currentPosition?.shares ?? 0));
    }
  }

  // Generate simulated order book
  const orderBook = generateOrderBook(asset?.currentPrice ?? 100);

  return (
    <div className="trade-split" style={{ display: 'flex', height: '100%', gap: '0', overflow: 'hidden' }}>
      {/* Left: Market list */}
      <div style={{ width: '55%', borderRight: '1px solid rgba(255,102,0,0.15)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <MarketScreen
          onSelectAsset={setSelectedTicker}
          selectedTicker={selectedTicker}
        />
      </div>

      {/* Right: Order panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '0' }}>
        {/* Selected asset header */}
        <div className="terminal-panel-header">
          <span>SAISIE D'ORDRE</span>
          {asset && (
            <span style={{ fontWeight: 400, color: '#FFB300' }}>
              {asset.ticker} — {asset.name}
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflow: 'auto', padding: '10px' }}>
          {asset && (
            <>
              {/* Asset Quick Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
                <div className="bb-metric">
                  <div className="bb-metric-label">DERNIER COURS</div>
                  <div className="bb-metric-value">{formatPrice(asset.currentPrice)}</div>
                </div>
                <div className="bb-metric">
                  <div className="bb-metric-label">VAR. JOURNÉE</div>
                  <div className="bb-metric-value" style={{ color: asset.changePct >= 0 ? '#00FF66' : '#FF3B30', fontSize: '16px' }}>
                    {asset.changePct >= 0 ? '+' : ''}{asset.changePct.toFixed(2)}%
                  </div>
                </div>
              </div>

              {/* Sparkline */}
              <div style={{ background: '#050505', border: '1px solid rgba(255,102,0,0.1)', padding: '8px', marginBottom: '12px' }}>
                <div style={{ color: '#555', fontSize: '10px', marginBottom: '4px', letterSpacing: '0.08em' }}>HISTORIQUE 60 JOURS</div>
                <Sparkline history={asset.history} width={300} height={50} />
              </div>

              {/* Current position */}
              {currentPosition && (
                <div style={{ background: 'rgba(255,102,0,0.05)', border: '1px solid rgba(255,102,0,0.15)', padding: '8px', marginBottom: '12px', fontSize: '11px' }}>
                  <div style={{ color: '#888', marginBottom: '6px', letterSpacing: '0.1em' }}>POSITION EN COURS</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>ACTIONS</span>
                    <span className="glow-orange">{currentPosition.shares}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>COÛT MOY.</span>
                    <span>{formatPrice(currentPosition.avgCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>VALEUR DE MARCHÉ</span>
                    <span>{formatCurrency(currentPosition.currentValue)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#666' }}>P&amp;L LATENT</span>
                    <span className={currentPosition.pnl >= 0 ? 'positive' : 'negative'}>
                      {currentPosition.pnl >= 0 ? '+' : ''}{formatCurrency(currentPosition.pnl)}
                      {' '}({currentPosition.pnlPct >= 0 ? '+' : ''}{currentPosition.pnlPct.toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}

              {/* Buy / Sell toggle */}
              <div style={{ display: 'flex', marginBottom: '10px', gap: '4px' }}>
                {[{ key: 'BUY', label: 'ACHETER' }, { key: 'SELL', label: 'VENDRE' }].map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    style={{
                      flex: 1,
                      padding: '8px',
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: 700,
                      letterSpacing: '0.1em',
                      cursor: 'pointer',
                      border: '1px solid',
                      background: mode === m.key
                        ? (m.key === 'BUY' ? 'rgba(57,255,20,0.15)' : 'rgba(255,34,34,0.15)')
                        : 'transparent',
                      borderColor: mode === m.key
                        ? (m.key === 'BUY' ? 'rgba(57,255,20,0.7)' : 'rgba(255,34,34,0.7)')
                        : 'rgba(255,255,255,0.1)',
                      color: mode === m.key
                        ? (m.key === 'BUY' ? '#00FF66' : '#FF3B30')
                        : '#555',
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Order type */}
              <div style={{ marginBottom: '10px', fontSize: '11px' }}>
                <div style={{ color: '#555', marginBottom: '4px', letterSpacing: '0.1em' }}>TYPE D'ORDRE</div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[{ key: 'MARKET', label: 'MARCHÉ' }, { key: 'LIMIT', label: 'LIMITE' }].map(t => (
                    <button
                      key={t.key}
                      onClick={() => setOrderType(t.key)}
                      style={{
                        padding: '3px 12px',
                        fontFamily: 'inherit',
                        fontSize: '10px',
                        cursor: 'pointer',
                        background: orderType === t.key ? 'rgba(255,102,0,0.15)' : 'transparent',
                        border: '1px solid',
                        borderColor: orderType === t.key ? 'rgba(255,102,0,0.5)' : 'rgba(255,255,255,0.1)',
                        color: orderType === t.key ? '#FF6A00' : '#555',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {t.label}
                    </button>
                  ))}
                  {orderType === 'LIMIT' && (
                    <span style={{ color: '#555', fontSize: '10px', alignSelf: 'center', marginLeft: '4px' }}>
                      (exécuté au marché en simulation)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity input */}
              <div style={{ marginBottom: '8px' }}>
                <div style={{ color: '#555', fontSize: '11px', marginBottom: '4px', letterSpacing: '0.1em' }}>
                  QUANTITÉ {mode === 'SELL' && currentPosition && (
                    <span style={{ color: '#666' }}>/ MAX : {currentPosition.shares}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <input
                    className="bb-input"
                    type="number"
                    min="0"
                    step="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="0"
                    style={{ flex: 1 }}
                  />
                  <button
                    onClick={setMax}
                    style={{
                      padding: '5px 10px',
                      background: 'rgba(255,102,0,0.08)',
                      border: '1px solid rgba(255,102,0,0.3)',
                      color: '#FF6A00',
                      fontFamily: 'inherit',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Quick quantities */}
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                {[1, 5, 10, 25, 50, 100].map(n => (
                  <button
                    key={n}
                    onClick={() => setQuantity(String(n))}
                    style={{
                      padding: '2px 8px',
                      background: 'transparent',
                      border: '1px solid rgba(255,102,0,0.2)',
                      color: '#666',
                      fontFamily: 'inherit',
                      fontSize: '10px',
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Cost summary */}
              {qty > 0 && (
                <div style={{ background: '#050505', border: '1px solid rgba(255,102,0,0.1)', padding: '8px', marginBottom: '10px', fontSize: '11px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#666' }}>SOUS-TOTAL</span>
                    <span>{formatCurrency(totalCost)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ color: '#666' }}>FRAIS (0.15%)</span>
                    <span style={{ color: '#FF6A00' }}>{formatCurrency(fee)}</span>
                  </div>
                  <hr className="bb-sep" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                    <span style={{ color: '#888' }}>{mode === 'BUY' ? 'COÛT TOTAL' : 'PRODUIT NET'}</span>
                    <span className="glow-orange">{formatCurrency(totalWithFee)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', color: '#555', fontSize: '10px' }}>
                    <span>CASH APRÈS</span>
                    <span style={{ color: (state.portfolio.cash - (mode === 'BUY' ? totalWithFee : -totalWithFee)) < 0 ? '#FF3B30' : '#888' }}>
                      {formatCurrency(state.portfolio.cash - (mode === 'BUY' ? totalWithFee : -totalWithFee))}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <button
                className={`bb-btn ${mode === 'BUY' ? 'bb-btn-buy' : 'bb-btn-sell'}`}
                onClick={handleTrade}
                disabled={qty <= 0}
                style={{ width: '100%', opacity: qty <= 0 ? 0.4 : 1 }}
              >
                {mode === 'BUY' ? '▲ ACHETER' : '▼ VENDRE'} {qty || 0} {selectedTicker}
              </button>

              <div style={{ marginTop: '8px', fontSize: '10px', color: '#444', textAlign: 'center' }}>
                CASH DISPONIBLE : <span style={{ color: '#FF6A00' }}>{formatCurrency(state.portfolio.cash)}</span>
              </div>
            </>
          )}
        </div>

        {/* Simulated Order Book */}
        <div style={{ borderTop: '1px solid rgba(255,102,0,0.1)', padding: '8px' }}>
          <div style={{ color: '#555', fontSize: '10px', letterSpacing: '0.1em', marginBottom: '6px' }}>
            CARNET D'ORDRES — {selectedTicker}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {/* Asks */}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#FF3B30', fontSize: '10px', marginBottom: '3px', letterSpacing: '0.08em' }}>VENTE</div>
              {orderBook.asks.slice(0, 5).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '1px' }}>
                  <span style={{ color: '#FF3B30' }}>{row.price.toFixed(2)}</span>
                  <span style={{ color: '#444' }}>{row.size}</span>
                </div>
              ))}
            </div>
            {/* Bids */}
            <div style={{ flex: 1 }}>
              <div style={{ color: '#00FF66', fontSize: '10px', marginBottom: '3px', letterSpacing: '0.08em' }}>ACHAT</div>
              {orderBook.bids.slice(0, 5).map((row, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '1px' }}>
                  <span style={{ color: '#00FF66' }}>{row.price.toFixed(2)}</span>
                  <span style={{ color: '#444' }}>{row.size}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function generateOrderBook(midPrice) {
  const spread = midPrice * 0.0005;
  const asks = Array.from({ length: 5 }, (_, i) => ({
    price: midPrice + spread + i * spread * 0.8,
    size: Math.floor(Math.random() * 900 + 100),
  }));
  const bids = Array.from({ length: 5 }, (_, i) => ({
    price: midPrice - spread - i * spread * 0.8,
    size: Math.floor(Math.random() * 900 + 100),
  }));
  return { asks, bids };
}
