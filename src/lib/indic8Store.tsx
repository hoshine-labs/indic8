"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import {
  ProviderAccount,
  ProviderType,
  UnifiedProduct,
  Transaction,
  VerifiedActivityEvent,
  TimePeriod,
  CurrencyCode,
  GalleryPreset,
  ActiveNavTab,
} from "./types";
import {
  INITIAL_PROVIDERS,
  INITIAL_PRODUCTS,
  INITIAL_TRANSACTIONS,
  INITIAL_ACTIVITY_EVENTS,
  GALLERY_PRESETS,
} from "./indic8Data";
import { ProviderConnection } from "./domain/types";
import { LocalPreferences } from "./storage/localPreferences";
import { QueryCache } from "./storage/queryCache";
import { convertCurrency, formatCurrencyAmount } from "./currency";

export const CURRENCY_RATES: Record<CurrencyCode, { symbol: string; rateFromUSD: number }> = {
  USD: { symbol: "$", rateFromUSD: 1.0 },
  EUR: { symbol: "€", rateFromUSD: 0.92 },
  GBP: { symbol: "£", rateFromUSD: 0.79 },
  INR: { symbol: "₹", rateFromUSD: 83.5 },
  JPY: { symbol: "¥", rateFromUSD: 155.2 },
};

interface MilestoneToLoadInStudio {
  numericValue: number;
  metricLabel: string;
  subtext: string;
  currencySymbol?: string;
  currencyCode?: CurrencyCode;
  prefix?: string;
  suffix?: string;
  verifiedSource?: ProviderType | string;
  growthDelta?: string;
  accentColor?: string;
  backdropId?: string;
}

interface Indic8ContextType {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  primaryCurrency: CurrencyCode;
  setPrimaryCurrency: (c: CurrencyCode) => void;
  timePeriod: TimePeriod;
  setTimePeriod: (p: TimePeriod) => void;
  formatCurrency: (amountUSD: number, targetCurrency?: CurrencyCode) => string;
  convertFromUSD: (amountUSD: number, targetCurrency?: CurrencyCode) => number;

  isDemoMode: boolean;
  loadDemoData: () => void;
  clearAllData: () => void;
  isInitialLoading: boolean;

  connections: ProviderConnection[];
  providers: ProviderAccount[];
  products: UnifiedProduct[];
  transactions: Transaction[];
  activities: VerifiedActivityEvent[];
  galleryPresets: GalleryPreset[];

  totalConsolidatedRevenue: number;
  totalConsolidatedSales: number;
  totalConsolidatedCustomers: number;
  totalConsolidatedMRR: number;
  totalConsolidatedRefunds: number;

  isSyncingAny: boolean;
  syncingProviderIds: string[];
  isProviderSyncing: (providerId: string) => boolean;
  syncProvider: (providerId: string) => Promise<void>;
  syncAllProviders: () => Promise<void>;
  toggleProviderStatus: (providerId: string) => void;
  addProviderAccount: (provider: ProviderType, accountName?: string, credentials?: Record<string, string>) => void;
  addProviderConnection: (conn: ProviderConnection) => Promise<void>;
  disconnectProvider: (providerId: string) => Promise<void>;

  selectedProductIdsForCompare: string[];
  toggleProductForCompare: (productId: string) => void;
  clearCompareSelection: () => void;

  selectedProductForDetail: UnifiedProduct | null;
  setSelectedProductForDetail: (p: UnifiedProduct | null) => void;
  linkExternalProductToUnified: (
    unifiedId: string,
    mapping: {
      provider: ProviderType;
      externalProductId: string;
      externalProductName: string;
      revenue: number;
      salesCount: number;
      refunds: number;
      lastSaleAt: string;
    }
  ) => void;

  postWorthyMilestones: VerifiedActivityEvent[];
  markActivityShared: (activityId: string) => void;

  studioLoadedMilestone: MilestoneToLoadInStudio | null;
  loadMilestoneIntoStudio: (milestone: MilestoneToLoadInStudio) => void;
  clearStudioLoadedMilestone: () => void;

  isBatchExportOpen: boolean;
  setIsBatchExportOpen: (open: boolean) => void;
  activeExportPreset: GalleryPreset | null;
  openBatchExportModal: (preset: GalleryPreset) => void;

  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
}

