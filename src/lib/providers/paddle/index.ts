/**
 * Paddle Billing Provider Adapter
 * 
 * Interacts with Paddle Billing REST API v1 (api.paddle.com & sandbox-api.paddle.com)
 * Extracts merchant of record global transactions, tax remittance, product catalogs,
 * multi-tier recurring subscriptions, and customer buyer records.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

const PADDLE_API_LIVE = "https://api.paddle.com";
const PADDLE_API_SANDBOX = "https://sandbox-api.paddle.com";

function extractPaddleList(data: any): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.data)) return data.data;
  if (Array.isArray(data.items)) return data.items;
  return [];
}

export class PaddleAdapter implements PaymentProviderAdapter {
  readonly id = "paddle" as const;
  readonly name = "Paddle";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getBaseUrl(isSandbox?: boolean): string {
    return isSandbox ? PADDLE_API_SANDBOX : PADDLE_API_LIVE;
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      Authorization: `Bearer ${apiKey}`,
      "Paddle-Version": "1",
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };
  }

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();
    const isSandbox = Boolean(credentials.isSandbox);
    const baseUrl = this.getBaseUrl(isSandbox);

    if (!apiKey) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Paddle API Key is required.",
        capabilities: this.capabilities,
      };
    }

    const headers = this.getHeaders(apiKey);

    try {
      // 1. Probe /products endpoint to verify key permissions
      const res = await fetch(`${baseUrl}/products?per_page=1`, { headers });

      if (res.ok) {
        return {
          isValid: true,
          accountId: credentials.accountId || `paddle_${isSandbox ? "sandbox" : "live"}_${Date.now()}`,
          accountName: credentials.accountName || `Paddle ${isSandbox ? "Sandbox" : "Merchant"} Account`,
          capabilities: this.capabilities,
        };
      }

      // 2. Fallback probe /transactions
      const txRes = await fetch(`${baseUrl}/transactions?per_page=1`, { headers });
      if (txRes.ok) {
        return {
          isValid: true,
          accountId: credentials.accountId || `paddle_${Date.now()}`,
          accountName: credentials.accountName || "Paddle Account",
          capabilities: this.capabilities,
        };
      }

      const errData = await res.json().catch(() => ({}));
      const errorDetail = errData.error?.detail || errData.error?.message || "Paddle rejected this API Key. Check API permissions and environment (Live vs Sandbox).";

      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: errorDetail,
        capabilities: this.capabilities,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: err instanceof Error ? err.message : "Network error contacting Paddle API.",
        capabilities: this.capabilities,
      };
    }
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim() || credentials.token?.trim();
    if (!apiKey) throw new Error("Missing Paddle API Key.");

    const isSandbox = Boolean(credentials.isSandbox);
    const baseUrl = this.getBaseUrl(isSandbox);
    const headers = this.getHeaders(apiKey);

    // Parallel fetch of Products, Transactions, Subscriptions, and Customers
    const [productsRes, txRes, subsRes, custRes] = await Promise.all([
      fetch(`${baseUrl}/products?per_page=100&include=prices`, { headers }).catch(() => null),
      fetch(`${baseUrl}/transactions?per_page=100&order_by=created_at[DESC]`, { headers }).catch(() => null),
      fetch(`${baseUrl}/subscriptions?per_page=100`, { headers }).catch(() => null),
      fetch(`${baseUrl}/customers?per_page=100`, { headers }).catch(() => null),
    ]);

    const rawProducts = productsRes && productsRes.ok ? extractPaddleList(await productsRes.json()) : [];
    const products: RawProviderProduct[] = rawProducts.map((p: any) => {
      const isArchived = p.status === "archived";
      const imageUrl = p.image_url || undefined;
      const mediaList = imageUrl ? [imageUrl] : [];

      return {
        providerId: "paddle" as const,
        externalProductId: String(p.id),
        name: p.name || "Paddle Product",
        description: p.description || undefined,
        category: p.type === "standard" ? "Software Product" : "SaaS",
        imageUrl,
        medias: mediaList,
        isArchived,
        createdAt: p.created_at || new Date().toISOString(),
      };
    });

    const rawTx = txRes && txRes.ok ? extractPaddleList(await txRes.json()) : [];
    const transactions: RawProviderTransaction[] = rawTx.map((t: any) => {
      const totals = t.details?.totals || {};
      const amountCents = totals.total ? parseInt(totals.total, 10) : 0;
      const taxCents = totals.tax ? parseInt(totals.tax, 10) : 0;
      const feeCents = totals.fee ? parseInt(totals.fee, 10) : 0;
      const netCents = amountCents - taxCents - feeCents;

      const firstItem = t.items?.[0] || {};
      const prodId = firstItem.price?.product_id ? String(firstItem.price.product_id) : "paddle_general";
      const prodName = firstItem.price?.description || `Paddle Order ${t.id}`;

      const statusMap: Record<string, "succeeded" | "refunded" | "failed"> = {
        completed: "succeeded",
        billed: "succeeded",
        past_due: "failed",
        canceled: "failed",
        draft: "failed",
      };

      const isRefunded = Boolean(t.details?.adjusted_totals?.total && parseInt(t.details.adjusted_totals.total, 10) < 0);
      const status = isRefunded ? "refunded" : (statusMap[t.status] || "succeeded");

      const country = t.customer?.locale?.slice(-2)?.toUpperCase() || t.address?.country_code?.toUpperCase() || "US";

      return {
        providerId: "paddle" as const,
        externalTransactionId: String(t.id),
        externalProductId: prodId,
        productName: prodName,
        externalCustomerId: t.customer_id ? String(t.customer_id) : undefined,
        customerEmail: t.customer?.email || undefined,
        customerName: t.customer?.name || undefined,
        amount: amountCents / 100,
        amountCents,
        feeCents: taxCents + feeCents,
        netCents,
        currency: (t.currency_code || "USD").toUpperCase(),
        status,
        country: country.slice(0, 2),
        occurredAt: t.created_at || new Date().toISOString(),
        timestamp: t.created_at || new Date().toISOString(),
      };
    });

    const rawSubs = subsRes && subsRes.ok ? extractPaddleList(await subsRes.json()) : [];
    const subscriptions: RawProviderSubscription[] = rawSubs.map((s: any) => {
      const items = s.items || [];
      const firstItem = items[0] || {};
      const priceTotals = firstItem.recurring_proration?.totals || firstItem.price?.unit_price || {};
      const amountCents = priceTotals.total ? parseInt(priceTotals.total, 10) : parseInt(priceTotals.amount || "0", 10);

      const intervalType = s.billing_cycle?.interval || "month";
      const interval: "month" | "year" = intervalType === "year" ? "year" : "month";
      const mrrCents = interval === "year" ? Math.round(amountCents / 12) : amountCents;

      return {
        providerId: "paddle" as const,
        externalSubscriptionId: String(s.id),
        externalProductId: firstItem.price?.product_id ? String(firstItem.price.product_id) : "paddle_sub",
        externalCustomerId: s.customer_id ? String(s.customer_id) : undefined,
        customerEmail: s.customer?.email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: (s.currency_code || "USD").toUpperCase(),
        status: s.status === "active" || s.status === "trialing" ? ("active" as const) : ("canceled" as const),
        interval,
        startedAt: s.started_at || s.created_at || new Date().toISOString(),
        currentPeriodEnd: s.next_billed_at || s.current_billing_period?.ends_at,
      };
    });

    const rawCusts = custRes && custRes.ok ? extractPaddleList(await custRes.json()) : [];
    const customers: RawProviderCustomer[] = rawCusts.map((cu: any) => ({
      id: String(cu.id),
      providerId: "paddle" as const,
      externalCustomerId: String(cu.id),
      email: cu.email || undefined,
      name: cu.name || undefined,
      country: cu.locale ? cu.locale.slice(-2).toUpperCase() : "US",
      totalSpend: 0,
      currency: "USD",
      createdAt: cu.created_at || new Date().toISOString(),
    }));

    return { products, transactions, subscriptions, customers };
  }
}
