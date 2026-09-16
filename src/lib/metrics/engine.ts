/**
 * Canonical Metric Engine
 * 
 * Computes authentic consolidated metrics:
 * - Gross Revenue with multi-currency conversion into target view currency
 * - Time series buckets matching Polar / Foglamp specifications:
 *   - "today": 24 hourly intervals (00:00 to 23:00)
 *   - "30d": 30 daily intervals
 *   - "3m": Weekly intervals across 90 days
 *   - "12m": Monthly intervals across 12 months
 *   - "lifetime" / "all": Monthly intervals from start to now
 * - ZERO simulated / fake / dummy data
 */

import {
  CanonicalTransaction,
  CanonicalSubscription,
  UnifiedProduct,
  RevenuePoint,
  Money,
  TimeRangeOption,
  Milestone,
  ComparisonResult,
  ProductMetrics,
} from "../domain/types";
import { createMoney, sumMoney, formatMoney } from "../domain/money";
import { convertCurrency, formatCurrencyAmount } from "../currency";
import { INITIAL_PRODUCTS } from "../indic8Data";

export type MetricTimeframe = "today" | "30d" | "3m" | "12m" | "all" | "lifetime";

export interface TimeSeriesOptions {
  earliestDate?: string | Date | number;
  latestDate?: string | Date | number;
  products?: Array<{ createdAt?: string; created_at?: string; id?: string }>;
}

export function calculatePortfolioRevenue(
  transactions: CanonicalTransaction[],
  products: UnifiedProduct[]
): Money {
  if (transactions.length > 0) {
    const succeeded = transactions.filter((t) => t.status === "succeeded");
    return sumMoney(succeeded.map((t) => t.amount));
  }
  if (products.length > 0) {
    return sumMoney(products.map((p) => p.totalRevenue));
  }
  return createMoney(0, "USD");
}

export function calculatePortfolioMRR(
  subscriptions: CanonicalSubscription[],
  products: UnifiedProduct[]
): Money | undefined {
  const activeSubs = subscriptions.filter((s) => s.status === "active" || s.status === "trialing");
  if (activeSubs.length > 0) {
    return sumMoney(activeSubs.map((s) => s.mrr));
  }
  const productMRRs = products.map((p) => p.mrr).filter((m): m is Money => Boolean(m));
  if (productMRRs.length > 0) {
    return sumMoney(productMRRs);
  }
  return undefined;
}

