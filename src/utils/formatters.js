/**
 * Bloomberg Terminal formatters — dense, professional display
 */

/**
 * Format currency with $ sign and commas
 * Compact for large numbers (1.2M, 45.6K)
 */
export function formatCurrency(value, compact = false) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  if (compact) {
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(2)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
  }
  return value.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Always compact currency — for mobile status bar
 */
export function formatCurrencyCompact(value) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  if (Math.abs(value) >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`;
  if (Math.abs(value) >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  return `$${value.toFixed(0)}`;
}

/**
 * Format price — smart decimal places based on magnitude
 */
export function formatPrice(value) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  if (value >= 1000) return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (value >= 10) return value.toFixed(2);
  if (value >= 1) return value.toFixed(3);
  return value.toFixed(4);
}

/**
 * Format percentage with sign prefix
 */
export function formatPct(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * Format change with sign and color class
 */
export function changeClass(value) {
  if (value > 0) return 'positive';
  if (value < 0) return 'negative';
  return 'neutral';
}

/**
 * Format number with sign
 */
export function formatSigned(value, decimals = 2) {
  if (isNaN(value)) return '--';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}`;
}

/**
 * Format large integers (shares, volume)
 */
export function formatInt(value) {
  if (isNaN(value)) return '--';
  return Math.round(value).toLocaleString('en-US');
}

/**
 * Format Sharpe ratio
 */
export function formatSharpe(value) {
  if (isNaN(value) || !isFinite(value)) return '--';
  return value.toFixed(2);
}

/**
 * Format VaR as percentage
 */
export function formatVaR(value) {
  if (isNaN(value)) return '--';
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format Beta
 */
export function formatBeta(value) {
  if (isNaN(value) || !isFinite(value)) return '--';
  return value.toFixed(2);
}

/**
 * Format drawdown as percentage
 */
export function formatDrawdown(value) {
  if (isNaN(value)) return '--';
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Simulate game date (start: Jan 2, 2024)
 */
const BASE_DATE = new Date('2024-01-02');
export function gameDate(dayOffset) {
  const d = new Date(BASE_DATE);
  // Skip weekends
  let tradingDays = 0;
  while (tradingDays < dayOffset) {
    d.setDate(d.getDate() + 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) tradingDays++;
  }
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format timestamp for news
 */
export function formatNewsTime(date) {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
