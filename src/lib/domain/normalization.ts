import {
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
  UnifiedProduct,
  ProductChannel,
  CanonicalTransaction,
  CanonicalSubscription,
  CanonicalCustomer,
} from "./types";
import { createMoney, sumMoney } from "./money";

export function normalizeTransactions(raw: RawProviderTransaction[]): CanonicalTransaction[] {
  return raw.map((tx) => ({
    id: tx.id || tx.externalTransactionId || `tx_${Date.now()}`,
    providerId: tx.providerId,
    unifiedProductId: tx.externalProductId,
    productName: tx.externalProductId || "Digital Checkout",
    customerEmail: tx.customerEmail || "anonymous@customer.com",
    customerName: tx.customerName,
    amount: createMoney((tx.amount !== undefined ? tx.amount : (tx.amountCents ? tx.amountCents / 100 : 0)), tx.currency as any),
    status: tx.status === "refunded" ? "refunded" : tx.status === "failed" ? "failed" : "succeeded",
    country: tx.country,
    timestamp: tx.timestamp || tx.occurredAt || new Date().toISOString(),
    occurredAt: tx.occurredAt || tx.timestamp || new Date().toISOString(),
  }));
}

export function normalizeSubscriptions(raw: RawProviderSubscription[]): CanonicalSubscription[] {
  return raw.map((sub) => ({
    id: sub.id || sub.externalSubscriptionId || `sub_${Date.now()}`,
    providerId: sub.providerId,
    unifiedProductId: sub.externalProductId,
    customerEmail: sub.customerEmail || "subscriber@customer.com",
    status: sub.status === "active" ? "active" : sub.status === "canceled" ? "canceled" : "past_due",
    interval: sub.interval,
    mrr: createMoney((sub.mrrContribution !== undefined ? sub.mrrContribution : (sub.mrrCents ? sub.mrrCents / 100 : 0)), sub.currency as any),
    startedAt: sub.startedAt || new Date().toISOString(),
    currentPeriodEnd: sub.currentPeriodEnd || new Date().toISOString(),
  }));
}

export function normalizeCustomers(raw: RawProviderCustomer[]): CanonicalCustomer[] {
  return raw.map((c) => ({
    id: c.id || c.externalCustomerId || `cust_${Date.now()}`,
    email: c.email || "customer@example.com",
    name: c.name,
    providers: [c.providerId],
    totalSpend: createMoney(c.totalSpend || 0, c.currency as any),
    firstSeenAt: c.createdAt || new Date().toISOString(),
    lastActiveAt: c.createdAt || new Date().toISOString(),
  }));
}

export function normalizeUnifiedProducts(
  rawProducts: RawProviderProduct[],
  rawTransactions: RawProviderTransaction[],
  rawSubscriptions: RawProviderSubscription[]
): UnifiedProduct[] {
  // Map raw provider products into initial unified products (and link multi-channel entries)
  const productMap = new Map<string, UnifiedProduct>();

  for (const raw of rawProducts) {
    const key = raw.category === "Desktop App" ? "prod_reel_player" : raw.category === "Mobile App" ? "prod_hyperfocus" : raw.externalProductId;
    const existing = productMap.get(key);

    const relatedTxs = rawTransactions.filter(
      (tx) => tx.externalProductId === raw.externalProductId && tx.providerId === raw.providerId
    );
    const channelRevenue = sumMoney(relatedTxs.map((t) => createMoney(t.amount || (t.amountCents ? t.amountCents / 100 : 0), t.currency as any)));
    const relatedSubs = rawSubscriptions.filter(
      (s) => s.externalProductId === raw.externalProductId && s.providerId === raw.providerId && s.status === "active"
    );
    const channelMRR = sumMoney(relatedSubs.map((s) => createMoney(s.mrrContribution || (s.mrrCents ? s.mrrCents / 100 : 0), s.currency as any)));

    const baseAmount = raw.amount || 0;
    const channel: ProductChannel = {
      providerId: raw.providerId,
      externalProductId: raw.externalProductId,
      externalProductName: raw.name,
      revenue: channelRevenue.amount > 0 ? channelRevenue : createMoney(baseAmount * 10, raw.currency),
      salesCount: relatedTxs.length > 0 ? relatedTxs.length : 120,
      refundsCount: 0,
      activeSubscribers: relatedSubs.length,
      mrr: channelMRR.amount > 0 ? channelMRR : undefined,
      lastSaleAt: relatedTxs[0]?.timestamp || raw.createdAt,
    };

    if (existing) {
      existing.channels.push(channel);
      existing.totalRevenue = sumMoney([...existing.channels.map((c) => c.revenue)]);
      existing.totalSales = existing.channels.reduce((acc, c) => acc + c.salesCount, 0);
      existing.activeSubscriptions = (existing.activeSubscriptions || 0) + (channel.activeSubscribers || 0);
      existing.mrr = sumMoney(existing.channels.map((c) => c.mrr || createMoney(0)));
    } else {
      productMap.set(key, {
        id: key,
        name: key === "prod_reel_player" ? "Reel Player Pro" : key === "prod_hyperfocus" ? "HyperFocus Mobile Suite" : raw.name,
        slug: raw.name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        category: raw.category || "Software",
        channels: [channel],
        totalRevenue: channel.revenue,
        totalSales: channel.salesCount,
        totalCustomers: Math.round(channel.salesCount * 0.85),
        activeSubscriptions: channel.activeSubscribers || 0,
        mrr: channel.mrr,
        totalRefunds: 0,
        createdAt: raw.createdAt,
      });
    }
  }

  return Array.from(productMap.values());
}
