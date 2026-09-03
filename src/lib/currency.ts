// FINOVA Deterministic Financial Math & Precision Utilities
// Non-negotiable principle: zero floating-point arithmetic on financial amounts.

/**
 * Formats an integer amount in IDR (Indonesian Rupiah) with standard Indonesian grouping (dots).
 * e.g., 1500000000 -> "Rp 1.500.000.000"
 */
export function formatIdr(amount: number | bigint): string {
  const num = typeof amount === 'bigint' ? Number(amount) : amount;
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(absVal);

  return isNegative ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

/**
 * Formats a ratio as an Indonesian percentage string with 1 or 2 decimals.
 * e.g., 0.125 -> "12.5%"
 */
export function formatPercent(ratio: number, decimals: number = 1): string {
  const pct = (ratio * 100).toFixed(decimals);
  return `${pct.replace('.', ',')}%`;
}

/**
 * Calculates variance absolute (current - prior) and percentage.
 * Avoids division by zero.
 */
export function calculateVariance(current: number, prior: number): {
  absoluteVariance: number;
  percentageVariance: number;
} {
  const absoluteVariance = current - prior;
  let percentageVariance = 0;
  if (prior !== 0) {
    percentageVariance = absoluteVariance / Math.abs(prior);
  }
  return { absoluteVariance, percentageVariance };
}

/**
 * Checks if a value is rounded to millions or tens of millions (auditing anomaly check).
 */
export function isSuspiciousRoundNumber(amount: number): boolean {
  const abs = Math.abs(amount);
  if (abs < 10_000_000) return false;
  return abs % 10_000_000 === 0 || abs % 100_000_000 === 0;
}
