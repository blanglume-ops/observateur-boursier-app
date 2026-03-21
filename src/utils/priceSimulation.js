// Geometric Brownian Motion price simulation
// dS = S * (µ*dt + σ*√dt*Z)  where Z ~ N(0,1)

const DT = 1 / 252; // 1 trading day

/**
 * Box-Muller transform: generate standard normal random variable
 */
function gaussianRandom() {
  let u, v;
  do {
    u = Math.random();
  } while (u === 0);
  v = Math.random();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/**
 * Calculate next price using GBM
 * @param {number} currentPrice
 * @param {object} params - { drift, volatility }
 * @param {number} [shockMultiplier=1] - amplify volatility for news events
 * @returns {number} next price
 */
export function nextPrice(currentPrice, { drift, volatility }, shockMultiplier = 1) {
  const sigma = volatility * shockMultiplier;
  const Z = gaussianRandom();
  const logReturn = (drift - 0.5 * sigma * sigma) * DT + sigma * Math.sqrt(DT) * Z;
  const newPrice = currentPrice * Math.exp(logReturn);
  // Floor at 1% of initial to avoid zero/negative prices
  return Math.max(newPrice, currentPrice * 0.001);
}

/**
 * Generate initial price history (60 data points going backwards from current price)
 * Used to populate sparkline charts on startup
 */
export function generatePriceHistory(currentPrice, params, points = 60) {
  const history = [currentPrice];
  // Generate backwards using reversed GBM
  for (let i = 1; i < points; i++) {
    const prev = history[0];
    const Z = gaussianRandom();
    const reversedDrift = -(params.drift - 0.5 * params.volatility ** 2) * DT;
    const shock = params.volatility * Math.sqrt(DT) * Z;
    const past = prev * Math.exp(reversedDrift + shock);
    history.unshift(Math.max(past, 0.01));
  }
  return history;
}

/**
 * Apply a news shock to a set of prices
 * Returns a multiplier to apply to the price change this tick
 */
export function applyNewsShock(direction, impactFactor) {
  // Convert direction + impact to a price multiplier
  // direction: 1 = bullish (+), -1 = bearish (-), 0 = neutral
  // impactFactor: 0.5 - 3.0 from news templates
  const baseShock = 0.015 * impactFactor; // 1.5% per unit of impact
  const sign = direction === 0 ? (Math.random() > 0.5 ? 1 : -1) : direction;
  const noise = (Math.random() * 0.4 + 0.8); // 80-120% noise factor
  return 1 + sign * baseShock * noise;
}

/**
 * Calculate daily P&L percentage for display
 */
export function calcDayChange(currentPrice, previousPrice) {
  if (!previousPrice || previousPrice === 0) return 0;
  return ((currentPrice - previousPrice) / previousPrice) * 100;
}

/**
 * Portfolio risk metrics
 */
export function calcSharpeRatio(returns, riskFreeRate = 0.05 / 252) {
  if (!returns || returns.length < 2) return 0;
  const avg = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance = returns.reduce((s, r) => s + (r - avg) ** 2, 0) / (returns.length - 1);
  const stdDev = Math.sqrt(variance);
  if (stdDev === 0) return 0;
  return ((avg - riskFreeRate) / stdDev) * Math.sqrt(252);
}

export function calcMaxDrawdown(valueHistory) {
  if (!valueHistory || valueHistory.length < 2) return 0;
  let peak = valueHistory[0];
  let maxDD = 0;
  for (const val of valueHistory) {
    if (val > peak) peak = val;
    const dd = (peak - val) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  return maxDD;
}

export function calcVaR(returns, confidence = 0.95) {
  if (!returns || returns.length < 10) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  return Math.abs(sorted[idx] || 0);
}

export function calcBeta(portfolioReturns, benchmarkReturns) {
  if (!portfolioReturns || !benchmarkReturns || portfolioReturns.length < 10) return 1;
  const len = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const pr = portfolioReturns.slice(-len);
  const br = benchmarkReturns.slice(-len);
  const prMean = pr.reduce((s, r) => s + r, 0) / len;
  const brMean = br.reduce((s, r) => s + r, 0) / len;
  const cov = pr.reduce((s, r, i) => s + (r - prMean) * (br[i] - brMean), 0) / (len - 1);
  const varBr = br.reduce((s, r) => s + (r - brMean) ** 2, 0) / (len - 1);
  return varBr === 0 ? 1 : cov / varBr;
}