const Indic8Context = createContext<Indic8ContextType | undefined>(undefined);

function formatPackageTitle(pkg: string): string {
  if (!pkg) return "Android App";
  const parts = pkg.split(".");
  const lastPart = parts[parts.length - 1] || pkg;
  return lastPart
    .split(/[-_]/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export const Indic8Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTabState] = useState<ActiveNavTab>(() => {
    return (LocalPreferences.get("lastActiveTab") as ActiveNavTab) || "dashboard";
  });
  const [primaryCurrency, setPrimaryCurrency] = useState<CurrencyCode>(() => {
    return (LocalPreferences.get("primaryCurrency") as CurrencyCode) || "USD";
  });
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("lifetime");

  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [connections, setConnections] = useState<ProviderConnection[]>([]);
  const [providers, setProviders] = useState<ProviderAccount[]>([]);
  const [products, setProducts] = useState<UnifiedProduct[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activities, setActivities] = useState<VerifiedActivityEvent[]>([]);
  const [galleryPresets] = useState<GalleryPreset[]>(GALLERY_PRESETS);

  const [isSyncingAny, setIsSyncingAny] = useState(false);
  const [syncingProviderIds, setSyncingProviderIds] = useState<string[]>([]);
  const [selectedProductIdsForCompare, setSelectedProductIdsForCompare] = useState<string[]>([]);
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<UnifiedProduct | null>(null);

  const [studioLoadedMilestone, setStudioLoadedMilestone] = useState<MilestoneToLoadInStudio | null>(null);
  const [isBatchExportOpen, setIsBatchExportOpen] = useState(false);
  const [activeExportPreset, setActiveExportPreset] = useState<GalleryPreset | null>(null);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  const setActiveTab = useCallback((tab: ActiveNavTab) => {
    setActiveTabState(tab);
    LocalPreferences.set("lastActiveTab", tab);
  }, []);

  const handleSetPrimaryCurrency = useCallback((cur: CurrencyCode) => {
    setPrimaryCurrency(cur);
    LocalPreferences.set("primaryCurrency", cur);
  }, []);

  const processTelemetryData = useCallback((data: any) => {
    if (!data) return;

    if (data.connections && Array.isArray(data.connections)) {
      setConnections(data.connections);
      const mappedProviders: ProviderAccount[] = data.connections.map((c: any) => ({
        id: c.id,
        provider: (c.providerId || c.provider_id) as ProviderType,
        accountName: c.accountName || c.account_name,
        accountId: c.accountId || c.external_account_id,
        connectedAt: c.connectedAt || c.connected_at || new Date().toISOString(),
        lastSyncedAt: c.lastSyncedAt || c.last_synced_at || new Date().toISOString(),
        status: c.status === "connected" || c.status === "active" ? "active" : "disconnected",
        metricsSupported: ["revenue", "sales", "customers", "subscriptions", "refunds", "countries"],
        isSandbox: Boolean(c.isSandbox || c.is_sandbox),
      }));
      setProviders(mappedProviders);
    }

    const rawTxs: any[] = Array.isArray(data.transactions) ? data.transactions : [];
    const normalizedTxs: Transaction[] = rawTxs.map((t, idx) => {
      const rawAmount =
        typeof t.amount === "number"
          ? t.amount
          : typeof t.amountCents === "number"
            ? t.amountCents / 100
            : typeof t.amount_cents === "number"
              ? t.amount_cents / 100
              : 0;

      const rawCurrency = (t.currency || "USD").toUpperCase();
      const nativeCurrency = (CURRENCY_RATES[rawCurrency as CurrencyCode] ? rawCurrency : "USD") as CurrencyCode;
      const prodId = t.productId || t.externalProductId || "prod_default";
      const name = t.productName || formatPackageTitle(prodId);

      return {
        id: t.id || t.externalTransactionId || `tx_${idx}_${Date.now()}`,
        provider: (t.providerId || t.provider || "google_play") as ProviderType,
        productId: prodId,
        productName: name,
        customerEmail: t.customerEmail || t.email || `customer_${idx}@googleplay.com`,
        customerCountry: (t.country || t.customerCountry || "US").toUpperCase(),
        amount: Math.abs(rawAmount),
        currency: nativeCurrency,
        type: (t.type || "one_time") as "one_time" | "subscription" | "refund",
        status: t.status === "succeeded" || t.status === "paid" ? "succeeded" : "refunded",
        timestamp: t.occurredAt || t.occurred_at || t.timestamp || new Date().toISOString(),
      };
    });

    setTransactions(normalizedTxs);

    const rawProds: any[] = Array.isArray(data.products) ? data.products : [];
    const productMap = new Map<string, UnifiedProduct>();

    rawProds.forEach((p, idx) => {
      const pId = p.externalProductId || p.id || `app_${idx}`;
      const provType = (p.provider || p.providerId || "google_play") as ProviderType;
      const displayName = p.name || formatPackageTitle(pId);
      const initialMediaList = Array.isArray(p.medias) && p.medias.length > 0 ? p.medias : (p.imageUrl ? [p.imageUrl] : []);
      const heroImage = p.imageUrl || (initialMediaList.length > 0 ? initialMediaList[0] : undefined);

      const prodCurrencyRaw = (p.currency || p.primaryCurrency || "USD").toUpperCase();
      const prodCurrency = (CURRENCY_RATES[prodCurrencyRaw as CurrencyCode] ? prodCurrencyRaw : "USD") as CurrencyCode;

      const rawRev = typeof p.amount === "number" ? p.amount : typeof p.totalRevenue === "number" ? p.totalRevenue : 0;
      const rawSales = typeof p.salesCount === "number" ? p.salesCount : typeof p.totalSales === "number" ? p.totalSales : (rawRev > 0 ? 1 : 0);

      const initialRev = convertCurrency(rawRev, prodCurrency, primaryCurrency);

      const isArchived = Boolean(p.isArchived ?? p.is_archived);

      const defaultChannel = {
        provider: provType,
        externalProductId: pId,
        externalProductName: displayName,
        revenue: initialRev,
        salesCount: rawSales,
        refunds: 0,
        isArchived,
        lastSaleAt: p.createdAt || new Date().toISOString(),
      };

      productMap.set(pId, {
        id: pId,
        name: displayName,
        slug: displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: p.category || (provType === "google_play" ? "Android App" : "Software Product"),
        imageUrl: heroImage,
        medias: initialMediaList,
        primaryCurrency,
        totalRevenue: initialRev,
        totalSales: rawSales,
        totalCustomers: rawSales > 0 ? 1 : 0,
        activeSubscriptions: 0,
        mrr: 0,
        totalRefunds: 0,
        avgOrderValue: rawSales > 0 ? initialRev / rawSales : 0,
        growthYoY: p.growthYoY || "+15%",
        isArchived,
        channels: [defaultChannel],
        providers: [defaultChannel],
        salesTimeSeries: p.salesTimeSeries || [],
        createdAt: p.createdAt || new Date().toISOString(),
      });
    });

    // Correlate transactions with product catalog
    if (normalizedTxs.length > 0) {
      productMap.forEach((prod) => {
        const matchingTxs = normalizedTxs.filter((tx) => {
          const prodIdClean = prod.id.toLowerCase().replace(/[^a-z0-9]/g, "");
          const txProdIdClean = tx.productId.toLowerCase().replace(/[^a-z0-9]/g, "");
          const txNameClean = tx.productName.toLowerCase().replace(/[^a-z0-9]/g, "");
          const prodNameClean = prod.name.toLowerCase().replace(/[^a-z0-9]/g, "");

          return (
            tx.productId === prod.id ||
            txProdIdClean.includes(prodIdClean) ||
            prodIdClean.includes(txProdIdClean) ||
            txNameClean.includes(prodNameClean) ||
            prodNameClean.includes(txNameClean) ||
            productMap.size === 1
          );
        });

        if (matchingTxs.length > 0) {
          const succeeded = matchingTxs.filter((t) => t.status === "succeeded");
          const refunded = matchingTxs.filter((t) => t.status === "refunded");

          const txRev = succeeded.reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
          const txRefunds = refunded.reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
          const uniqueCustomers = new Set(matchingTxs.map((t) => t.customerEmail).filter(Boolean));

          prod.totalRevenue = Math.max(prod.totalRevenue, txRev);
          prod.totalSales = Math.max(prod.totalSales, succeeded.length);
          prod.totalCustomers = Math.max(prod.totalCustomers, uniqueCustomers.size);
          prod.totalRefunds = txRefunds;
          prod.avgOrderValue = prod.totalSales > 0 ? prod.totalRevenue / prod.totalSales : 0;

          if (prod.channels?.[0]) {
            prod.channels[0].revenue = prod.totalRevenue;
            prod.channels[0].salesCount = prod.totalSales;
          }
          if (prod.providers?.[0]) {
            prod.providers[0].revenue = prod.totalRevenue;
            prod.providers[0].salesCount = prod.totalSales;
          }
        }
      });
    }

    const finalProducts = Array.from(productMap.values());
    setProducts(finalProducts);
  }, [primaryCurrency]);

  const refreshTelemetry = useCallback(async () => {
    try {
      const data = await QueryCache.fetchWithCache(
        "cache_query_telemetry",
        async () => {
          const res = await fetch("/api/telemetry");
          if (!res.ok) return { connections: [], products: [], transactions: [], subscriptions: [], customers: [] };
          return await res.json();
        },
        { ttlMinutes: 0.5, revalidateInBackground: true }
      );

      processTelemetryData(data);
    } catch (err) {
      console.warn("[Telemetry Refresh Error]", err);
    } finally {
      setIsInitialLoading(false);
    }
  }, [processTelemetryData]);

  useEffect(() => {
    refreshTelemetry();
  }, [refreshTelemetry]);

  // Load / Clear Demo Telemetry
  const loadDemoData = () => {
    setProviders(INITIAL_PROVIDERS);
    setProducts(INITIAL_PRODUCTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setActivities(INITIAL_ACTIVITY_EVENTS);
    setSelectedProductIdsForCompare(["prod_reel_player", "prod_hyperfocus_ios"]);
    setIsDemoMode(true);
  };

  const clearAllData = () => {
    setConnections([]);
    setProviders([]);
    setProducts([]);
    setTransactions([]);
    setActivities([]);
    setSelectedProductIdsForCompare([]);
    setSelectedProductForDetail(null);
    setIsDemoMode(false);
  };

  // Currency Conversions
  const convertFromUSD = (amountUSD: number, targetCurrency: CurrencyCode = primaryCurrency): number => {
    return convertCurrency(amountUSD, "USD", targetCurrency);
  };

  const formatCurrency = (amountUSD: number, targetCurrency: CurrencyCode = primaryCurrency): string => {
    const converted = convertCurrency(amountUSD, "USD", targetCurrency);
    return formatCurrencyAmount(converted, targetCurrency, { hideDecimals: true });
  };

  // Consolidated Aggregates
  const totalConsolidatedRevenue = useMemo(() => {
    if (transactions.length > 0) {
      return transactions
        .filter((t) => t.status === "succeeded")
        .reduce((sum, t) => {
          const norm = convertCurrency(t.amount, t.currency, primaryCurrency);
          return sum + norm;
        }, 0);
    }
    return products.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  }, [transactions, products, primaryCurrency]);

  const totalConsolidatedSales = useMemo(() => {
    if (transactions.length > 0) {
      return transactions.filter((t) => t.status === "succeeded").length;
    }
    return products.reduce((sum, p) => sum + (p.totalSales || 0), 0);
  }, [transactions, products]);

  const totalConsolidatedCustomers = useMemo(() => {
    if (transactions.length > 0) {
      const uniqueCust = new Set(transactions.map((t) => t.customerEmail).filter(Boolean));
      return Math.max(uniqueCust.size, products.reduce((sum, p) => sum + (p.totalCustomers || 0), 0));
    }
    return products.reduce((sum, p) => sum + (p.totalCustomers || 0), 0);
  }, [transactions, products]);

  const totalConsolidatedMRR = useMemo(() => {
    return products.reduce((sum, p) => sum + (p.mrr || 0), 0);
  }, [products]);

  const totalConsolidatedRefunds = useMemo(() => {
    if (transactions.length > 0) {
      return transactions
        .filter((t) => t.status === "refunded")
        .reduce((sum, t) => sum + convertCurrency(t.amount, t.currency, primaryCurrency), 0);
    }
    return products.reduce((sum, p) => sum + (p.totalRefunds || 0), 0);
  }, [transactions, products, primaryCurrency]);

  // Provider Syncing
  const isProviderSyncing = useCallback(
    (providerId: string) => {
      const matched = providers.find((p) => p.id === providerId || p.provider === providerId);
      const targetProvider = matched?.provider || providerId;
      return syncingProviderIds.includes(providerId) || syncingProviderIds.includes(targetProvider);
    },
    [syncingProviderIds, providers]
  );

  const syncProvider = async (providerId: string) => {
    const matched = providers.find((p) => p.id === providerId || p.provider === providerId);
    const targetProvider = matched?.provider || providerId;

    setSyncingProviderIds((prev) => Array.from(new Set([...prev, providerId, targetProvider])));
    try {
      const res = await fetch("/api/providers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: targetProvider }),
      });
      if (res.ok) {
        await QueryCache.invalidateAllSync();
        await refreshTelemetry();
      }
    } catch (err) {
      console.warn("[Sync Provider Error]", err);
    } finally {
      setSyncingProviderIds((prev) => prev.filter((id) => id !== providerId && id !== targetProvider));
    }
  };

  const syncAllProviders = async () => {
    setIsSyncingAny(true);
    const allIds = providers.map((p) => p.id).concat(providers.map((p) => p.provider));
    setSyncingProviderIds(Array.from(new Set(allIds)));
    try {
      await Promise.all(
        providers.map((p) =>
          fetch("/api/providers/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ providerId: p.provider }),
          })
        )
      );
      await QueryCache.invalidateAllSync();
      await refreshTelemetry();
    } catch (err) {
      console.warn("[Sync All Providers Error]", err);
    } finally {
      setIsSyncingAny(false);
      setSyncingProviderIds([]);
    }
  };

  const addProviderConnection = async (conn: ProviderConnection) => {
    await QueryCache.invalidateAllSync();

    try {
      await fetch("/api/providers/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: conn.providerId }),
      });

      const res = await fetch("/api/telemetry");
      if (res.ok) {
        const freshData = await res.json();
        processTelemetryData(freshData);
        return;
      }
    } catch (err) {
      console.warn("[Auto-Sync Error]", err);
    }

    setConnections((prev) => {
      const filtered = prev.filter((c) => c.providerId !== conn.providerId);
      return [...filtered, conn];
    });
    setProviders((prev) => {
      const filtered = prev.filter((p) => p.provider !== conn.providerId);
      return [
        ...filtered,
        {
          id: conn.id,
          provider: conn.providerId as ProviderType,
          accountName: conn.accountName,
          accountId: conn.accountId,
          connectedAt: conn.connectedAt || new Date().toISOString(),
          lastSyncedAt: conn.lastSyncedAt || new Date().toISOString(),
          status: "active" as const,
          metricsSupported: ["revenue", "sales", "customers", "subscriptions", "refunds", "countries"],
          isSandbox: conn.isSandbox,
        },
      ];
    });
    await refreshTelemetry();
  };

  const addProviderAccount = (
    provider: ProviderType,
    accountName = `${provider.toUpperCase()} Account`,
    credentials?: Record<string, string>
  ) => {
    const newConn: ProviderConnection = {
      id: `conn_${provider}_${Date.now()}`,
      providerId: provider as any,
      accountName,
      accountId: credentials?.accountId || `acct_${provider}_live`,
      status: "connected",
      capabilities: {
        supportsRevenue: true,
        supportsSubscriptions: true,
        supportsMRR: true,
        supportsRefunds: true,
        supportsCustomers: true,
        supportsCountries: true,
      },
      connectedAt: new Date().toISOString(),
      lastSyncedAt: new Date().toISOString(),
      isSandbox: false,
    };
    addProviderConnection(newConn);
  };

  const disconnectProvider = async (providerId: string) => {
    try {
      await fetch("/api/providers/disconnect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
    } catch (err) {
      console.warn("[Disconnect Error]", err);
    }

    setConnections((prev) => prev.filter((c) => c.providerId !== providerId && c.id !== providerId));
    setProviders((prev) => prev.filter((p) => p.id !== providerId && p.provider !== providerId));
    await QueryCache.invalidateAllSync();
  };

  const toggleProviderStatus = (providerId: string) => {
    setProviders((prev) =>
      prev.map((p) =>
        p.id === providerId
          ? { ...p, status: p.status === "active" ? ("disconnected" as const) : ("active" as const) }
          : p
      )
    );
  };

  const toggleProductForCompare = (productId: string) => {
    setSelectedProductIdsForCompare((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const clearCompareSelection = () => {
    setSelectedProductIdsForCompare([]);
  };

  const linkExternalProductToUnified = (
    unifiedId: string,
    mapping: {
      provider: ProviderType;
      externalProductId: string;
      externalProductName: string;
      revenue: number;
      salesCount: number;
      refunds: number;
      lastSaleAt: string;
    }
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== unifiedId) return p;
        const newChannels = [
          ...p.channels,
          {
            provider: mapping.provider,
            externalProductId: mapping.externalProductId,
            externalProductName: mapping.externalProductName,
            revenue: mapping.revenue,
            salesCount: mapping.salesCount,
            refunds: mapping.refunds,
            lastSaleAt: mapping.lastSaleAt,
          },
        ];
        return {
          ...p,
          totalRevenue: p.totalRevenue + mapping.revenue,
          totalSales: p.totalSales + mapping.salesCount,
          totalRefunds: p.totalRefunds + mapping.refunds,
          channels: newChannels,
          providers: newChannels,
        };
      })
    );
  };

  const postWorthyMilestones = useMemo(() => {
    return activities.filter((a) => a.metricValue > 0);
  }, [activities]);

  const markActivityShared = (activityId: string) => {
    setActivities((prev) =>
      prev.map((a) => (a.id === activityId ? { ...a, hasShared: true } : a))
    );
  };

  const loadMilestoneIntoStudio = (milestone: MilestoneToLoadInStudio) => {
    setStudioLoadedMilestone(milestone);
    setActiveTab("studio");
  };

  const clearStudioLoadedMilestone = () => {
    setStudioLoadedMilestone(null);
  };

  const openBatchExportModal = (preset: GalleryPreset) => {
    setActiveExportPreset(preset);
    setIsBatchExportOpen(true);
  };

  return (
    <Indic8Context.Provider
      value={{
        activeTab,
        setActiveTab,
        primaryCurrency,
        setPrimaryCurrency: handleSetPrimaryCurrency,
        timePeriod,
        setTimePeriod,
        formatCurrency,
        convertFromUSD,

        isDemoMode,
        loadDemoData,
        clearAllData,
        isInitialLoading,

        connections,
        providers,
        products,
        transactions,
        activities,
        galleryPresets,

        totalConsolidatedRevenue,
        totalConsolidatedSales,
        totalConsolidatedCustomers,
        totalConsolidatedMRR,
        totalConsolidatedRefunds,

        isSyncingAny,
        syncingProviderIds,
        isProviderSyncing,
        syncProvider,
        syncAllProviders,
        toggleProviderStatus,
        addProviderAccount,
        addProviderConnection,
        disconnectProvider,

        selectedProductIdsForCompare,
        toggleProductForCompare,
        clearCompareSelection,

        selectedProductForDetail,
        setSelectedProductForDetail,
        linkExternalProductToUnified,

        postWorthyMilestones,
        markActivityShared,

        studioLoadedMilestone,
        loadMilestoneIntoStudio,
        clearStudioLoadedMilestone,

        isBatchExportOpen,
        setIsBatchExportOpen,
        activeExportPreset,
        openBatchExportModal,

        isOnboardingOpen,
        setIsOnboardingOpen,
      }}
    >
      {children}
    </Indic8Context.Provider>
  );
};

export const useIndic8Store = (): Indic8ContextType => {
  const context = useContext(Indic8Context);
  if (!context) {
    throw new Error("useIndic8Store must be used within an Indic8Provider");
  }
  return context;
};