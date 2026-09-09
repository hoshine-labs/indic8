/**
 * Lemon Squeezy Provider Adapter
 * 
 * Interacts directly with Lemon Squeezy REST API v1 (api.lemonsqueezy.com/v1)
 * Extracts store catalog, digital products with thumbnail art, multi-currency orders,
 * tax deductions, customer emails/countries, and recurring subscription MRR.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

export class LemonSqueezyAdapter implements PaymentProviderAdapter {
  readonly id = "lemonsqueezy" as const;
  readonly name = "Lemon Squeezy";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };
  }

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();

    if (!apiKey) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Lemon Squeezy API Key is required.",
        capabilities: this.capabilities,
      };
    }

    const headers = this.getHeaders(apiKey);

    try {
      // 1. Try fetching stores first to discover actual store name and ID
      const storesRes = await fetch(`${LS_API_BASE}/stores`, { headers });
      if (storesRes.ok) {
        const storesData = await storesRes.json();
        const store = storesData.data?.[0];
        const storeId = store?.id ? String(store.id) : `ls_store_${Date.now()}`;
        const storeName = store?.attributes?.name
          ? `${store.attributes.name} (Lemon Squeezy)`
          : credentials.accountName || "Lemon Squeezy Store";

        return {
          isValid: true,
          accountId: storeId,
          accountName: storeName,
          capabilities: this.capabilities,
        };
      }

      // 2. Fallback to /users/me
      const userRes = await fetch(`${LS_API_BASE}/users/me`, { headers });
      if (userRes.ok) {
        const userData = await userRes.json();
        const user = userData.data?.attributes;
        return {
          isValid: true,
          accountId: userData.data?.id ? String(userData.data.id) : `ls_${Date.now()}`,
          accountName: user?.name ? `${user.name}'s Store` : "Lemon Squeezy Store",
          capabilities: this.capabilities,
        };
      }

      const errData = await userRes.json().catch(() => ({}));
      const errMsg = errData.errors?.[0]?.detail || "Lemon Squeezy rejected this API Key. Please verify key permissions in Settings > API.";

      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: errMsg,
        capabilities: this.capabilities,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: err instanceof Error ? err.message : "Network error contacting Lemon Squeezy API.",
        capabilities: this.capabilities,
      };
    }
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();
    if (!apiKey) throw new Error("Missing Lemon Squeezy API key.");

    const headers = this.getHeaders(apiKey);

    // Parallel fetch of Products, Orders, Subscriptions, and Customers
    const [productsRes, ordersRes, subsRes, custRes] = await Promise.all([
      fetch(`${LS_API_BASE}/products?page[size]=100`, { headers }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
      fetch(`${LS_API_BASE}/orders?page[size]=100`, { headers }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
      fetch(`${LS_API_BASE}/subscriptions?page[size]=100`, { headers }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
      fetch(`${LS_API_BASE}/customers?page[size]=100`, { headers }).then((r) => (r.ok ? r.json() : { data: [] })).catch(() => ({ data: [] })),
    ]);

    const rawProducts = productsRes.data || [];
    const products: RawProviderProduct[] = rawProducts.map((p: any) => {
      const attrs = p.attributes || {};
      const thumb = attrs.large_thumb_url || attrs.thumb_url || undefined;
      const mediaList: string[] = [];
      if (thumb) mediaList.push(thumb);

      const isArchived = attrs.status ? attrs.status !== "published" : false;

      return {
        providerId: "lemonsqueezy" as const,
        externalProductId: String(p.id),
        name: attrs.name || "Digital Product",
        description: attrs.description || undefined,
        category: "Digital Asset",
        imageUrl: thumb,
        medias: mediaList,
        isArchived,
        createdAt: attrs.created_at || new Date().toISOString(),
      };
    });

    const rawOrders = ordersRes.data || [];
    const transactions: RawProviderTransaction[] = rawOrders.map((o: any) => {
      const attrs = o.attributes || {};
      const amountCents = typeof attrs.total === "number" ? attrs.total : typeof attrs.total_usd === "number" ? attrs.total_usd : 0;
      const taxCents = typeof attrs.tax === "number" ? attrs.tax : typeof attrs.tax_usd === "number" ? attrs.tax_usd : 0;
      const netCents = amountCents - taxCents;

      const customerEmail = attrs.user_email || attrs.customer_email || undefined;
      const customerName = attrs.user_name || attrs.customer_name || undefined;
      const country = (attrs.country || attrs.tax_name || "US").toUpperCase().slice(0, 2);

      const isRefunded = attrs.status === "refunded" || (attrs.refunded_amount && attrs.refunded_amount > 0);
      const isSucceeded = attrs.status === "paid";

      return {
        providerId: "lemonsqueezy" as const,
        externalTransactionId: String(o.id),
        externalProductId: attrs.first_order_item?.product_id ? String(attrs.first_order_item.product_id) : "prod_ls_general",
        productName: attrs.first_order_item?.product_name || attrs.order_number ? `Order #${attrs.order_number}` : "Lemon Squeezy Order",
        externalCustomerId: attrs.customer_id ? String(attrs.customer_id) : undefined,
        customerEmail,
        customerName,
        amount: amountCents / 100,
        amountCents,
        feeCents: taxCents,
        netCents,
        currency: (attrs.currency || "USD").toUpperCase(),
        status: isRefunded ? ("refunded" as const) : isSucceeded ? ("succeeded" as const) : ("failed" as const),
        country,
        occurredAt: attrs.created_at || new Date().toISOString(),
        timestamp: attrs.created_at || new Date().toISOString(),
      };
    });

    const rawSubs = subsRes.data || [];
    const subscriptions: RawProviderSubscription[] = rawSubs.map((s: any) => {
      const attrs = s.attributes || {};
      const recurringPrice = attrs.first_order_item?.price || attrs.order_item?.price || attrs.total || 0;
      const isAnnual = attrs.renews_at && attrs.created_at && (new Date(attrs.renews_at).getTime() - new Date(attrs.created_at).getTime() > 180 * 24 * 3600 * 1000);
      const interval: "month" | "year" = isAnnual ? "year" : "month";
      const mrrCents = interval === "year" ? Math.round(recurringPrice / 12) : recurringPrice;

      return {
        providerId: "lemonsqueezy" as const,
        externalSubscriptionId: String(s.id),
        externalProductId: attrs.product_id ? String(attrs.product_id) : "prod_ls_sub",
        externalCustomerId: attrs.customer_id ? String(attrs.customer_id) : undefined,
        customerEmail: attrs.user_email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: (attrs.currency || "USD").toUpperCase(),
        status: attrs.status === "active" || attrs.status === "on_trial" ? ("active" as const) : ("canceled" as const),
        interval,
        startedAt: attrs.created_at || new Date().toISOString(),
        currentPeriodEnd: attrs.renews_at || attrs.ends_at,
      };
    });

    const rawCusts = custRes.data || [];
    const customers: RawProviderCustomer[] = rawCusts.map((cu: any) => {
      const attrs = cu.attributes || {};
      return {
        id: String(cu.id),
        providerId: "lemonsqueezy" as const,
        externalCustomerId: String(cu.id),
        email: attrs.email || undefined,
        name: attrs.name || undefined,
        country: (attrs.country || "US").toUpperCase().slice(0, 2),
        totalSpend: typeof attrs.total_revenue_currency === "number" ? attrs.total_revenue_currency / 100 : 0,
        currency: (attrs.currency || "USD").toUpperCase(),
        createdAt: attrs.created_at || new Date().toISOString(),
      };
    });

    return { products, transactions, subscriptions, customers };
  }
}
