import {
  PortfolioOverview,
  UnifiedProduct,
  ProductMetrics,
  ComparisonResult,
  Milestone,
  RevenuePoint,
  ProviderConnection,
  TimeRangeOption,
  CanonicalTransaction,
  CanonicalSubscription,
  ProviderId,
} from "../domain/types";
import {
  calculatePortfolioRevenue,
  calculatePortfolioMRR,
  generateRevenueTimeSeries,
  calculateProductComparison,
  detectMilestones,
} from "../metrics/engine";

export interface Indic8DataContext {
  connections: ProviderConnection[];
  products: UnifiedProduct[];
  transactions: CanonicalTransaction[];
  subscriptions: CanonicalSubscription[];
}

export function getPortfolioOverview(data: Indic8DataContext): PortfolioOverview {
  const activeConns = data.connections.filter((c) => c.status === "connected" || c.status === "active");
  const revenue = calculatePortfolioRevenue(data.transactions, data.products);
  const mrr = calculatePortfolioMRR(data.subscriptions, data.products);
  const totalSales = data.products.reduce((acc, p) => acc + p.totalSales, 0);
  const totalCustomers = data.products.reduce((acc, p) => acc + p.totalCustomers, 0);
  const totalRefunds = data.products.reduce((acc, p) => acc + p.totalRefunds, 0);
  const activeSubs = data.subscriptions.filter((s) => s.status === "active").length;

  const connectedProviders: ProviderId[] = activeConns.map((c) => c.providerId);
  const latestSync = activeConns
    .map((c) => c.lastSyncedAt)
    .filter(Boolean)
    .sort()
    .reverse()[0];

  return {
    grossRevenue: revenue,
    totalSales,
    totalCustomers,
    activeSubscriptions: activeSubs,
    mrr,
    totalRefunds,
    activeProvidersCount: activeConns.length,
    connectedProviders: activeConns,
    provenance: {
      providers: connectedProviders,
      lastSyncedAt: latestSync,
    },
  };
}

export function getRevenueSeries(
  data: Indic8DataContext,
  range: TimeRangeOption = "30d"
): RevenuePoint[] {
  return generateRevenueTimeSeries(data.transactions, range);
}

export function getProductOverview(data: Indic8DataContext): UnifiedProduct[] {
  return data.products;
}

export function getProductMetrics(
  data: Indic8DataContext,
  productId: string
): ProductMetrics | null {
  const product = data.products.find((p) => p.id === productId);
  if (!product) return null;

  const txs = data.transactions.filter((t) => t.unifiedProductId === productId);
  const series = generateRevenueTimeSeries(txs, "30d");

  return {
    product,
    revenue: product.totalRevenue,
    sales: product.totalSales,
    customers: product.totalCustomers,
    mrr: product.mrr,
    refunds: product.totalRefunds,
    revenueGrowth: product.growthYoY,
    channelBreakdown: product.channels,
    recentTransactions: txs,
    revenueTimeSeries: series,
  };
}

export function getComparison(
  data: Indic8DataContext,
  selectedProductIds: string[]
): ComparisonResult {
  return calculateProductComparison(data.products, selectedProductIds);
}

export function getMilestones(data: Indic8DataContext): Milestone[] {
  const portfolio = getPortfolioOverview(data);
  return detectMilestones(
    portfolio.grossRevenue,
    portfolio.totalSales,
    portfolio.totalCustomers,
    portfolio.mrr
  );
}

export function getProviderOverview(data: Indic8DataContext): ProviderConnection[] {
  return data.connections;
}