export function generateRevenueTimeSeries(
  transactions: Array<{
    amount: number | Money;
    currency?: string;
    occurredAt?: string;
    timestamp?: string;
    status?: string;
    provider?: string;
    providerId?: string;
  }> = [],
  range: string = "all",
  targetCurrency: string = "USD",
  options?: TimeSeriesOptions | Array<{ createdAt?: string; created_at?: string; id?: string }>
): RevenuePoint[] {
  const now = new Date();
  const succeeded = (transactions || []).filter(
    (t) => t.status === "succeeded" || t.status === "paid" || !t.status
  );

  // Normalize range token
  const mode = range === "today" ? "today" : range === "7d" ? "7d" : range === "30d" ? "30d" : range === "3m" ? "3m" : range === "12m" ? "12m" : "all";

  // Build uniform continuous buckets so the line runs smoothly
  const buckets: { date: string; timestamp: number; startMs: number; endMs: number; amount: number; breakdown: Record<string, number> }[] = [];

  if (mode === "today") {
    // 24 hourly intervals (00:00 to 23:00)
    for (let h = 0; h < 24; h++) {
      const dStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 0, 0, 0);
      const dEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, 59, 59, 999);
      const label = `${h.toString().padStart(2, "0")}:00`;
      buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
    }
  } else if (mode === "7d") {
    // 7 daily intervals
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
    }
  } else if (mode === "30d") {
    // 30 daily intervals
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
      const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
    }
  } else if (mode === "3m") {
    // 14 weekly intervals spanning past 90 days
    for (let i = 13; i >= 0; i--) {
      const dStart = new Date(now.getTime() - (i + 1) * 7 * 24 * 3600 * 1000);
      const dEnd = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
      const label = dEnd.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      buckets.push({ date: label, timestamp: dEnd.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
    }
  } else if (mode === "12m") {
    // 12 monthly intervals
    for (let i = 11; i >= 0; i--) {
      const dStart = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const dEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = dStart.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
    }
  } else {
    // "all" / "lifetime": find earliest product launch date and current today date
    let earliestLaunchMs = Infinity;

    // Check options for explicit earliestDate or products list
    if (Array.isArray(options)) {
      options.forEach((p) => {
        const t = new Date(p.createdAt || (p as any).created_at || 0).getTime();
        if (!isNaN(t) && t > 0 && t < earliestLaunchMs) earliestLaunchMs = t;
      });
    } else if (options && typeof options === "object") {
      if (options.earliestDate) {
        const t = new Date(options.earliestDate).getTime();
        if (!isNaN(t) && t > 0 && t < earliestLaunchMs) earliestLaunchMs = t;
      }
      if (options.products && Array.isArray(options.products)) {
        options.products.forEach((p) => {
          const t = new Date(p.createdAt || (p as any).created_at || 0).getTime();
          if (!isNaN(t) && t > 0 && t < earliestLaunchMs) earliestLaunchMs = t;
        });
      }
    }

    // Default to earliest product in INITIAL_PRODUCTS (e.g. Jan 18, 2026) if not passed
    if (earliestLaunchMs === Infinity) {
      INITIAL_PRODUCTS.forEach((p) => {
        const t = new Date(p.createdAt || 0).getTime();
        if (!isNaN(t) && t > 0 && t < earliestLaunchMs) earliestLaunchMs = t;
      });
    }

    // Also check if any transaction happened before the launch date
    const txTimes = succeeded
      .map((t) => new Date(t.occurredAt || t.timestamp || 0).getTime())
      .filter((t) => t > 0 && !isNaN(t));

    if (txTimes.length > 0) {
      const minTx = Math.min(...txTimes);
      if (minTx < earliestLaunchMs) {
        earliestLaunchMs = minTx;
      }
    }

    if (earliestLaunchMs === Infinity) {
      // Safe fallback to start of current year
      earliestLaunchMs = new Date(now.getFullYear(), 0, 1).getTime();
    }

    // End date is ALWAYS today / current date (e.g. September 2026), or options.latestDate if explicitly given
    const latestMs = (typeof options === "object" && !Array.isArray(options) && options?.latestDate)
      ? new Date(options.latestDate).getTime()
      : now.getTime();

    const timeSpanMs = latestMs - earliestLaunchMs;

    if (timeSpanMs <= 31 * 24 * 3600 * 1000) {
      // Span is within a month: create daily buckets from start date to today
      const startDate = new Date(earliestLaunchMs);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(latestMs);
      endDate.setHours(23, 59, 59, 999);

      const totalDays = Math.max(7, Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 3600 * 1000)) + 1);
      const actualStart = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate() - (totalDays - 1), 0, 0, 0);

      for (let i = 0; i < totalDays; i++) {
        const d = new Date(actualStart.getFullYear(), actualStart.getMonth(), actualStart.getDate() + i, 0, 0, 0);
        const dStart = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        const dEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
        const label = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
        buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
      }
    } else if (timeSpanMs <= 90 * 24 * 3600 * 1000) {
      // Span is 1 to 3 months: weekly intervals from launch to today
      let cur = new Date(earliestLaunchMs);
      cur.setHours(0, 0, 0, 0);
      const targetEnd = new Date(latestMs);
      targetEnd.setHours(23, 59, 59, 999);

      while (cur <= targetEnd || buckets.length < 5) {
        const dStart = new Date(cur);
        const dEnd = new Date(cur.getTime() + 7 * 24 * 3600 * 1000 - 1);
        const label = dStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
        cur = new Date(cur.getTime() + 7 * 24 * 3600 * 1000);
      }
    } else {
      // Multi-month span: create monthly buckets from oldest product launch month through current today month
      const startDate = new Date(earliestLaunchMs);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(latestMs);
      endDate.setDate(1);
      endDate.setHours(0, 0, 0, 0);

      const cur = new Date(startDate);
      while (cur <= endDate) {
        const dStart = new Date(cur.getFullYear(), cur.getMonth(), 1, 0, 0, 0, 0);
        const dEnd = new Date(cur.getFullYear(), cur.getMonth() + 1, 0, 23, 59, 59, 999);
        const label = dStart.toLocaleDateString("en-US", { month: "short", year: "numeric" });
        buckets.push({ date: label, timestamp: dStart.getTime(), startMs: dStart.getTime(), endMs: dEnd.getTime(), amount: 0, breakdown: {} });
        cur.setMonth(cur.getMonth() + 1);
      }
    }
  }

  // Populate transactions into matching continuous intervals
  succeeded.forEach((tx) => {
    const txTime = new Date(tx.occurredAt || tx.timestamp || now).getTime();
    if (isNaN(txTime) || txTime <= 0) return;

    const rawAmt = typeof tx.amount === "number" ? tx.amount : tx.amount?.amount || 0;
    const txCur = (tx.currency || (typeof tx.amount === "object" ? tx.amount.currency : "USD") || "USD").toUpperCase();
    const providerKey = tx.provider || tx.providerId || "google_play";
    const normalizedAmt = convertCurrency(rawAmt, txCur, targetCurrency);

    // Find precise interval bucket
    const targetBucket = buckets.find((b) => txTime >= b.startMs && txTime <= b.endMs);
    if (targetBucket) {
      targetBucket.amount += normalizedAmt;
      targetBucket.breakdown[providerKey] = (targetBucket.breakdown[providerKey] || 0) + normalizedAmt;
    } else if (mode === "all" && buckets.length > 0) {
      if (txTime < buckets[0].startMs) {
        buckets[0].amount += normalizedAmt;
        buckets[0].breakdown[providerKey] = (buckets[0].breakdown[providerKey] || 0) + normalizedAmt;
      } else if (txTime > buckets[buckets.length - 1].endMs) {
        buckets[buckets.length - 1].amount += normalizedAmt;
        buckets[buckets.length - 1].breakdown[providerKey] = (buckets[buckets.length - 1].breakdown[providerKey] || 0) + normalizedAmt;
      }
    }
  });

  return buckets.map((b) => ({
    date: b.date,
    amount: parseFloat(b.amount.toFixed(2)),
    currency: targetCurrency as any,
    formattedAmount: formatCurrencyAmount(b.amount, targetCurrency),
    providerBreakdown: b.breakdown as any,
  }));
}

