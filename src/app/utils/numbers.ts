import Decimal from 'break_eternity.js';

export { Decimal };

/**
 * Format a Decimal number for display
 * Returns formatted string with suffixes for large numbers
 */
export function formatNumber(value: Decimal | number, decimals: number = 2): string {
  const num = value instanceof Decimal ? value : new Decimal(value);
  
  if (num.gte(1e12)) {
    // Use scientific notation for extremely large numbers
    return num.toExponential(2);
  }
  
  if (num.gte(1e9)) {
    return num.dividedBy(1e9).toFixed(decimals) + 'B';
  }
  
  if (num.gte(1e6)) {
    return num.dividedBy(1e6).toFixed(decimals) + 'M';
  }
  
  if (num.gte(1e3)) {
    return num.dividedBy(1e3).toFixed(decimals) + 'K';
  }
  
  return num.toFixed(decimals);
}

/**
 * Format a production rate for display
 */
export function formatRate(value: Decimal | number): string {
  return formatNumber(value, 2);
}

/**
 * Create a Decimal from a number or string
 */
export function decimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}
