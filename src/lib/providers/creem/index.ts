/**
 * Creem Provider Adapter
 * 
 * Interacts directly with Creem Payment & MoR API (api.creem.io & test-api.creem.io)
 * Supports live and test keys, digital product catalogs, checkout transactions,
 * sales fees, recurring subscriptions, and customer spend.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

const CREEM_LIVE_BASE = "https://api.creem.io/v1";
const CREEM_TEST_BASE = "https://test-api.creem.io/v1";
const CREEM_ALT_LIVE = "https://api.creem.io";
const CREEM_ALT_TEST = "https://test-api.creem.io";

function extractCreemList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.orders)) return data.orders;
  if (Array.isArray(data.payments)) return data.payments;
  if (Array.isArray(data.checkouts)) return data.checkouts;
  if (Array.isArray(data.subscriptions)) return data.subscriptions;
  if (Array.isArray(data.customers)) return data.customers;
  return [];
}

export class CreemAdapter implements PaymentProviderAdapter {
  readonly id = "creem" as const;
  readonly name = "Creem";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getHeaders(apiKey: string): Record<string, string> {
    const cleanKey = apiKey.trim();
    return {
      "x-api-key": cleanKey,
      Authorization: `Bearer ${cleanKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
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
        errorMessage: "Creem API Key is required.",
        capabilities: this.capabilities,
      };
    }

    const headers = this.getHeaders(apiKey);
    const isTestKey = apiKey.toLowerCase().includes("test");

    // Candidate base URLs ordered by key type
    const candidateBases = isTestKey
      ? [CREEM_TEST_BASE, CREEM_ALT_TEST, CREEM_LIVE_BASE, CREEM_ALT_LIVE]
      : [CREEM_LIVE_BASE, CREEM_ALT_LIVE, CREEM_TEST_BASE, CREEM_ALT_TEST];

    const candidateEndpoints = [
      "/products",
      "/checkouts",
      "/customers",
      "/stores",
      "/discounts",
      "/orders",
      "/payments",
    ];

    let lastError = "Creem rejected this API Key. Please verify the key in Developer Settings.";

    for (const base of candidateBases) {
      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(`${base}${endpoint}`, { headers }).catch(() => null);
          if (res && res.ok) {
            const isSandbox = base.includes("test");
            return {
              isValid: true,
              accountId: credentials.accountId || `creem_${isSandbox ? "test" : "live"}_${Date.now()}`,
              accountName: credentials.accountName || `Creem ${isSandbox ? "Test" : "Merchant"} Store`,
              capabilities: this.capabilities,
            };
          }

          if (res && res.status !== 401 && res.status !== 403 && res.status !== 404) {
            // A non-401/403 status (e.g. 200, 204, or 400 with valid session) indicates authentication passed
            return {
              isValid: true,
              accountId: credentials.accountId || `creem_${Date.now()}`,
              accountName: credentials.accountName || "Creem Store",
              capabilities: this.capabilities,
            };
          }

          if (res && (res.status === 401 || res.status === 403)) {
            const errData = await res.json().catch(() => ({}));
            if (errData.message || errData.error) {
              lastError = errData.message || errData.error;
            }
          }
        } catch {
          // Continue to next probe
        }
      }
    }

    return {
      isValid: false,
      accountId: "",
      accountName: "",
      errorMessage: lastError,
      capabilities: this.capabilities,
    };
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();
    if (!apiKey) throw new Error("Missing Creem API key.");

    const headers = this.getHeaders(apiKey);
    const isTestKey = apiKey.toLowerCase().includes("test");

    const candidateBases = isTestKey
      ? [CREEM_TEST_BASE, CREEM_ALT_TEST, CREEM_LIVE_BASE, CREEM_ALT_LIVE]
      : [CREEM_LIVE_BASE, CREEM_ALT_LIVE, CREEM_TEST_BASE, CREEM_ALT_TEST];

    let workingBase = candidateBases[0];

    // Find first responsive base URL
    for (const base of candidateBases) {
      const probe = await fetch(`${base}/products`, { headers }).catch(() => null);
      if (probe && probe.ok) {
        workingBase = base;
        break;
      }
    }

    // Parallel fetch of Products, Orders/Payments, Subscriptions, and Customers
    const [productsRes, ordersRes, subsRes, custRes, checkoutsRes] = await Promise.all([
      fetch(`${workingBase}/products`, { headers }).catch(() => null),
      fetch(`${workingBase}/orders`, { headers }).catch(() => null),
      fetch(`${workingBase}/subscriptions`, { headers }).catch(() => null),
      fetch(`${workingBase}/customers`, { headers }).catch(() => null),
      fetch(`${workingBase}/checkouts`, { headers }).catch(() => null),
    ]);

    const rawProducts = productsRes && productsRes.ok ? extractCreemList(await productsRes.json()) : [];
    const products: RawProviderProduct[] = rawProducts.map((p: any) => {
      const isArchived = p.status === "archived" || p.status === "draft";
      const imageUrl = p.image_url || p.imageUrl || p.logo || p.thumbnail_url || undefined;
      const mediaList = imageUrl ? [imageUrl] : [];

      return {
        providerId: "creem" as const,
        externalProductId: String(p.id || p.productId || `creem_prod_${Date.now()}`),
        name: p.name || p.title || "Creem Digital Product",
        description: p.description || undefined,
        category: p.category || "Digital Product",
        imageUrl,
        medias: mediaList,
        isArchived,
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      };
    });

    // If no products were returned from /products, try checkouts
    if (products.length === 0 && checkoutsRes && checkoutsRes.ok) {
      const rawCheckouts = extractCreemList(await checkoutsRes.json());
      rawCheckouts.forEach((ch: any) => {
        const prodId = ch.product_id || ch.id || `creem_prod_${Date.now()}`;
        if (!products.some((p) => p.externalProductId === String(prodId))) {
          products.push({
            providerId: "creem" as const,
            externalProductId: String(prodId),
            name: ch.product_name || ch.title || "Creem Digital Product",
            description: ch.description || undefined,
            category: "Digital Product",
            createdAt: ch.created_at || new Date().toISOString(),
          });
        }
      });
    }

    const rawOrders = ordersRes && ordersRes.ok ? extractCreemList(await ordersRes.json()) : [];
    const transactions: RawProviderTransaction[] = rawOrders.map((o: any) => {
      const amountCents =
        typeof o.amount_cents === "number"
          ? o.amount_cents
          : typeof o.amount === "number"
          ? Math.round(o.amount * 100)
          : typeof o.total === "number"
          ? Math.round(o.total * 100)
          : 0;
      const feeCents =
        typeof o.fee_cents === "number"
          ? o.fee_cents
          : typeof o.fee === "number"
          ? Math.round(o.fee * 100)
          : 0;
      const netCents = amountCents - feeCents;

      const isRefunded = o.status === "refunded";
      const isSucceeded = o.status === "succeeded" || o.status === "paid" || o.status === "completed";

      const country = (o.customer_country || o.country || o.customer?.country || "US").toUpperCase().slice(0, 2);

      return {
        providerId: "creem" as const,
        externalTransactionId: String(o.id || o.order_id || `tx_${Date.now()}`),
        externalProductId: o.product_id ? String(o.product_id) : "creem_general",
        productName: o.product_name || o.product?.name || "Creem Order",
        externalCustomerId: o.customer_id ? String(o.customer_id) : undefined,
        customerEmail: o.customer_email || o.customer?.email || undefined,
        customerName: o.customer_name || o.customer?.name || undefined,
        amount: amountCents / 100,
        amountCents,
        feeCents,
        netCents,
        currency: (o.currency || "USD").toUpperCase(),
        status: isRefunded ? ("refunded" as const) : isSucceeded ? ("succeeded" as const) : ("failed" as const),
        country,
        occurredAt: o.created_at || o.createdAt || new Date().toISOString(),
        timestamp: o.created_at || o.createdAt || new Date().toISOString(),
      };
    });

    const rawSubs = subsRes && subsRes.ok ? extractCreemList(await subsRes.json()) : [];
    const subscriptions: RawProviderSubscription[] = rawSubs.map((s: any) => {
      const amountCents =
        typeof s.amount_cents === "number"
          ? s.amount_cents
          : typeof s.amount === "number"
          ? Math.round(s.amount * 100)
          : 0;
      const interval: "month" | "year" = s.interval === "year" || s.billing_period === "yearly" ? "year" : "month";
      const mrrCents = interval === "year" ? Math.round(amountCents / 12) : amountCents;

      return {
        providerId: "creem" as const,
        externalSubscriptionId: String(s.id || s.subscription_id),
        externalProductId: s.product_id ? String(s.product_id) : "creem_sub",
        externalCustomerId: s.customer_id ? String(s.customer_id) : undefined,
        customerEmail: s.customer_email || s.customer?.email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: (s.currency || "USD").toUpperCase(),
        status: s.status === "active" ? ("active" as const) : ("canceled" as const),
        interval,
        startedAt: s.created_at || s.createdAt || new Date().toISOString(),
        currentPeriodEnd: s.current_period_end || s.renews_at,
      };
    });

    const rawCusts = custRes && custRes.ok ? extractCreemList(await custRes.json()) : [];
    const customers: RawProviderCustomer[] = rawCusts.map((cu: any) => ({
      id: String(cu.id || cu.customer_id),
      providerId: "creem" as const,
      externalCustomerId: String(cu.id || cu.customer_id),
      email: cu.email || undefined,
      name: cu.name || undefined,
      country: (cu.country || "US").toUpperCase().slice(0, 2),
      totalSpend: typeof cu.total_spend === "number" ? cu.total_spend : 0,
      currency: (cu.currency || "USD").toUpperCase(),
      createdAt: cu.created_at || new Date().toISOString(),
    }));

    return { products, transactions, subscriptions, customers };
  }
}
