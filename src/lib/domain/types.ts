export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export interface Money {
  amount: number; // In base currency units (e.g. 100.50)
  currency: CurrencyCode;
}

export type ProviderId =
  | "stripe"
  | "polar"
  | "revenuecat"
  | "app_store"
  | "google_play"
  | "lemonsqueezy"
  | "dodopayments"
  | "paddle"
  | "gumroad"
  | "creem";

export type ConnectionStatus = "connected" | "disconnected" | "syncing" | "error" | "unconfigured" | "active";

export interface ProviderCapabilities {
  supportsRevenue: boolean;
  supportsSubscriptions: boolean;
  supportsMRR: boolean;
  supportsRefunds: boolean;
  supportsCustomers: boolean;
  supportsCountries: boolean;
}

export interface ProviderConnection {
  id: string;
  providerId: ProviderId;
  accountName: string;
  accountId: string;
  status: ConnectionStatus;
  connectedAt?: string;
  lastSyncedAt?: string;
  syncError?: string;
  isSandbox: boolean;
  capabilities: ProviderCapabilities;
}

export interface RawProviderProduct {
  providerId: ProviderId;
  externalProductId: string;
  name: string;
  description?: string;
  category?: string;
  amount?: number;
  totalRevenue?: number;
  salesCount?: number;
  totalSales?: number;
  currency?: CurrencyCode;
  primaryCurrency?: CurrencyCode;
  isRecurring?: boolean;
  recurringInterval?: "month" | "year" | "week";
  imageUrl?: string;
  medias?: string[];
  isArchived?: boolean;
  createdAt: string;
}

export interface RawProviderTransaction {
  id?: string;
  externalTransactionId?: string;
  providerId: ProviderId;
  externalProductId?: string;
  productName?: string;
  externalCustomerId?: string;
  customerEmail?: string;
  customerName?: string;
  amount?: number;
  amountCents?: number;
  netCents?: number;
  feeCents?: number;
  currency: string;
  status: "succeeded" | "pending" | "refunded" | "failed";
  refundAmount?: number;
  country?: string;
  timestamp?: string;
  occurredAt?: string;
}

export interface RawProviderSubscription {
  id?: string;
  externalSubscriptionId?: string;
  providerId: ProviderId;
  externalProductId?: string;
  externalCustomerId?: string;
  customerEmail?: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  interval: "month" | "year";
  currentPeriodEnd?: string;
  mrrContribution?: number;
  mrrCents?: number;
  currency: string;
  startedAt: string;
}

export interface RawProviderCustomer {
  id?: string;
  externalCustomerId?: string;
  providerId: ProviderId;
  email?: string;
  name?: string;
  country?: string;
  totalSpend?: number;
  currency?: string;
  createdAt: string;
}

// Canonical Normalized Domain Models

export interface ProductChannel {
  providerId: ProviderId;
  externalProductId: string;
  externalProductName: string;
  revenue: Money;
  salesCount: number;
  refundsCount: number;
  activeSubscribers?: number;
  mrr?: Money;
  lastSaleAt?: string;
}

export interface UnifiedProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  channels: ProductChannel[];
  totalRevenue: Money;
  totalSales: number;
  totalCustomers: number;
  activeSubscriptions?: number;
  mrr?: Money;
  totalRefunds: number;
  growthYoY?: string;
  createdAt: string;
}

export interface CanonicalTransaction {
  id: string;
  providerId: ProviderId;
  unifiedProductId?: string;
  productName: string;
  customerEmail: string;
  customerName?: string;
  amount: Money;
  status: "succeeded" | "refunded" | "failed";
  country?: string;
  timestamp: string;
  occurredAt?: string;
}

export interface CanonicalSubscription {
  id: string;
  providerId: ProviderId;
  unifiedProductId?: string;
  customerEmail: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  interval: "month" | "year";
  mrr: Money;
  startedAt: string;
  currentPeriodEnd: string;
}

export interface CanonicalCustomer {
  id: string;
  email: string;
  name?: string;
  providers: ProviderId[];
  totalSpend: Money;
  firstSeenAt: string;
  lastActiveAt: string;
}

export interface RevenuePoint {
  date: string;
  amount: number;
  currency: CurrencyCode;
  formattedAmount: string;
  providerBreakdown?: Partial<Record<ProviderId, number>>;
}

export interface PortfolioOverview {
  grossRevenue: Money;
  revenueGrowthRate?: number; // e.g. 0.184 = +18.4%
  totalSales: number;
  totalCustomers: number;
  activeSubscriptions?: number;
  mrr?: Money;
  totalRefunds: number;
  activeProvidersCount: number;
  connectedProviders: ProviderConnection[];
  provenance: {
    providers: ProviderId[];
    lastSyncedAt?: string;
  };
}

export interface ProductMetrics {
  product: UnifiedProduct;
  revenue: Money;
  sales: number;
  customers: number;
  mrr?: Money;
  refunds: number;
  revenueGrowth?: string;
  channelBreakdown: ProductChannel[];
  recentTransactions: CanonicalTransaction[];
  revenueTimeSeries: RevenuePoint[];
}

export interface ComparisonResult {
  products: ProductMetrics[];
  highestGrossing: UnifiedProduct;
  largestUserbase: UnifiedProduct;
  highestMRR: UnifiedProduct;
}

export interface Milestone {
  id: string;
  title: string;
  category: "revenue" | "sales" | "growth" | "subscribers";
  metricValue: number;
  formattedMetric: string;
  currencySymbol?: string;
  currencyCode?: CurrencyCode;
  prefix?: string;
  suffix?: string;
  subtext: string;
  growthDelta?: string;
  verifiedProvider: ProviderId | "consolidated";
  achievedAt: string;
  isShared: boolean;
}

export type TimeRangeOption = "today" | "7d" | "30d" | "3m" | "12m" | "all" | "this_month" | "lifetime";

export interface DashboardFilterState {
  range: TimeRangeOption;
  providerFilter: ProviderId | "ALL";
  productIdFilter?: string;
}
