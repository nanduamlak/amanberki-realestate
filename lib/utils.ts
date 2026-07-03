import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format an ETB price in millions, e.g. 11200000 → "ETB 11.2M"
 */
export function formatPrice(amount: number): string {
  if (amount === 0) return "—";
  const m = amount / 1_000_000;
  return `ETB ${m % 1 === 0 ? m.toFixed(0) : m.toFixed(1)}M`;
}

/**
 * Format a price or price range.
 * If priceMax is provided and different from price → "ETB 7M – 7.5M"
 * Otherwise → "ETB 11.2M"
 */
export function formatPriceRange(price: number, priceMax?: number | null): string {
  if (price === 0) return "—";
  if (priceMax && priceMax !== price) {
    const lo = price / 1_000_000;
    const hi = priceMax / 1_000_000;
    const loStr = lo % 1 === 0 ? lo.toFixed(0) : lo.toFixed(1);
    const hiStr = hi % 1 === 0 ? hi.toFixed(0) : hi.toFixed(1);
    return `ETB ${loStr}M – ${hiStr}M`;
  }
  return formatPrice(price);
}