export function generateOrdersTimeSeries(
  transactions: Array<{
    amount: number | Money;
    currency?: string;
    occurredAt?: string;
    timestamp?: string;
    status?: string;
    provider?: string;
    providerId?: string;
  }> = [],
  range: string = "all",
  options?: TimeSeriesOptions | Array<{ createdAt?: string; created_at?: string; id?: string }>
): Array<{ date: string; amount: number; formattedAmount: string }> {
  const succeeded = (transactions || []).filter(
    (t) => t.status === "succeeded" || t.status === "paid" || !t.status
  );

  // Derive buckets using same timeframe structure
  const revSeries = generateRevenueTimeSeries(transactions, range, "USD", options);

  return revSeries.map((bucket) => {
    // Exact timestamp matching or label matching
    const count = succeeded.filter((tx) => {
      const txTime = new Date(tx.occurredAt || tx.timestamp || 0).getTime();
      if (isNaN(txTime) || txTime <= 0) return false;
      const txDate = new Date(txTime);
      const parsedTx = txDate.toLocaleDateString("en-US", { month: "short", year: "numeric" });
      const parsedTxDaily = txDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      const parsedTxShort = txDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      return bucket.date === parsedTx || bucket.date === parsedTxDaily || bucket.date === parsedTxShort;
    }).length;

    return {
      date: bucket.date,
      amount: count,
      formattedAmount: `${count} ${count === 1 ? "order" : "orders"}`,
    };
  });
}

