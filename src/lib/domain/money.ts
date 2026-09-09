import { CurrencyCode, Money } from "./types";

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
};

// Base reference rates (prepared for live exchange rate service)
export const EXCHANGE_RATES_TO_USD: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.26,
  INR: 0.012,
  JPY: 0.0064,
};

export function createMoney(amount: number, currency: CurrencyCode = "USD"): Money {
  return {
    amount: Math.round(amount * 100) / 100,
    currency,
  };
}

export function formatMoney(
  money?: Money | null,
  options?: {
    compact?: boolean;
    maximumFractionDigits?: number;
  }
): string {
  if (!money || money.amount === undefined || money.amount === null) {
    return "Unavailable";
  }

  const symbol = CURRENCY_SYMBOLS[money.currency] || "$";
  const { compact = false, maximumFractionDigits = 2 } = options || {};

  if (compact && Math.abs(money.amount) >= 1000) {
    if (Math.abs(money.amount) >= 1_000_000) {
      return `${symbol}${(money.amount / 1_000_000).toFixed(1)}M`;
    }
    return `${symbol}${(money.amount / 1000).toFixed(1)}K`;
  }

  return `${symbol}${money.amount.toLocaleString(undefined, {
    minimumFractionDigits: money.currency === "JPY" ? 0 : 0,
    maximumFractionDigits: money.currency === "JPY" ? 0 : maximumFractionDigits,
  })}`;
}

export function convertMoney(
  source: Money,
  targetCurrency: CurrencyCode,
  customRates?: Record<CurrencyCode, number>
): Money {
  if (source.currency === targetCurrency) {
    return source;
  }

  const rates = customRates || EXCHANGE_RATES_TO_USD;
  const sourceRateToUSD = rates[source.currency] || 1.0;
  const targetRateToUSD = rates[targetCurrency] || 1.0;

  // Convert source -> USD -> Target
  const amountInUSD = source.amount * sourceRateToUSD;
  const convertedAmount = amountInUSD / targetRateToUSD;

  return createMoney(convertedAmount, targetCurrency);
}

export function sumMoney(
  amounts: Money[],
  targetCurrency: CurrencyCode = "USD",
  customRates?: Record<CurrencyCode, number>
): Money {
  let totalUSD = 0;
  const rates = customRates || EXCHANGE_RATES_TO_USD;

  for (const m of amounts) {
    if (m && typeof m.amount === "number") {
      const rate = rates[m.currency] || 1.0;
      totalUSD += m.amount * rate;
    }
  }

  const targetRateToUSD = rates[targetCurrency] || 1.0;
  return createMoney(totalUSD / targetRateToUSD, targetCurrency);
}
