import { createContext, useContext, useReducer, useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { INITIAL_ASSETS, TICKERS } from '../data/assets';
import { nextPrice, generatePriceHistory, calcDayChange, applyNewsShock } from '../utils/priceSimulation';
import { getRandomNews } from '../data/news';

const GameContext = createContext(null);

// ── Constants ──────────────────────────────────────────────────────────────
export const STARTING_CASH = 100_000;
export const TRANSACTION_FEE = 0.0015; // 0.15%
const BASE_TICK_MS = 6000; // 6 real seconds = 1 trading day at ×1 speed
const SAVE_KEY = 'jeu-finance-v3';

// ── Asset Builder ──────────────────────────────────────────────────────────
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
      flashDirection: null,
    };
  }
  return assets;
}

// ── Initial State ──────────────────────────────────────────────────────────
const INITIAL_STATE = {
  gameDay: 0,
  marketOpen: true,
  running: true,
  portfolio: {
    cash: STARTING_CASH,
    positions: {}, // { ticker: { shares, avgCost, stopLoss?, takeProfit? } }
    history: [{ day: 0, value: STARTING_CASH }],
    dailyReturns: [],
  },
  assets: buildInitialAssets(),
  news: [],
  notification: null,
  tradeHistory: [], // [{ id, day, type, ticker, shares, price, total, pnl? }]
  goals: {
    target1: STARTING_CASH * 1.2,
    target2: STARTING_CASH * 1.5,
    target3: STARTING_CASH * 2.0,
    achieved: [],
  },
};

// ── Selectors ──────────────────────────────────────────────────────────────
export function selectPortfolioValue(state) {
  let invested = 0;
  for (const [ticker, pos] of Object.entries(state.portfolio.positions)) {
    const asset = state.assets[ticker];
    if (asset) invested += asset.currentPrice * pos.shares;
  }
  return state.portfolio.cash + invested;
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
  const spy = state.assets.SPY;
  if (!spy) return STARTING_CASH;
  return STARTING_CASH * (spy.currentPrice / INITIAL_ASSETS.SPY.price);
}

// ── Helper: execute a sell in place (used for SL/TP and SELL_ASSET) ───────
function executeSell(portfolio, assets, ticker, shares, day, reason) {
  const asset = assets[ticker];
  const pos = portfolio.positions[ticker];
  if (!asset || !pos || pos.shares < shares) return null;

  const proceeds = asset.currentPrice * shares;
  const fee = proceeds * TRANSACTION_FEE;
  const netProceeds = proceeds - fee;
  const costBasis = pos.avgCost * shares;
  const pnl = netProceeds - costBasis;
  const remainingShares = pos.shares - shares;

  const newPositions = { ...portfolio.positions };
  if (remainingShares <= 0) {
    delete newPositions[ticker];
  } else {
    newPositions[ticker] = { ...pos, shares: remainingShares };
  }

  const tradeEntry = {
    id: Date.now() + Math.random(),
    day,
    type: reason, // 'VENTE', 'STOP-LOSS', 'TAKE-PROFIT'
    ticker,
    shares,
    price: asset.currentPrice,
    total: netProceeds,
    pnl,
  };

  return {
    newPortfolio: { ...portfolio, cash: portfolio.cash + netProceeds, positions: newPositions },
    tradeEntry,
    netProceeds,
    notification: {
      message: reason === 'VENTE'
        ? `VENTE ${shares} ${ticker} @ $${asset.currentPrice.toFixed(2)} — NET : $${netProceeds.toFixed(2)}`
        : `⚡ ${reason} déclenché — ${ticker} @ $${asset.currentPrice.toFixed(2)}`,
      type: reason === 'STOP-LOSS' ? 'sell' : 'sell',
    },
  };
}

