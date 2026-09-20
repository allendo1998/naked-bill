export type Freq = 'weekly' | 'fortnightly' | 'monthly' | 'yearly';
export type Period = 'weekly' | 'monthly' | 'yearly';

export interface Bill {
  id: number;
  name: string;
  amount: string;
  freq: Freq;
}

export const FREQ_LABELS: Record<Freq, string> = {
  weekly: 'Weekly',
  fortnightly: 'Fortnightly',
  monthly: 'Monthly',
  yearly: 'Yearly',
};

export const FREQ_BADGES: Record<Freq, string> = {
  weekly: 'WK',
  fortnightly: 'FN',
  monthly: 'MO',
  yearly: 'YR',
};

export function toAnnual(amount: string | number, freq: Freq): number {
  const n = parseFloat(String(amount)) || 0;
  if (n <= 0) return 0;
  switch (freq) {
    case 'weekly':      return n * 52;
    case 'fortnightly': return n * 26;
    case 'monthly':     return n * 12;
    case 'yearly':      return n;
  }
}

export function fromAnnual(annual: number, period: Period): number {
  switch (period) {
    case 'weekly':  return annual / 52;
    case 'monthly': return annual / 12;
    case 'yearly':  return annual;
  }
}

export function periodLabel(period: Period): string {
  return { weekly: 'week', monthly: 'month', yearly: 'year' }[period];
}

export function fmt(n: number): string {
  if (n === 0) return '$0';
  const abs = Math.abs(n);
  const sign = n < 0 ? '-' : '';
  if (abs < 100) {
    return sign + '$' + abs.toFixed(2).replace(/\.00$/, '');
  }
  return sign + '$' + Math.round(abs).toLocaleString('en-AU');
}

export function getTotalAnnual(bills: Bill[]): number {
  return bills.reduce((sum, b) => sum + toAnnual(b.amount, b.freq), 0);
}

export function generateBarcode(annual: number): string {
  let seed = Math.round(annual * 100) || 12345;
  const lcg = () => { seed = (seed * 1664525 + 1013904223) & 0xffffffff; return Math.abs(seed); };
  let bars = '';
  for (let i = 0; i < 60; i++) {
    bars += lcg() % 4 === 0 ? '█' : lcg() % 3 === 0 ? '▌' : '▍';
  }
  return bars;
}

export function receiptTagline(annual: number): string {
  if (annual === 0)    return 'Add some bills to see where your money goes.';
  if (annual < 5000)   return 'Not bad. Frugal life suits you.';
  if (annual < 15000)  return 'A solid chunk of your year, right there.';
  if (annual < 30000)  return "Half a year's work just to exist.";
  if (annual < 50000)  return "Costs more to live than you'd think.";
  if (annual < 80000)  return 'Expensive taste in bills.';
  if (annual < 100000) return "That's a lot of recurring pain.";
  return 'Six figures. Just to exist. Incredible.';
}
