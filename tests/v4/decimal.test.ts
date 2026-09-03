import { describe, it, expect } from 'vitest';
import { DecimalMoney, formatIdrNumber, calculateVariance, isSuspiciousRoundNumber } from '@/lib/decimal';

describe('R05 / PRD §41.1: Fixed-Precision Decimal & Money Handling', () => {
  it('eliminates floating point drift in addition and subtraction', () => {
    // 0.1 + 0.2 in standard JS float is 0.30000000000000004
    const a = DecimalMoney.from(100_000_000);
    const b = DecimalMoney.from(200_000_000);
    const sum = a.add(b);
    expect(sum.toNumber()).toBe(300_000_000);

    const sub = sum.subtract(a);
    expect(sub.toNumber()).toBe(200_000_000);
  });

  it('handles multiplication and fixed-scale division accurately', () => {
    const principal = DecimalMoney.from(1_000_000_000);
    const result = principal.multiply(0.22); // 22% rate
    expect(result.toNumber()).toBe(220_000_000);

    const divided = result.divide(2);
    expect(divided.toNumber()).toBe(110_000_000);
  });

  it('throws typed error on division by zero', () => {
    const val = DecimalMoney.from(500_000);
    expect(() => val.divide(0)).toThrow('Division by zero');
  });

  it('formats positive and negative IDR amounts according to Indonesian financial conventions', () => {
    expect(formatIdrNumber(250_000_000)).toBe('Rp 250.000.000');
    expect(formatIdrNumber(-150_000_000)).toBe('(Rp 150.000.000)');
    expect(formatIdrNumber(0)).toBe('Rp 0');
  });

  it('calculates variance amount and percentage correctly', () => {
    const variance = calculateVariance(10_000_000_000, 8_000_000_000);
    expect(variance.amount).toBe(2_000_000_000);
    expect(variance.percentage).toBe(25); // +25.0%

    const noPrior = calculateVariance(5_000_000);
    expect(noPrior.percentage).toBeNull();
  });

  it('detects suspicious round number anomalies at configured threshold', () => {
    expect(isSuspiciousRoundNumber(500_000_000)).toBe(true);
    expect(isSuspiciousRoundNumber(70_000_000)).toBe(true);
    expect(isSuspiciousRoundNumber(12_438_500)).toBe(false);
    expect(isSuspiciousRoundNumber(20_000_000)).toBe(false); // below 50M threshold
  });
});
