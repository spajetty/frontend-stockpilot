import type { CartLine } from './useCart';

export interface Totals { subtotal: number; discount: number; tax: number; total: number; units: number }

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function calcTotals(lines: CartLine[], discountInput: number, taxRatePct: number): Totals {
  const subtotal = round2(lines.reduce((s, l) => s + round2(l.price * l.qty), 0));
  const discount = round2(Math.min(Math.max(discountInput || 0, 0), subtotal));
  const tax = round2(((subtotal - discount) * taxRatePct) / 100);
  const total = round2(subtotal - discount + tax);
  return { subtotal, discount, tax, total, units: lines.reduce((s, l) => s + l.qty, 0) };
}