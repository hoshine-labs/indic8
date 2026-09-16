/**
 * Creem Provider Adapter
 * 
 * Interacts directly with Creem REST API (https://api.creem.io/v1 and https://test-api.creem.io/v1)
 * Supports live production, test/sandbox mode, full catalog discovery via /v1/products/search,
 * uploaded dashboard images (image_url, image_urls), transactions, subscriptions, and buyer telemetry.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

const CREEM_PROD_BASE = "https://api.creem.io/v1";
const CREEM_TEST_BASE = "https://test-api.creem.io/v1";
const CREEM_ALT_PROD = "https://api.creem.io";
const CREEM_ALT_TEST = "https://test-api.creem.io";

function extractCreemList(res: any, key?: string): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (res.result && Array.isArray(res.result.items)) return res.result.items;
  if (res.result && Array.isArray(res.result)) return res.result;
  if (Array.isArray(res.data)) return res.data;
  if (key && Array.isArray(res[key])) return res[key];
  if (Array.isArray(res.products)) return res.products;
  if (Array.isArray(res.transactions)) return res.transactions;
  if (Array.isArray(res.orders)) return res.orders;
  if (Array.isArray(res.payments)) return res.payments;
  if (Array.isArray(res.subscriptions)) return res.subscriptions;
  if (Array.isArray(res.customers)) return res.customers;
  return [];
}

function resolveCreemMedia(p: any): string[] {
  if (!p) return [];
  const list: string[] = [];

  const addUrl = (u: any) => {
    if (typeof u === "string" && u.trim().startsWith("http")) {
      const clean = u.trim();
      if (!list.includes(clean)) list.push(clean);
    } else if (u && typeof u === "object") {
      const cand = u.url || u.original_url || u.preview_url || u.thumbnail_url || u.src || u.image_url || u.imageUrl;
      if (typeof cand === "string" && cand.trim().startsWith("http")) {
        const clean = cand.trim();
        if (!list.includes(clean)) list.push(clean);
      }
    }
  };

  // Direct and nested image attributes from Creem Dashboard
  addUrl(p.image_url);
  addUrl(p.imageUrl);
  addUrl(p.image);
  addUrl(p.cover_url);
  addUrl(p.cover_image);
  addUrl(p.coverImage);
  addUrl(p.cover);
  addUrl(p.thumbnail_url);
  addUrl(p.thumbnailUrl);
  addUrl(p.thumbnail);
  addUrl(p.preview_url);
  addUrl(p.previewUrl);
  addUrl(p.icon_url);
  addUrl(p.iconUrl);
  addUrl(p.icon);
  addUrl(p.logo_url);
  addUrl(p.logoUrl);
  addUrl(p.logo);
  addUrl(p.product_image);
  addUrl(p.productImage);
  addUrl(p.avatar_url);
  addUrl(p.avatarUrl);

  if (Array.isArray(p.image_urls)) {
    p.image_urls.forEach((img: any) => addUrl(img));
  }
  if (Array.isArray(p.images)) {
    p.images.forEach((img: any) => addUrl(img));
  }
  if (Array.isArray(p.medias)) {
    p.medias.forEach((m: any) => addUrl(m));
  }
  if (Array.isArray(p.media)) {
    p.media.forEach((m: any) => addUrl(m));
  }
  if (Array.isArray(p.covers)) {
    p.covers.forEach((c: any) => addUrl(c));
  }

  return list;
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

  private getBaseUrls(credentials: Record<string, string>): string[] {
    const key = credentials.apiKey?.trim() || credentials.token?.trim() || credentials.accessToken?.trim() || "";
    if (
      credentials.environment === "test" ||
      credentials.isSandbox === "true" ||
      key.includes("test") ||
      key.startsWith("test_") ||
      key.startsWith("creem_test_")
    ) {
      return [CREEM_TEST_BASE, CREEM_PROD_BASE, CREEM_ALT_TEST, CREEM_ALT_PROD];
    }
    return [CREEM_PROD_BASE, CREEM_TEST_BASE, CREEM_ALT_PROD, CREEM_ALT_TEST];
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      "x-api-key": apiKey,
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };
  }

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim() || credentials.accessToken?.trim();

    if (!apiKey) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Creem API Key is required.",
        capabilities: this.capabilities,
      };
    }

    const baseUrls = this.getBaseUrls(credentials);
    const headers = this.getHeaders(apiKey);
    const candidateEndpoints = [
      "/products/search",
      "/v1/products/search",
      "/transactions/search",
      "/v1/transactions/search",
      "/subscriptions/search",
      "/v1/subscriptions/search",
    ];

    let isValid = false;
    let authError = "";
    const isTest = apiKey.includes("test") || apiKey.startsWith("creem_test_");

    for (const baseUrl of baseUrls) {
      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(`${baseUrl}${endpoint}`, { headers });
          if (res.ok) {
            isValid = true;
            break;
          } else if (res.status === 401 || res.status === 403) {
            const err = await res.json().catch(() => ({}));
            const msg = Array.isArray(err.message) ? err.message.join(", ") : err.message;
            authError = msg || err.error || err.detail || `Creem rejected credentials (HTTP ${res.status}).`;
          }
        } catch (err) {
          authError = err instanceof Error ? err.message : "Network error contacting Creem API.";
        }
      }
      if (isValid) break;
    }

    if (!isValid) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: authError || "Creem rejected this API Key. Please verify your API Key in the Creem Developer Dashboard.",
        capabilities: this.capabilities,
      };
    }

    return {
      isValid: true,
      accountId: credentials.accountId || `creem_${isTest ? "test_" : ""}${Date.now()}`,
      accountName: credentials.accountName || (isTest ? "Creem (Test Sandbox)" : "Creem Store"),
      capabilities: this.capabilities,
    };
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim() || credentials.accessToken?.trim();
    if (!apiKey) throw new Error("Missing Creem API key.");

    const baseUrls = this.getBaseUrls(credentials);
    const headers = this.getHeaders(apiKey);

    const safeFetch = async (paths: string[], key?: string) => {
      for (const baseUrl of baseUrls) {
        for (const path of paths) {
          try {
            const res = await fetch(`${baseUrl}${path}`, { headers });
            if (res.ok) {
              const data = await res.json();
              const list = extractCreemList(data, key);
              if (list.length > 0 || Array.isArray(data) || data.result || data.items || data.data) {
                return list;
              }
            }
          } catch {}
        }
      }
      return [];
    };

    const [rawProducts, rawTransactions, rawSubs, rawCustomers] = await Promise.all([
      safeFetch(["/products/search", "/v1/products/search", "/products", "/v1/products"], "products"),
      safeFetch(["/transactions/search", "/v1/transactions/search", "/orders", "/v1/orders", "/payments", "/v1/payments"], "transactions"),
      safeFetch(["/subscriptions/search", "/v1/subscriptions/search", "/subscriptions", "/v1/subscriptions"], "subscriptions"),
      safeFetch(["/customers/search", "/v1/customers/search", "/customers", "/v1/customers"], "customers"),
    ]);

    // 1. Process Products with complete media resolution
    const products: RawProviderProduct[] = rawProducts.map((p: any) => {
      const pId = String(p.id || p.product_id || p.productId || `creem_prod_${Date.now()}`);
      const mediaList = resolveCreemMedia(p);
      const isArchived = Boolean(p.status === "archived" || p.archived || p.deleted || p.is_archived);

      const rawPrice = typeof p.price === "number" ? p.price : typeof p.amount === "number" ? p.amount : typeof p.default_price === "number" ? p.default_price : 0;
      // In Creem API, prices are in cents (e.g. 1000 = $10.00, 2900 = $29.00, 900 = $9.00)
      const priceCents = rawPrice > 0 ? (rawPrice >= 100 && Number.isInteger(rawPrice) ? rawPrice : Math.round(rawPrice * 100)) : 0;
      const salesCount = typeof p.sales_count === "number" ? p.sales_count : typeof p.salesCount === "number" ? p.salesCount : typeof p.total_sales === "number" ? p.total_sales : 0;
      const totalRevenueCents = typeof p.total_revenue === "number" ? p.total_revenue : typeof p.totalRevenue === "number" ? p.totalRevenue : salesCount * priceCents;

      const isRecurring = p.billing_type === "recurring" || p.billingType === "recurring" || p.type === "recurring" || p.type === "subscription";

      return {
        providerId: "creem" as const,
        externalProductId: pId,
        name: p.name || p.title || "Creem Product",
        description: p.description || undefined,
        category: isRecurring ? "SaaS" : "Digital Product",
        imageUrl: mediaList.length > 0 ? mediaList[0] : undefined,
        medias: mediaList,
        amount: priceCents / 100,
        totalRevenue: totalRevenueCents / 100,
        salesCount,
        currency: (p.currency || "USD").toUpperCase(),
        isRecurring,
        recurringInterval: p.billing_period === "every-year" || p.billingPeriod === "every-year" || p.interval === "year" || p.recurring_interval === "year" ? ("year" as const) : ("month" as const),
        isArchived,
        createdAt: p.created_at || p.createdAt || new Date().toISOString(),
      };
    });

    // 2. Process Transactions / Orders
    const transactions: RawProviderTransaction[] = rawTransactions.map((t: any, idx: number) => {
      const rawAmt = typeof t.amount === "number" ? t.amount : typeof t.total_amount === "number" ? t.total_amount : typeof t.price === "number" ? t.price : 0;
      const amountCents = rawAmt > 0 && rawAmt < 50 ? Math.round(rawAmt * 100) : Math.round(rawAmt);
      const feeCents = typeof t.fee === "number" ? t.fee : typeof t.creem_fee === "number" ? t.creem_fee : Math.round(amountCents * 0.05);
      const netCents = Math.max(0, amountCents - feeCents);

      const isRefunded = t.status === "refunded" || Boolean(t.refunded) || Boolean(t.refund_amount);
      const isSucceeded = t.status === "succeeded" || t.status === "paid" || t.status === "completed" || !t.status;

      const country = String(
        t.customer?.country || t.billing_country || t.tax_country || t.country || "US"
      ).toUpperCase().slice(0, 2);

      const occurDate = t.created_at || t.createdAt || t.timestamp || new Date().toISOString();

      return {
        providerId: "creem" as const,
        externalTransactionId: String(t.id || t.transaction_id || t.order_id || `tx_creem_${idx}_${Date.now()}`),
        externalProductId: String(t.product_id || t.productId || t.product?.id || "creem_general"),
        productName: t.product_name || t.product?.name || t.productName || "Creem Order",
        externalCustomerId: t.customer_id || t.customerId || t.customer?.id,
        customerEmail: t.customer_email || t.customerEmail || t.customer?.email || t.email || undefined,
        customerName: t.customer_name || t.customerName || t.customer?.name || t.name || undefined,
        amount: amountCents / 100,
        amountCents,
        feeCents,
        netCents,
        currency: String(t.currency || "USD").toUpperCase(),
        status: isRefunded ? ("refunded" as const) : isSucceeded ? ("succeeded" as const) : ("failed" as const),
        country,
        occurredAt: occurDate,
        timestamp: occurDate,
      };
    });

    // 3. Process Subscriptions
    const subscriptions: RawProviderSubscription[] = rawSubs.map((s: any, idx: number) => {
      const planAmount = typeof s.price === "number" ? s.price : typeof s.recurring_price === "number" ? s.recurring_price : typeof s.amount === "number" ? s.amount : 0;
      const interval = s.billing_period === "every-year" || s.billingPeriod === "every-year" || s.interval === "year" || s.interval === "yearly" || s.recurring_interval === "year" ? "year" : "month";
      const planCents = planAmount > 0 && planAmount < 50 ? Math.round(planAmount * 100) : Math.round(planAmount);
      const mrrCents = interval === "year" ? Math.round(planCents / 12) : planCents;

      const isSubActive = s.status === "active" || s.status === "paid";

      return {
        providerId: "creem" as const,
        externalSubscriptionId: String(s.id || s.subscription_id || `sub_creem_${idx}_${Date.now()}`),
        externalProductId: String(s.product_id || s.productId || s.product?.id || "creem_sub_product"),
        externalCustomerId: s.customer_id || s.customerId || s.customer?.id,
        customerEmail: s.customer_email || s.customerEmail || s.customer?.email || s.email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: String(s.currency || "USD").toUpperCase(),
        status: isSubActive ? ("active" as const) : s.status === "trialing" ? ("trialing" as const) : s.status === "past_due" ? ("past_due" as const) : ("canceled" as const),
        interval: interval as "month" | "year",
        startedAt: s.created_at || s.createdAt || new Date().toISOString(),
        currentPeriodEnd: s.current_period_end || s.currentPeriodEnd || s.next_billing_date,
      };
    });

    // 4. Process Customers
    const customers: RawProviderCustomer[] = rawCustomers.map((cu: any, idx: number) => ({
      id: String(cu.id || cu.customer_id || cu.customerId || `cust_creem_${idx}`),
      providerId: "creem" as const,
      externalCustomerId: String(cu.id || cu.customer_id || cu.customerId || `cust_creem_${idx}`),
      email: cu.email || undefined,
      name: cu.name || undefined,
      country: String(cu.country || cu.billing_address?.country || "US").toUpperCase().slice(0, 2),
      createdAt: cu.created_at || cu.createdAt || new Date().toISOString(),
    }));

    return { products, transactions, subscriptions, customers };
  }
}
