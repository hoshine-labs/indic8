export type ProviderType =
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

export type TimePeriod =
  | "today"
  | "yesterday"
  | "7d"
  | "30d"
  | "3m"
  | "12m"
  | "all"
  | "this_month"
  | "last_month"
  | "this_year"
  | "lifetime";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "JPY";

export interface ProviderAccount {
  id: string;
  provider: ProviderType;
  accountName: string;
  accountId: string;
  connectedAt: string;
  lastSyncedAt: string;
  status: "active" | "syncing" | "error" | "disconnected";
  metricsSupported: Array<
    "revenue" | "sales" | "customers" | "subscriptions" | "refunds" | "countries"
  >;
  syncError?: string;
  isSandbox?: boolean;
}

export interface ProductProviderMapping {
  provider: ProviderType;
  externalProductId: string;
  externalProductName: string;
  revenue: number;
  salesCount: number;
  activeSubscriptions?: number;
  refunds: number;
  isArchived?: boolean;
  lastSaleAt: string;
}

export interface UnifiedProduct {
  id: string;
  name: string;
  slug: string;
  category: "SaaS" | "Mobile App" | "Desktop App" | "Digital Asset" | "Newsletter" | "API" | string;
  imageUrl?: string;
  medias?: string[];
  primaryCurrency: CurrencyCode;
  totalRevenue: number;
  totalSales: number;
  totalCustomers: number;
  activeSubscriptions: number;
  mrr: number;
  totalRefunds: number;
  avgOrderValue: number;
  growthYoY: string;
  isArchived?: boolean;
  createdAt: string;
  providers: ProductProviderMapping[];
  channels: ProductProviderMapping[];
  groupedProductIds?: string[];
  salesTimeSeries?: Array<{ date: string; revenue: number; orders: number }>;
}

export interface Transaction {
  id: string;
  provider: ProviderType;
  productId: string;
  productName: string;
  customerEmail: string;
  customerCountry: string;
  amount: number;
  currency: CurrencyCode;
  type: "one_time" | "subscription" | "refund";
  status: "succeeded" | "refunded";
  timestamp: string;
}

export type MilestoneType =
  | "revenue_crossed"
  | "sales_crossed"
  | "customer_milestone"
  | "best_day"
  | "best_month"
  | "first_sale"
  | "product_launch";

export interface VerifiedActivityEvent {
  id: string;
  type: MilestoneType;
  title: string;
  description: string;
  metricValue: number;
  formattedMetric: string;
  currency: CurrencyCode;
  productId?: string;
  productName?: string;
  provider: ProviderType;
  timestamp: string;
  hasShared: boolean;
  growthDelta?: string;
  subtext?: string;
  verifiedSource?: ProviderType | string;
  numericValue?: number;
  metricLabel?: string;
  currencySymbol?: string;
  currencyCode?: CurrencyCode;
  prefix?: string;
  suffix?: string;
  accentColor?: string;
  socialCopyVariants: {
    minimal: string;
    story: string;
    founder: string;
    [key: string]: string;
  };
}

export interface GalleryPreset {
  id: string;
  title: string;
  category: "revenue" | "sales" | "customer" | "recap" | "product";
  description: string;
  numericValue: number;
  metricLabel: string;
  subtext: string;
  currencySymbol: string;
  currencyCode: CurrencyCode;
  prefix: string;
  suffix: string;
  growthDelta: string;
  verifiedSource: ProviderType;
  templateStyle: string;
  backdropId: string;
  frameType: string;
  accentColor: string;
  aspectRatio: "1:1" | "16:9" | "4:5" | "9:16";
  socialCopy: {
    minimal: string;
    story: string;
    founder: string;
    [key: string]: string;
  };
  socialCopyVariants?: {
    minimal: string;
    story: string;
    founder: string;
    [key: string]: string;
  };
}

export type ActiveNavTab =
  | "dashboard"
  | "products"
  | "compare"
  | "gallery"
  | "activity"
  | "providers"
  | "studio"
  | "settings"
  | "profile";