// ── Reducer ────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {

    case 'TICK': {
      const { newAssets, newsItem, autoSells } = action.payload;
      let newPortfolio = { ...state.portfolio };
      let newTradeHistory = state.tradeHistory;
      let autoNotification = null;

      // Auto-execute Stop-Loss / Take-Profit
      if (autoSells && autoSells.length > 0) {
        for (const { ticker, shares, reason } of autoSells) {
          const result = executeSell(newPortfolio, newAssets, ticker, shares, state.gameDay + 1, reason);
          if (result) {
            newPortfolio = result.newPortfolio;
            newTradeHistory = [result.tradeEntry, ...newTradeHistory].slice(0, 200);
            autoNotification = result.notification;
          }
        }
      }

      // Compute new portfolio value after auto-sells
      let invested = 0;
      for (const [ticker, pos] of Object.entries(newPortfolio.positions)) {
        const asset = newAssets[ticker];
        if (asset) invested += asset.currentPrice * pos.shares;
      }
      const totalValue = newPortfolio.cash + invested;
      const prevValue = newPortfolio.history[newPortfolio.history.length - 1]?.value ?? totalValue;
      const dailyReturn = prevValue > 0 ? (totalValue - prevValue) / prevValue : 0;

      newPortfolio = {
        ...newPortfolio,
        history: [...newPortfolio.history, { day: state.gameDay + 1, value: totalValue }],
        dailyReturns: [...newPortfolio.dailyReturns, dailyReturn],
      };

      // Goal achievements
      const newAchieved = [...state.goals.achieved];
      const goalChecks = [
        { key: 'g1', value: state.goals.target1 },
        { key: 'g2', value: state.goals.target2 },
        { key: 'g3', value: state.goals.target3 },
      ];
      for (const g of goalChecks) {
        if (totalValue >= g.value && !newAchieved.includes(g.key)) {
          newAchieved.push(g.key);
        }
      }

      // News
      const newNews = newsItem
        ? [{ ...newsItem, id: Date.now(), timestamp: new Date() }, ...state.news].slice(0, 30)
        : state.news;

      return {
        ...state,
        gameDay: state.gameDay + 1,
        assets: newAssets,
        portfolio: newPortfolio,
        news: newNews,
        tradeHistory: newTradeHistory,
        goals: { ...state.goals, achieved: newAchieved },
        notification: autoNotification ?? state.notification,
      };
    }

    case 'BUY_ASSET': {
      const { ticker, shares, stopLoss, takeProfit } = action.payload;
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

      const tradeEntry = {
        id: Date.now() + Math.random(),
        day: state.gameDay,
        type: 'ACHAT',
        ticker,
        shares,
        price: asset.currentPrice,
        total: totalWithFee,
        pnl: null,
      };

      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          cash: state.portfolio.cash - totalWithFee,
          positions: {
            ...state.portfolio.positions,
            [ticker]: {
              shares: newShares,
              avgCost: newAvgCost,
              stopLoss: stopLoss || existing?.stopLoss || null,
              takeProfit: takeProfit || existing?.takeProfit || null,
            },
          },
        },
        tradeHistory: [tradeEntry, ...state.tradeHistory].slice(0, 200),
        notification: {
          message: `ACHAT ${shares} ${ticker} @ $${asset.currentPrice.toFixed(2)} — FRAIS : $${fee.toFixed(2)}`,
          type: 'buy',
        },
      };
    }

    case 'SELL_ASSET': {
      const { ticker, shares } = action.payload;
      const result = executeSell(state.portfolio, state.assets, ticker, shares, state.gameDay, 'VENTE');
      if (!result) {
        return { ...state, notification: { message: 'ACTIONS INSUFFISANTES', type: 'error' } };
      }
      return {
        ...state,
        portfolio: result.newPortfolio,
        tradeHistory: [result.tradeEntry, ...state.tradeHistory].slice(0, 200),
        notification: result.notification,
      };
    }

    case 'SET_SL_TP': {
      const { ticker, stopLoss, takeProfit } = action.payload;
      const pos = state.portfolio.positions[ticker];
      if (!pos) return state;
      return {
        ...state,
        portfolio: {
          ...state.portfolio,
          positions: {
            ...state.portfolio.positions,
            [ticker]: { ...pos, stopLoss: stopLoss ?? null, takeProfit: takeProfit ?? null },
          },
        },
      };
    }

    case 'CLEAR_NOTIFICATION':
      return { ...state, notification: null };

    case 'TOGGLE_MARKET':
      return { ...state, marketOpen: !state.marketOpen };

    case 'TOGGLE_RUNNING':
      return { ...state, running: !state.running };

    case 'RESET_GAME':
      return { ...INITIAL_STATE, assets: buildInitialAssets() };

    default:
      return state;
  }
}

