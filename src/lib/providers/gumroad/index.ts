/**
 * Gumroad Provider Adapter
 * 
 * Interacts directly with Gumroad REST API v2 (https://api.gumroad.com/v2)
 * Ingests digital products, cover artwork, memberships, sales orders,
 * platform fees, buyer localization, and recurring subscription MRR.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

const GUMROAD_API_BASE = "https://api.gumroad.com/v2";

function extractGumroadList(data: any, key: string): any[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data[key])) return data[key];
  if (Array.isArray(data.products)) return data.products;
  if (Array.isArray(data.sales)) return data.sales;
  if (Array.isArray(data.subscribers)) return data.subscribers;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.data)) return data.data;
  return [];
}

function resolveGumroadMedia(p: any): string[] {
  if (!p) return [];
  const list: string[] = [];

  const addUrl = (u: any) => {
    if (typeof u === "string" && u.trim().startsWith("http")) {
      const clean = u.trim();
      if (!list.includes(clean)) list.push(clean);
    } else if (u && typeof u === "object") {
      const cand = u.url || u.original_url || u.preview_url || u.thumbnail_url || u.src;
      if (typeof cand === "string" && cand.trim().startsWith("http")) {
        const clean = cand.trim();
        if (!list.includes(clean)) list.push(clean);
      }
    }
  };

  // Preview & Cover Images
  addUrl(p.preview_url);
  addUrl(p.thumbnail_url);
  addUrl(p.cover_url);
  addUrl(p.image_url);

  if (Array.isArray(p.covers)) {
    p.covers.forEach((c: any) => addUrl(c));
  }
  if (Array.isArray(p.images)) {
    p.images.forEach((img: any) => addUrl(img));
  }
  if (Array.isArray(p.files)) {
    p.files.forEach((f: any) => addUrl(f));
  }

  return list;
}

export class GumroadAdapter implements PaymentProviderAdapter {
  readonly id = "gumroad" as const;
  readonly name = "Gumroad";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getAuthHeaders(token: string): Record<string, string> {
    const cleanToken = token.trim();
    return {
      Authorization: `Bearer ${cleanToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };
  }

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const token = credentials.apiKey?.trim() || credentials.accessToken?.trim() || credentials.token?.trim();

    if (!token) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Gumroad Access Token is required.",
        capabilities: this.capabilities,
      };
    }

    try {
      const headers = this.getAuthHeaders(token);
      const cleanToken = encodeURIComponent(token.trim());

      // 1. Probe /v2/user
      const userRes = await fetch(`${GUMROAD_API_BASE}/user?access_token=${cleanToken}`, { headers }).catch(() => null);

      if (userRes && userRes.ok) {
        const userData = await userRes.json().catch(() => ({}));
        const user = userData.user || {};
        const accountId = user.user_id ? String(user.user_id) : credentials.accountId || `gumroad_${Date.now()}`;
        const accountName = user.name || user.display_name || (user.email ? `Gumroad (${user.email})` : "Gumroad Creator Store");

        return {
          isValid: true,
          accountId,
          accountName,
          capabilities: this.capabilities,
        };
      }

      // 2. Fallback probe: /v2/products
      const prodRes = await fetch(`${GUMROAD_API_BASE}/products?access_token=${cleanToken}`, { headers }).catch(() => null);
      if (prodRes && prodRes.ok) {
        return {
          isValid: true,
          accountId: credentials.accountId || `gumroad_${Date.now()}`,
          accountName: credentials.accountName || "Gumroad Store",
          capabilities: this.capabilities,
        };
      }

      const errData = userRes ? await userRes.json().catch(() => ({})) : {};
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: errData.message || "Gumroad rejected this Access Token. Verify permissions and try again.",
        capabilities: this.capabilities,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: err instanceof Error ? err.message : "Network error contacting Gumroad API.",
        capabilities: this.capabilities,
      };
    }
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const token = credentials.apiKey?.trim() || credentials.accessToken?.trim() || credentials.token?.trim();
    if (!token) throw new Error("Missing Gumroad Access Token.");

    const headers = this.getAuthHeaders(token);
    const cleanToken = encodeURIComponent(token.trim());

    // Parallel fetch: Products, Sales, Subscribers
    const [productsRes, salesRes, subsRes] = await Promise.all([
      fetch(`${GUMROAD_API_BASE}/products?access_token=${cleanToken}`, { headers }).catch(() => null),
      fetch(`${GUMROAD_API_BASE}/sales?access_token=${cleanToken}&page=1`, { headers }).catch(() => null),
      fetch(`${GUMROAD_API_BASE}/subscribers?access_token=${cleanToken}`, { headers }).catch(() => null),
    ]);

    // 1. Parse Products
    const rawProducts = productsRes && productsRes.ok ? extractGumroadList(await productsRes.json().catch(() => ({})), "products") : [];
    const products: RawProviderProduct[] = rawProducts.map((p: any) => {
      const pId = String(p.id || p.custom_permalink || `gum_prod_${Date.now()}`);
      const mediaList = resolveGumroadMedia(p);
      const isArchived = Boolean(p.deleted || p.archived);

      const priceCents = typeof p.price === "number" ? p.price : 0;
      const salesCount = typeof p.sales_count === "number" ? p.sales_count : 0;
      const salesUsdCents = typeof p.sales_usd_cents === "number" ? p.sales_usd_cents : salesCount * priceCents;

      return {
        providerId: "gumroad" as const,
        externalProductId: pId,
        name: p.name || "Gumroad Product",
        description: p.description || undefined,
        category: p.is_tiered_membership ? "Subscription Membership" : "Digital Product",
        imageUrl: mediaList.length > 0 ? mediaList[0] : undefined,
        medias: mediaList,
        amount: priceCents / 100,
        totalRevenue: salesUsdCents / 100,
        salesCount,
        isArchived,
        createdAt: p.created_at || new Date().toISOString(),
      };
    });

    // 2. Parse Sales / Transactions
    const rawSales = salesRes && salesRes.ok ? extractGumroadList(await salesRes.json().catch(() => ({})), "sales") : [];
    const transactions: RawProviderTransaction[] = rawSales.map((s: any) => {
      const amountCents = typeof s.price === "number" ? s.price : 0;
      const feeCents = typeof s.gumroad_fee === "number" ? s.gumroad_fee : 0;
      const netCents = Math.max(0, amountCents - feeCents);

      const isRefunded = Boolean(s.refunded || s.partially_refunded || s.chargedback);
      const country = String(s.country_iso2 || s.country || "US").toUpperCase().slice(0, 2);

      const occurDate = s.created_at || s.timestamp || new Date().toISOString();

      return {
        providerId: "gumroad" as const,
        externalTransactionId: String(s.id || s.order_number || `gum_tx_${Date.now()}`),
        externalProductId: String(s.product_id || s.permalink || "gumroad_general"),
        productName: s.product_name || "Gumroad Sale",
        externalCustomerId: s.purchase_email || s.email ? String(s.purchase_email || s.email) : undefined,
        customerEmail: s.purchase_email || s.email || undefined,
        customerName: s.buyer_name || s.name || undefined,
        amount: amountCents / 100,
        amountCents,
        feeCents,
        netCents,
        currency: String(s.currency || "USD").toUpperCase(),
        status: isRefunded ? ("refunded" as const) : ("succeeded" as const),
        country,
        occurredAt: occurDate,
        timestamp: occurDate,
      };
    });

    // 3. Parse Subscriptions & MRR
    const rawSubs = subsRes && subsRes.ok ? extractGumroadList(await subsRes.json().catch(() => ({})), "subscribers") : [];
    const subscriptions: RawProviderSubscription[] = rawSubs.map((sub: any) => {
      const p = products.find((pr) => pr.externalProductId === String(sub.product_id));
      const amountCents = p && p.amount ? Math.round(p.amount * 100) : 1000;
      const recurrence = String(sub.recurrence || "monthly").toLowerCase();
      const interval: "month" | "year" = recurrence.includes("year") ? "year" : "month";
      const mrrCents = interval === "year" ? Math.round(amountCents / 12) : amountCents;

      const isActive = sub.status === "alive" || sub.status === "active" || (!sub.cancelled_at && !sub.ended_at);

      return {
        providerId: "gumroad" as const,
        externalSubscriptionId: String(sub.id || `gum_sub_${Date.now()}`),
        externalProductId: String(sub.product_id || "gumroad_sub"),
        customerEmail: sub.user_email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: "USD",
        status: isActive ? ("active" as const) : ("canceled" as const),
        interval,
        startedAt: sub.created_at || new Date().toISOString(),
        currentPeriodEnd: sub.ended_at || undefined,
      };
    });

    // 4. Derive Customers
    const customerMap = new Map<string, RawProviderCustomer>();
    transactions.forEach((tx) => {
      if (tx.customerEmail) {
        const key = tx.customerEmail.toLowerCase();
        const existing = customerMap.get(key);
        const spend = tx.status === "succeeded" && typeof tx.amount === "number" ? tx.amount : 0;
        const occurDate = tx.occurredAt || new Date().toISOString();

        if (!existing) {
          customerMap.set(key, {
            id: `gum_cust_${key}`,
            providerId: "gumroad" as const,
            externalCustomerId: key,
            email: tx.customerEmail,
            name: tx.customerName,
            country: tx.country,
            totalSpend: spend,
            currency: tx.currency,
            createdAt: occurDate,
          });
        } else {
          existing.totalSpend = (existing.totalSpend || 0) + spend;
        }
      }
    });

    const customers = Array.from(customerMap.values());

    return { products, transactions, subscriptions, customers };
  }
}
