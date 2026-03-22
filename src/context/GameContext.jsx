import { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import { INITIAL_ASSETS, TICKERS } from '../data/assets';
import { nextPrice, generatePriceHistory, calcDayChange, applyNewsShock } from '../utils/priceSimulation';
import { getRandomNews } from '../data/news';

const GameContext = createContext(null);

// ── Initial State ──────────────────────────────────────────────────────────────
export const STARTING_CASH = 100_000;
const TICK_INTERVAL_MS = 6000; // 6 real seconds = 1 trading day
const TRANSACTION_FEE = 0.0015; // 0.15%

function buildInitialAssets() {
  const assets = {};
  for (const ticker of TICKERS) {
    const def = INITIAL_ASSETS[ticker];
    const history = generatePriceHistory(def.price, def, 60);
    assets[ticker] = {
      ...def,
      currentPrice: def.price,
      prevPrice: def.price,
      change: 0,
      changePct: 0,
      history,
      flashDirection: null, // 'up' | 'down' | null
    };
  }
  return assets;
}

const INITIAL_STATE = {
  gameDay: 0,
  marketOpen: true,
  running: true,
  portfolio: {
    cash: STARTING_CASH,
    positions: {}, // { ticker: { shares, avgCost } }
    history: [{ day: 0, value: STARTING_CASH }], // equity curve
    dailyReturns: [], // for Sharpe/VaR calc
  },
  assets: buildInitialAssets(),
  news: [],
  notification: null, // { message, type } for trade confirmations
  goals: {
    target1: STARTING_CASH * 1.2,  // +20%
    target2: STARTING_CASH * 1.5,  // +50%
    target3: STARTING_CASH * 2.0,  // +100% (légendaire)
    achieved: [],
  },
};

// ── Selectors (computed from state) ──────────────────────────────────────────
export function selectPortfolioValue(state) {
  const { portfolio, assets } = state;
  let invested = 0;
  for (const [ticker, pos] of Object.entries(portfolio.positions)) {
    const asset = assets[ticker];
    if (asset) invested += asset.currentPrice * pos.shares;
  }
  return portfolio.cash + invested;
}

export function selectPositions(state) {
  return Object.entries(state.portfolio.positions).map(([ticker, pos]) => {
    const asset = state.assets[ticker];
    const currentValue = asset ? asset.currentPrice * pos.shares : 0;
    const costBasis = pos.avgCost * pos.shares;
    const pnl = currentValue - costBasis;
    const pnlPct = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ticker, ...pos, currentValue, costBasis, pnl, pnlPct, asset };
  }).filter(p => p.shares > 0);
}

export function selectTotalPnL(state) {
  return selectPortfolioValue(state) - STARTING_CASH;
}

export function selectBenchmarkValue(state) {
  // SPY benchmark: started at 510.25, track its evolution
  const spy = state.assets.SPY;
  if (!spy) return STARTING_CASH;
  const spyReturn = spy.currentPrice / INITIAL_ASSETS.SPY.price;
  return STARTING_CASH * spyReturn;
}

// ── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'TICK': {
      const { newAssets, newsItem } = action.payload;
      const newPortfolio = { ...state.portfolio };

      // Compute new portfolio value
      let invested = 0;
      for (const [ticker, pos] of Object.entries(newPortfolio.positions)) {
        const asset = newAssets[ticker];
        if (asset) invested += asset.currentPrice * pos.shares;
      }
      const totalValue = newPortfolio.cash + invested;
      const prevValue = newPortfolio.history[newPortfolio.history.length - 1]?.value ?? totalValue;
      const dailyReturn = prevValue > 0 ? (totalValue - prevValue) / prevValue : 0;

      const newHistory = [...newPortfolio.history, { day: state.gameDay + 1, value: totalValue }];
      const newDailyReturns = [...newPortfolio.dailyReturns, dailyReturn];

      const updatedPortfolio = {
        ...newPortfolio,
        history: newHistory,
        dailyReturns: newDailyReturns,
      };

      // Check goal achievements
      const newAchieved = [...state.goals.achieved];
      const goals = [
        { key: 'g1', value: state.goals.target1, label: 'NIVEAU 1: +20%' },
        { key: 'g2', value: state.goals.target2, label: 'NIVEAU 2: +50%' },
        { key: 'g3', value: state.goals.target3, label: 'NIVEAU 3: +100%' },
      ];
      for (const g of goals) {
        if (totalValue >= g.value && !newAchieved.includes(g.key)) {
          newAchieved.push(g.key);
        }
      }

      // Add news to feed
      const newNews = newsItem
        ? [{ ...newsItem, id: Date.now(), timestamp: new Date() }, ...state.news].slice(0, 30)
        : state.news;

      return {
        ...state,
        gameDay: state.gameDay + 1,
        assets: newAssets,
        portfolio: updatedPortfolio,
        news: newNews,
        goals: { ...state.goals, achieved: newAchieved },
      };
    }

    case 'BUY_ASSET': {
      const { ticker, shares } = action.payload;
      const asset = state.assets[ticker];
      if (!asset) return state;

      const totalCost = asset.currentPrice * shares;
      const fee = totalCost * TRANSACTION_FEE;
      const totalWithFee = totalCost + fee;

      if (totalWithFee > state.portfolio.cash) {
        return { ...state, notification: { message: 'FONDS INSUFFISANTS', type: 'error' } };
      }

      const existing = state.portfolio.positions[ticker];
      const newShares = (existing?.shares ?? 0) + shares;
      const newAvgCost = existing
        ? (existing.avgCost * existing.shares + asset.currentPrice * shares) / newShares
        : asset.currentPrice;

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          cash: state.portfolio.cash - totalWithFee,
          positions: {
            ...state.portfolio.positions,
            [ticker]: { shares: newShares, avgCost: newAvgCost },
          },
        },
        notification: {
          message: `ACHAT ${shares} ${ticker} @ ${asset.currentPrice.toFixed(2)} — FRAIS : $${fee.toFixed(2)}`,
          type: 'buy',
        },
      };
    }

    case 'SELL_ASSET': {
      const { ticker, shares } = action.payload;
      const asset = state.assets[ticker];
      const position = state.portfolio.positions[ticker];
      if (!asset || !position || position.shares < shares) {
        return { ...state, notification: { message: 'ACTIONS INSUFFISANTES', type: 'error' } };
      }

      const proceeds = asset.currentPrice * shares;
      const fee = proceeds * TRANSACTION_FEE;
      const netProceeds = proceeds - fee;
      const remainingShares = position.shares - shares;

      const newPositions = { ...state.portfolio.positions };
      if (remainingShares <= 0) {
        delete newPositions[ticker];
      } else {
        newPositions[ticker] = { ...position, shares: remainingShares };
      }

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          cash: state.portfolio.cash + netProceeds,
          positions: newPositions,
        },
        notification: {
          message: `VENTE ${shares} ${ticker} @ ${asset.currentPrice.toFixed(2)} — NET : $${netProceeds.toFixed(2)}`,
          type: 'sell',
        },
      };
    }

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'TOGGLE_MARKET':
      return { ...state, marketOpen: !state.marketOpen };

    case 'TOGGLE_RUNNING':
      return { ...state, running: !state.running };

    default:
      return state;
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Simulation loop
  useEffect(() => {
    if (!state.running) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!current.running) return;

      // Generate news every ~8 ticks (16 seconds)
      const shouldGenerateNews = Math.random() < 0.12;
      const newsItem = shouldGenerateNews ? getRandomNews() : null;

      // Update all asset prices
      const newAssets = {};
      for (const ticker of TICKERS) {
        const asset = current.assets[ticker];
        let shockMult = 1;

        // Apply news shock if this ticker is affected
        if (newsItem && (newsItem.affectedTickers.length === 0 || newsItem.affectedTickers.includes(ticker))) {
          const shock = applyNewsShock(newsItem.direction, newsItem.impact);
          shockMult = Math.abs(shock - 1) * 10 + 1; // convert multiplier to volatility boost
        }

        const newPrice = current.marketOpen
          ? nextPrice(asset.currentPrice, asset, shockMult)
          : asset.currentPrice;

        const change = newPrice - asset.prevPrice;
        const changePct = calcDayChange(newPrice, asset.prevPrice);
        const newHistory = [...asset.history.slice(-59), newPrice];

        newAssets[ticker] = {
          ...asset,
          prevPrice: asset.currentPrice,
          currentPrice: newPrice,
          change,
          changePct,
          history: newHistory,
          flashDirection: change > 0 ? 'up' : change < 0 ? 'down' : null,
        };
      }

      dispatch({ type: 'TICK', payload: { newAssets, newsItem } });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [state.running]);

  // Auto-clear flash direction after animation
  useEffect(() => {
    const timer = setTimeout(() => {
      // Flash duration handled by CSS animation, no state needed
    }, 700);
    return () => clearTimeout(timer);
  }, [state.gameDay]);

  // Auto-clear notifications
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  const buy = useCallback((ticker, shares) => dispatch({ type: 'BUY_ASSET', payload: { ticker, shares } }), []);
  const sell = useCallback((ticker, shares) => dispatch({ type: 'SELL_ASSET', payload: { ticker, shares } }), []);
  const toggleMarket = useCallback(() => dispatch({ type: 'TOGGLE_MARKET' }), []);
  const toggleRunning = useCallback(() => dispatch({ type: 'TOGGLE_RUNNING' }), []);

  return (
    <GameContext.Provider value={{ state, dispatch, buy, sell, toggleMarket, toggleRunning }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}

export { TRANSACTION_FEE };