// ── Provider ───────────────────────────────────────────────────────────────
export function GameProvider({ children }) {
  // Load saved state from localStorage
  const savedData = useMemo(() => {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Validate structure minimally
      if (!parsed?.state?.portfolio || !parsed?.state?.assets) return null;
      return parsed;
    } catch { return null; }
  }, []);

  const [state, dispatch] = useReducer(reducer, savedData?.state ?? INITIAL_STATE);
  const [speed, setSpeedState] = useState(savedData?.speed ?? 1);

  const stateRef = useRef(state);
  stateRef.current = state;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  // Auto-save on every state or speed change
  useEffect(() => {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({ state, speed }));
    } catch { /* quota exceeded — ignore */ }
  }, [state, speed]);

  // Simulation loop — restarts when running state or speed changes
  useEffect(() => {
    if (!state.running) return;

    const interval = setInterval(() => {
      const current = stateRef.current;
      if (!current.running) return;

      // ~12% chance per tick to generate a news event
      const shouldGenerateNews = Math.random() < 0.12;
      const newsItem = shouldGenerateNews ? getRandomNews() : null;

      // Update all asset prices
      const newAssets = {};
      for (const ticker of TICKERS) {
        const asset = current.assets[ticker];
        let shockMult = 1;

        if (newsItem && (newsItem.affectedTickers.length === 0 || newsItem.affectedTickers.includes(ticker))) {
          const shock = applyNewsShock(newsItem.direction, newsItem.impact);
          shockMult = Math.abs(shock - 1) * 10 + 1;
        }

        const newPrice = current.marketOpen
          ? nextPrice(asset.currentPrice, asset, shockMult)
          : asset.currentPrice;

        const change = newPrice - asset.prevPrice;
        const changePct = calcDayChange(newPrice, asset.prevPrice);

        newAssets[ticker] = {
          ...asset,
          prevPrice: asset.currentPrice,
          currentPrice: newPrice,
          change,
          changePct,
          history: [...asset.history.slice(-59), newPrice],
          flashDirection: change > 0 ? 'up' : change < 0 ? 'down' : null,
        };
      }

      // Detect Stop-Loss / Take-Profit triggers
      const autoSells = [];
      for (const [ticker, pos] of Object.entries(current.portfolio.positions)) {
        const newPrice = newAssets[ticker]?.currentPrice;
        if (!newPrice || !pos.shares) continue;
        if (pos.stopLoss && newPrice <= pos.stopLoss) {
          autoSells.push({ ticker, shares: pos.shares, reason: 'STOP-LOSS' });
        } else if (pos.takeProfit && newPrice >= pos.takeProfit) {
          autoSells.push({ ticker, shares: pos.shares, reason: 'TAKE-PROFIT' });
        }
      }

      dispatch({ type: 'TICK', payload: { newAssets, newsItem, autoSells } });
    }, BASE_TICK_MS / speedRef.current);

    return () => clearInterval(interval);
  }, [state.running, speed]);

  // Auto-clear notifications
  useEffect(() => {
    if (state.notification) {
      const timer = setTimeout(() => dispatch({ type: 'CLEAR_NOTIFICATION' }), 3500);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  const buy = useCallback((ticker, shares, stopLoss, takeProfit) =>
    dispatch({ type: 'BUY_ASSET', payload: { ticker, shares, stopLoss, takeProfit } }), []);

  const sell = useCallback((ticker, shares) =>
    dispatch({ type: 'SELL_ASSET', payload: { ticker, shares } }), []);

  const setSLTP = useCallback((ticker, stopLoss, takeProfit) =>
    dispatch({ type: 'SET_SL_TP', payload: { ticker, stopLoss, takeProfit } }), []);

  const toggleMarket = useCallback(() => dispatch({ type: 'TOGGLE_MARKET' }), []);
  const toggleRunning = useCallback(() => dispatch({ type: 'TOGGLE_RUNNING' }), []);

  const setSpeed = useCallback((s) => setSpeedState(s), []);

  const resetGame = useCallback(() => {
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return (
    <GameContext.Provider value={{
      state, dispatch,
      buy, sell, setSLTP,
      toggleMarket, toggleRunning,
      speed, setSpeed,
      resetGame,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
