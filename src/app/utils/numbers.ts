import Decimal from 'break_eternity.js';
export { Decimal };
export function formatNumber(value: Decimal | number, decimals: number = 2): string {
  const num = value instanceof Decimal ? value : new Decimal(value);
  if (num.gte(new Decimal('1e66'))) {
    return num.toExponential(decimals);
  }
  const suffixes = [
    { threshold: new Decimal('1e63'), divisor: new Decimal('1e63'), suffix: 'Vg' },     // Vigintillion
    { threshold: new Decimal('1e60'), divisor: new Decimal('1e60'), suffix: 'Nd' },     // Novemdecillion
    { threshold: new Decimal('1e57'), divisor: new Decimal('1e57'), suffix: 'Od' },     // Octodecillion
    { threshold: new Decimal('1e54'), divisor: new Decimal('1e54'), suffix: 'Sd' },     // Septendecillion
    { threshold: new Decimal('1e51'), divisor: new Decimal('1e51'), suffix: 'Sxd' },    // Sexdecillion
    { threshold: new Decimal('1e48'), divisor: new Decimal('1e48'), suffix: 'Qd' },     // Quindecillion
    { threshold: new Decimal('1e45'), divisor: new Decimal('1e45'), suffix: 'Qtd' },    // Quattuordecillion
    { threshold: new Decimal('1e42'), divisor: new Decimal('1e42'), suffix: 'Td' },     // Tredecillion
    { threshold: new Decimal('1e39'), divisor: new Decimal('1e39'), suffix: 'Dd' },     // Duodecillion
    { threshold: new Decimal('1e36'), divisor: new Decimal('1e36'), suffix: 'Ud' },     // Undecillion
    { threshold: new Decimal('1e33'), divisor: new Decimal('1e33'), suffix: 'Dc' },     // Decillion
    { threshold: new Decimal('1e30'), divisor: new Decimal('1e30'), suffix: 'N' },      // Nonillion
    { threshold: new Decimal('1e27'), divisor: new Decimal('1e27'), suffix: 'O' },      // Octillion
    { threshold: new Decimal('1e24'), divisor: new Decimal('1e24'), suffix: 'Sp' },     // Septillion
    { threshold: new Decimal('1e21'), divisor: new Decimal('1e21'), suffix: 'Sx' },     // Sextillion
    { threshold: new Decimal('1e18'), divisor: new Decimal('1e18'), suffix: 'Qi' },     // Quintillion
    { threshold: new Decimal('1e15'), divisor: new Decimal('1e15'), suffix: 'Q' },      // Quadrillion
    { threshold: new Decimal('1e12'), divisor: new Decimal('1e12'), suffix: 'T' },      // Trillion
    { threshold: new Decimal('1e9'), divisor: new Decimal('1e9'), suffix: 'B' },        // Billion
    { threshold: new Decimal('1e6'), divisor: new Decimal('1e6'), suffix: 'M' },        // Million
    { threshold: new Decimal('1e3'), divisor: new Decimal('1e3'), suffix: 'K' }         // Thousand
  ];
  for (const { threshold, divisor, suffix } of suffixes) {
    if (num.gte(threshold)) {
      return num.dividedBy(divisor).toFixed(decimals) + suffix;
    }
  }
  return num.toFixed(decimals);
}
export function formatRate(value: Decimal | number): string {
  return formatNumber(value, 2);
}
export function decimal(value: number | string | Decimal): Decimal {
  if (value instanceof Decimal) {
    return value;
  }
  return new Decimal(value);
}