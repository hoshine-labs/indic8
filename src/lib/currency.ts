/**
 * Multi-Currency Normalization & Live FX Engine
 * 
 * Supports cross-currency conversions between USD, EUR, GBP, INR, CAD, AUD, JPY, CHF, SEK.
 * Normalizes multi-currency provider transactions into uniform view amounts with native FX breakdown.
 */

import { CurrencyCode } from "./types";

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  CAD: "CA$",
  AUD: "A$",
  JPY: "¥",
  CHF: "CHF ",
  SEK: "kr ",
};

export const DEFAULT_FX_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.28,
  INR: 0.012,
  CAD: 0.74,
  AUD: 0.66,
  JPY: 0.0064,
  CHF: 1.12,
  SEK: 0.095,
};

let liveFxRates: Record<string, number> = { ...DEFAULT_FX_RATES_TO_USD };

// Fetch live FX rates in background once on startup
if (typeof window !== "undefined") {
  fetch("https://open.er-api.com/v6/latest/USD")
    .then((r) => r.json())
    .then((data) => {
      if (data && data.rates) {
        // er-api gives 1 USD = X Currency.
        // We invert it so rate = value of 1 Currency in USD.
        const updated: Record<string, number> = {};
        Object.entries(data.rates).forEach(([cur, rate]) => {
          const numRate = Number(rate);
          if (numRate > 0) {
            updated[cur] = 1 / numRate;
          }
        });
        liveFxRates = { ...DEFAULT_FX_RATES_TO_USD, ...updated };
      }
    })
    .catch(() => {
      // Use fallback rates
    });
}

export function convertCurrency(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "USD"
): number {
  const from = (fromCurrency || "USD").toUpperCase();
  const to = (toCurrency || "USD").toUpperCase();

  if (from === to) return amount;

  const fromRate = liveFxRates[from] || DEFAULT_FX_RATES_TO_USD[from] || 1.0;
  const toRate = liveFxRates[to] || DEFAULT_FX_RATES_TO_USD[to] || 1.0;

  // Amount in USD = amount * fromRate
  const amountUSD = amount * fromRate;
  // Amount in target = amountUSD / toRate
  return amountUSD / toRate;
}

export function formatCurrencyAmount(
  amount: number,
  currencyCode: string = "USD",
  options?: { compact?: boolean; hideDecimals?: boolean }
): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "$0.00";
  const code = (currencyCode || "USD").toUpperCase();
  const symbol = CURRENCY_SYMBOLS[code] || `${code} `;

  const { compact = false, hideDecimals = false } = options || {};

  if (compact && Math.abs(amount) >= 1000) {
    if (Math.abs(amount) >= 1_000_000) {
      return `${symbol}${(amount / 1_000_000).toFixed(1)}M`;
    }
    return `${symbol}${(amount / 1000).toFixed(1)}K`;
  }

  const fractionDigits = code === "JPY" || hideDecimals ? 0 : 2;

  try {
    return `${symbol}${amount.toLocaleString("en-US", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}`;
  } catch {
    return `${symbol}${amount.toFixed(fractionDigits)}`;
  }
}
