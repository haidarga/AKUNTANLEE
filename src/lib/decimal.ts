// FINOVA AI v4.0 — Fixed-Precision Decimal & Currency Handling
// Eliminates IEEE 754 floating point drift for all financial calculations.

export class DecimalMoney {
  // Stored as integer Rupiah (or integer units)
  private readonly value: bigint;

  constructor(val: number | string | bigint) {
    if (typeof val === 'bigint') {
      this.value = val;
    } else if (typeof val === 'number') {
      if (!Number.isFinite(val) || Number.isNaN(val)) {
        throw new Error(`Invalid numeric amount: ${val}`);
      }
      this.value = BigInt(Math.round(val));
    } else {
      const clean = val.replace(/[^0-9.-]/g, '').trim();
      if (!clean) {
        this.value = 0n;
      } else {
        const parsed = parseFloat(clean);
        if (Number.isNaN(parsed)) {
          throw new Error(`Cannot parse string into decimal amount: "${val}"`);
        }
        this.value = BigInt(Math.round(parsed));
      }
    }
  }

  static from(val: number | string | bigint): DecimalMoney {
    return new DecimalMoney(val);
  }

  static zero(): DecimalMoney {
    return new DecimalMoney(0n);
  }

  toNumber(): number {
    return Number(this.value);
  }

  toBigInt(): bigint {
    return this.value;
  }

  add(other: DecimalMoney | number | string): DecimalMoney {
    const o = other instanceof DecimalMoney ? other : DecimalMoney.from(other);
    return new DecimalMoney(this.value + o.value);
  }

  subtract(other: DecimalMoney | number | string): DecimalMoney {
    const o = other instanceof DecimalMoney ? other : DecimalMoney.from(other);
    return new DecimalMoney(this.value - o.value);
  }

  multiply(factor: number): DecimalMoney {
    if (!Number.isFinite(factor) || Number.isNaN(factor)) {
      throw new Error(`Cannot multiply by invalid factor: ${factor}`);
    }
    // Fixed scale calculation using 10,000 multiplier
    const scaled = BigInt(Math.round(factor * 10000));
    return new DecimalMoney((this.value * scaled) / 10000n);
  }

  divide(divisor: number): DecimalMoney {
    if (divisor === 0 || !Number.isFinite(divisor) || Number.isNaN(divisor)) {
      throw new Error('Division by zero or invalid divisor');
    }
    const scaled = BigInt(Math.round(divisor * 10000));
    return new DecimalMoney((this.value * 10000n) / scaled);
  }

  abs(): DecimalMoney {
    return new DecimalMoney(this.value < 0n ? -this.value : this.value);
  }

  isZero(): boolean {
    return this.value === 0n;
  }

  isNegative(): boolean {
    return this.value < 0n;
  }

  equals(other: DecimalMoney | number): boolean {
    const o = other instanceof DecimalMoney ? other : DecimalMoney.from(other);
    return this.value === o.value;
  }

  formatIdr(): string {
    return formatIdrNumber(this.toNumber());
  }
}

export function formatIdrNumber(amount: number): string {
  const isNeg = amount < 0;
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(abs);

  return isNeg ? `(Rp ${formatted})` : `Rp ${formatted}`;
}

export function calculateVariance(
  current: number,
  prior?: number
): { amount: number; percentage: number | null } {
  if (prior === undefined || prior === null) {
    return { amount: 0, percentage: null };
  }
  const curr = DecimalMoney.from(current);
  const pri = DecimalMoney.from(prior);
  const diff = curr.subtract(pri).toNumber();

  if (pri.isZero()) {
    return { amount: diff, percentage: null };
  }

  const pct = (diff / Math.abs(pri.toNumber())) * 100;
  return {
    amount: diff,
    percentage: Math.round(pct * 10) / 10,
  };
}

export function isSuspiciousRoundNumber(amount: number, thresholdIdr = 50_000_000): boolean {
  const abs = Math.abs(Math.round(amount));
  if (abs < thresholdIdr) return false;
  return abs % 10_000_000 === 0;
}