export function computeProductMetrics(
  product: UnifiedProduct,
  transactions: CanonicalTransaction[]
): ProductMetrics {
  const prodTxs = transactions.filter(
    (t) => t.unifiedProductId === product.id && t.status === "succeeded"
  );
  const revenue = sumMoney(prodTxs.map((t) => t.amount));
  const orders = prodTxs.length;
  const customers = new Set(prodTxs.map((t) => t.customerEmail).filter(Boolean)).size;

  return {
    product,
    revenue: revenue.amount > 0 ? revenue : product.totalRevenue,
    sales: orders > 0 ? orders : product.totalSales,
    customers: customers > 0 ? customers : product.totalCustomers,
    mrr: product.mrr,
    refunds: product.totalRefunds,
    revenueGrowth: product.growthYoY,
    channelBreakdown: product.channels,
    recentTransactions: prodTxs,
    revenueTimeSeries: generateRevenueTimeSeries(prodTxs, "30d"),
  };
}

export function calculateProductComparison(
  products: UnifiedProduct[],
  selectedProductIds: string[]
): ComparisonResult {
  const filtered = products.filter((p) => selectedProductIds.includes(p.id));
  const targetProducts = filtered.length > 0 ? filtered : products.slice(0, 2);

  const metrics = targetProducts.map((p) => computeProductMetrics(p, []));

  const sortedByRev = [...targetProducts].sort((a, b) => b.totalRevenue.amount - a.totalRevenue.amount);
  const sortedByCust = [...targetProducts].sort((a, b) => b.totalCustomers - a.totalCustomers);
  const sortedByMRR = [...targetProducts].sort((a, b) => (b.mrr?.amount || 0) - (a.mrr?.amount || 0));

  return {
    products: metrics,
    highestGrossing: sortedByRev[0] || targetProducts[0],
    largestUserbase: sortedByCust[0] || targetProducts[0],
    highestMRR: sortedByMRR[0] || targetProducts[0],
  };
}

export function detectMilestones(
  totalRevenue: Money,
  totalSales: number,
  totalCustomers: number,
  mrr?: Money
): Milestone[] {
  const milestones: Milestone[] = [];
  const now = new Date().toISOString();

  if (totalRevenue.amount > 0) {
    milestones.push({
      id: "ms_rev_active",
      title: `Crossed ${formatMoney(totalRevenue, { compact: true })} Revenue`,
      category: "revenue",
      metricValue: totalRevenue.amount,
      formattedMetric: formatMoney(totalRevenue, { compact: true }),
      currencySymbol: "$",
      currencyCode: totalRevenue.currency,
      subtext: "Cumulative revenue milestone reached.",
      verifiedProvider: "consolidated",
      achievedAt: now,
      isShared: false,
    });
  }

  if (totalSales > 0) {
    milestones.push({
      id: "ms_sales_active",
      title: `${totalSales.toLocaleString()} Sales`,
      category: "sales",
      metricValue: totalSales,
      formattedMetric: `${totalSales.toLocaleString()} orders`,
      subtext: "Customer checkouts milestone.",
      verifiedProvider: "consolidated",
      achievedAt: now,
      isShared: false,
    });
  }

  if (mrr && mrr.amount > 0) {
    milestones.push({
      id: "ms_mrr_active",
      title: `Crossed ${formatMoney(mrr)} MRR`,
      category: "subscribers",
      metricValue: mrr.amount,
      formattedMetric: `${formatMoney(mrr)}/mo`,
      subtext: "Active recurring subscription baseline verified.",
      verifiedProvider: "consolidated",
      achievedAt: now,
      isShared: false,
    });
  }

  return milestones;
}
