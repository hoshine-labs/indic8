/**
 * Dodo Payments Provider Adapter
 * 
 * Interacts directly with Dodo Payments REST API
 * Supports live (live.dodopayments.com), test (test.dodopayments.com), and fallback API hosts.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import { ProviderCapabilities, RawProviderProduct, RawProviderTransaction, RawProviderSubscription, RawProviderCustomer } from "@/lib/domain/types";

const DODO_PROD_BASE = "https://live.dodopayments.com";
const DODO_TEST_BASE = "https://test.dodopayments.com";
const DODO_ALT_BASE = "https://api.dodopayments.com";

function extractList(res: any): any[] {
  if (!res) return [];
  if (Array.isArray(res)) return res;
  if (Array.isArray(res.items)) return res.items;
  if (Array.isArray(res.data)) return res.data;
  if (Array.isArray(res.products)) return res.products;
  if (Array.isArray(res.payments)) return res.payments;
  if (Array.isArray(res.subscriptions)) return res.subscriptions;
  if (Array.isArray(res.customers)) return res.customers;
  if (Array.isArray(res.result)) return res.result;
  return [];
}

export class DodoPaymentsAdapter implements PaymentProviderAdapter {
  readonly id = "dodopayments" as const;
  readonly name = "Dodo Payments";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getBaseUrls(credentials: Record<string, string>): string[] {
    const key = credentials.apiKey?.trim() || credentials.token?.trim() || "";
    if (credentials.environment === "test" || credentials.isSandbox === "true" || key.includes("test") || key.includes("test_")) {
      return [DODO_TEST_BASE, DODO_PROD_BASE, DODO_ALT_BASE];
    }
    return [DODO_PROD_BASE, DODO_TEST_BASE, DODO_ALT_BASE];
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "x-api-key": apiKey,
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
        errorMessage: "Dodo Payments Secret API Key is required.",
        capabilities: this.capabilities,
      };
    }

    const baseUrls = this.getBaseUrls(credentials);
    const headers = this.getHeaders(apiKey);
    const candidateEndpoints = [
      "/v1/products?limit=1",
      "/v1/payments?limit=1",
      "/v1/subscriptions?limit=1",
      "/v1/customers?limit=1",
      "/products?limit=1",
      "/payments?limit=1",
    ];

    let isValid = false;
    let authError = "";
    let activeBaseUrl = baseUrls[0];

    for (const baseUrl of baseUrls) {
      for (const endpoint of candidateEndpoints) {
        try {
          const res = await fetch(`${baseUrl}${endpoint}`, { headers });
          if (res.ok) {
            isValid = true;
            activeBaseUrl = baseUrl;
            break;
          } else if (res.status === 401 || res.status === 403) {
            const err = await res.json().catch(() => ({}));
            authError = err.message || err.detail || `Dodo Payments rejected credential (HTTP ${res.status}).`;
          }
        } catch (err) {
          authError = err instanceof Error ? err.message : "Network error contacting Dodo Payments API.";
        }
      }
      if (isValid) break;
    }

    if (!isValid) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: authError || "Dodo Payments rejected this Secret API Key. Please verify your API Key in Dodo Developer Dashboard.",
        capabilities: this.capabilities,
      };
    }

    return {
      isValid: true,
      accountId: credentials.accountId || `dodo_merchant_${Date.now()}`,
      accountName: credentials.accountName || "Dodo Payments Merchant",
      capabilities: this.capabilities,
    };
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();
    if (!apiKey) throw new Error("Missing Dodo Payments API key.");

    const baseUrls = this.getBaseUrls(credentials);
    const headers = this.getHeaders(apiKey);

    let activeBaseUrl = baseUrls[0];

    // Helper for multi-endpoint fallback fetching
    const safeFetch = async (paths: string[]) => {
      for (const baseUrl of baseUrls) {
        for (const path of paths) {
          try {
            const res = await fetch(`${baseUrl}${path}`, { headers });
            if (res.ok) {
              const data = await res.json();
              return extractList(data);
            }
          } catch {}
        }
      }
      return [];
    };

    const [rawProducts, rawPayments, rawSubs, rawCustomers] = await Promise.all([
      safeFetch(["/v1/products?limit=100", "/products?limit=100"]),
      safeFetch(["/v1/payments?limit=100", "/payments?limit=100", "/v1/orders?limit=100"]),
      safeFetch(["/v1/subscriptions?limit=100", "/subscriptions?limit=100"]),
      safeFetch(["/v1/customers?limit=100", "/customers?limit=100"]),
    ]);

function extractProductImageUrl(p: any): string | undefined {
  if (!p) return undefined;
  if (typeof p.image_url === "string" && p.image_url.trim()) return p.image_url.trim();
  if (typeof p.image === "string" && p.image.trim()) return p.image.trim();
  if (typeof p.image === "object" && p.image?.url) return p.image.url;
  if (typeof p.logo === "string" && p.logo.trim()) return p.logo.trim();
  if (typeof p.logo_url === "string" && p.logo_url.trim()) return p.logo_url.trim();
  if (typeof p.banner_url === "string" && p.banner_url.trim()) return p.banner_url.trim();
  if (typeof p.cover_url === "string" && p.cover_url.trim()) return p.cover_url.trim();
  if (Array.isArray(p.images) && p.images.length > 0) {
    const first = p.images[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (typeof first === "object" && first?.url) return first.url;
  }
  if (Array.isArray(p.media) && p.media.length > 0) {
    const first = p.media[0];
    if (typeof first === "string" && first.trim()) return first.trim();
    if (typeof first === "object" && first?.url) return first.url;
  }
  return undefined;
}

    const products: RawProviderProduct[] = rawProducts.map((p: any) => ({
      providerId: "dodopayments" as const,
      externalProductId: p.product_id || p.id || `prod_${Date.now()}`,
      name: p.name || p.title || "Dodo Product",
      description: p.description || undefined,
      category: p.category || "Digital Product",
      imageUrl: extractProductImageUrl(p),
      createdAt: p.created_at || new Date().toISOString(),
    }));

    const transactions: RawProviderTransaction[] = rawPayments.map((o: any) => {
      const amountCents = typeof o.amount === "number" ? o.amount : Math.round((o.total_amount || 0) * 100);
      const feeCents = typeof o.fee === "number" ? o.fee : Math.round(amountCents * 0.05); // Standard MOR fee estimation
      const netCents = amountCents - feeCents;

      return {
        providerId: "dodopayments" as const,
        externalTransactionId: o.payment_id || o.id || `tx_dodo_${Date.now()}`,
        externalProductId: o.product_id || o.product?.id || "prod_dodo_general",
        productName: o.product_name || o.product?.name || "Dodo Product",
        externalCustomerId: o.customer_id || o.customer?.id,
        customerEmail: o.customer?.email || o.email || undefined,
        customerName: o.customer?.name || o.name || undefined,
        amount: amountCents / 100,
        amountCents,
        feeCents,
        netCents,
        currency: (o.currency || "USD").toUpperCase(),
        status: o.status === "succeeded" || o.status === "paid" ? ("succeeded" as const) : o.status === "refunded" ? ("refunded" as const) : ("failed" as const),
        country: (o.billing_country || o.customer?.country || "US").toUpperCase().slice(0, 2),
        occurredAt: o.created_at || new Date().toISOString(),
        timestamp: o.created_at || new Date().toISOString(),
      };
    });

    const subscriptions: RawProviderSubscription[] = rawSubs.map((s: any) => {
      const planAmount = s.recurring_price || s.price || s.amount || 0;
      const interval = s.payment_frequency === "Yearly" || s.interval === "year" ? "year" : "month";
      const mrrCents = interval === "year" ? Math.round(planAmount / 12) : planAmount;

      return {
        providerId: "dodopayments" as const,
        externalSubscriptionId: s.subscription_id || s.id || `sub_dodo_${Date.now()}`,
        externalProductId: s.product_id || s.product?.id || "prod_dodo_sub",
        externalCustomerId: s.customer_id || s.customer?.id,
        customerEmail: s.customer?.email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: (s.currency || "USD").toUpperCase(),
        status: s.status === "active" ? ("active" as const) : ("canceled" as const),
        interval: interval as "month" | "year",
        startedAt: s.created_at || new Date().toISOString(),
        currentPeriodEnd: s.next_billing_date || s.current_period_end,
      };
    });

    const customers: RawProviderCustomer[] = rawCustomers.map((cu: any) => ({
      id: cu.customer_id || cu.id,
      providerId: "dodopayments" as const,
      externalCustomerId: cu.customer_id || cu.id,
      email: cu.email || undefined,
      name: cu.name || undefined,
      country: (cu.country || cu.billing_address?.country || "US").toUpperCase().slice(0, 2),
      createdAt: cu.created_at || new Date().toISOString(),
    }));

    return { products, transactions, subscriptions, customers };
  }
}
