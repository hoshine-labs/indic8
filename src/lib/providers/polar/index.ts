/**
 * Polar.sh Provider Adapter
 * 
 * Interacts directly with Polar.sh REST API v1 (api.polar.sh/v1 and sandbox-api.polar.sh/v1)
 * Performs real live scope probing against all Polar endpoints.
 * Robustly parses final paid order amounts after discounts, customer profiles, and billing countries.
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import { ProviderCapabilities } from "@/lib/domain/types";

const POLAR_PROD_BASE = "https://api.polar.sh/v1";
const POLAR_SANDBOX_BASE = "https://sandbox-api.polar.sh/v1";

export class PolarAdapter implements PaymentProviderAdapter {
  readonly id = "polar" as const;
  readonly name = "Polar.sh";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: false,
    supportsCustomers: true,
    supportsCountries: true,
  };

  private getBaseUrl(credentials: Record<string, string>): string {
    if (credentials.environment === "sandbox" || credentials.isSandbox === "true" || credentials.apiKey?.includes("sandbox")) {
      return POLAR_SANDBOX_BASE;
    }
    return POLAR_PROD_BASE;
  }

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const token = credentials.apiKey?.trim() || credentials.token?.trim();

    if (!token) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Polar.sh Access Token is required.",
        capabilities: this.capabilities,
      };
    }

    const baseUrlsToTry = [this.getBaseUrl(credentials)];
    if (baseUrlsToTry[0] === POLAR_PROD_BASE) {
      baseUrlsToTry.push(POLAR_SANDBOX_BASE);
    } else {
      baseUrlsToTry.push(POLAR_PROD_BASE);
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };

    let activeBaseUrl = "";
    let accountId = "";
    let accountName = "";
    let isTokenAuthentic = false;
    let authErrorMessage = "";

    // Step 1: Discover active environment & base token validity
    for (const baseUrl of baseUrlsToTry) {
      try {
        const [orgRes, prodRes, orderRes] = await Promise.all([
          fetch(`${baseUrl}/organizations?limit=1`, { headers }),
          fetch(`${baseUrl}/products?limit=1`, { headers }),
          fetch(`${baseUrl}/orders?limit=1`, { headers }),
        ]);

        if (orgRes.ok || prodRes.ok || orderRes.ok) {
          activeBaseUrl = baseUrl;
          isTokenAuthentic = true;

          if (orgRes.ok) {
            const orgData = await orgRes.json().catch(() => ({}));
            const org = orgData.items?.[0] || orgData.data?.[0] || orgData[0];
            accountId = org?.id || `polar_${Date.now()}`;
            accountName = org?.name || org?.slug || credentials.accountName || "Polar Workspace";
          } else if (prodRes.ok) {
            const prodData = await prodRes.json().catch(() => ({}));
            const firstProd = prodData.items?.[0] || prodData.data?.[0];
            accountId = firstProd?.organization_id || `polar_${Date.now()}`;
            accountName = credentials.accountName || "Polar Workspace";
          } else {
            accountId = `polar_${Date.now()}`;
            accountName = credentials.accountName || "Polar Workspace";
          }
          break;
        } else {
          const err = await orgRes.json().catch(() => ({}));
          authErrorMessage = err.detail || err.message || `Polar returned status ${orgRes.status}`;
        }
      } catch (err) {
        authErrorMessage = err instanceof Error ? err.message : "Network error contacting Polar API";
      }
    }

    if (!isTokenAuthentic) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage:
          authErrorMessage ||
          "Polar rejected this token. Please ensure your token starts with 'polar_oat_' or 'polar_pat_' and has read scopes.",
        capabilities: this.capabilities,
      };
    }

    // Step 2: Live scope probing for real capability resolution
    const [ordersProbe, subsProbe, custProbe] = await Promise.all([
      fetch(`${activeBaseUrl}/orders?limit=1`, { headers }),
      fetch(`${activeBaseUrl}/subscriptions?limit=1`, { headers }),
      fetch(`${activeBaseUrl}/customers?limit=1`, { headers }),
    ]);

    const realCapabilities: ProviderCapabilities = {
      supportsRevenue: ordersProbe.ok,
      supportsSubscriptions: subsProbe.ok,
      supportsMRR: subsProbe.ok,
      supportsCustomers: custProbe.ok,
      supportsRefunds: false, // Polar v1 settles disputes/refunds via merchant payout batches
      supportsCountries: ordersProbe.ok,
    };

    return {
      isValid: true,
      accountId: accountId || `polar_${Date.now()}`,
      accountName: accountName || credentials.accountName || "Polar.sh Organization",
      capabilities: realCapabilities,
    };
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const token = credentials.apiKey?.trim() || credentials.token?.trim();
    if (!token) throw new Error("Missing Polar.sh token.");

    const baseUrl = this.getBaseUrl(credentials);
    const headers = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "User-Agent": "indic8-revenue-intelligence/1.0",
    };

    const [productsRes, ordersRes, subsRes] = await Promise.all([
      fetch(`${baseUrl}/products?limit=100`, { headers }).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] })),
      fetch(`${baseUrl}/orders?limit=100`, { headers }).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] })),
      fetch(`${baseUrl}/subscriptions?limit=100`, { headers }).then((r) => (r.ok ? r.json() : { items: [] })).catch(() => ({ items: [] })),
    ]);

    const rawProducts = productsRes.items || productsRes.data || (Array.isArray(productsRes) ? productsRes : []);

    // Fetch full product details in parallel to ensure 100% complete media arrays
    const detailedProducts = await Promise.all(
      rawProducts.map(async (p: any) => {
        if (!p.id) return p;
        try {
          const detailRes = await fetch(`${baseUrl}/products/${p.id}`, { headers });
          if (detailRes.ok) {
            const detailJson = await detailRes.json();
            return { ...p, ...detailJson };
          }
        } catch {
          // fallback to list item
        }
        return p;
      })
    );

    const products = detailedProducts.map((p: any) => {
      const mediaUrls: string[] = [];
      if (Array.isArray(p.medias)) {
        p.medias.forEach((m: any) => {
          const u = m.public_url || (m.path ? `https://polar-public-files.s3.amazonaws.com/${m.path}` : null);
          if (u && !mediaUrls.includes(u)) mediaUrls.push(u);
        });
      }
      if (Array.isArray(p.media)) {
        p.media.forEach((m: any) => {
          const u = m.public_url || (m.path ? `https://polar-public-files.s3.amazonaws.com/${m.path}` : null);
          if (u && !mediaUrls.includes(u)) mediaUrls.push(u);
        });
      }
      if (Array.isArray(p.images)) {
        p.images.forEach((img: any) => {
          if (typeof img === "string" && !mediaUrls.includes(img)) mediaUrls.push(img);
        });
      }
      if (p.thumbnail_url && !mediaUrls.includes(p.thumbnail_url)) {
        mediaUrls.unshift(p.thumbnail_url);
      }
      if (p.banner_url && !mediaUrls.includes(p.banner_url)) {
        mediaUrls.push(p.banner_url);
      }

      const productMediaUrl = mediaUrls[0] || undefined;

      return {
        providerId: "polar" as const,
        externalProductId: p.id,
        name: p.name,
        description: p.description || undefined,
        category: "Software Product",
        imageUrl: productMediaUrl,
        medias: mediaUrls,
        isArchived: Boolean(p.is_archived),
        createdAt: p.created_at || new Date().toISOString(),
      };
    });

    const rawOrders = ordersRes.items || ordersRes.data || (Array.isArray(ordersRes) ? ordersRes : []);
    const transactions = rawOrders.map((o: any) => {
      // Calculate final paid order amount after discount
      const finalPaidCents =
        typeof o.amount === "number"
          ? o.amount
          : typeof o.total_amount === "number"
          ? o.total_amount
          : typeof o.subtotal_amount === "number"
          ? o.subtotal_amount - (o.discount_amount || 0)
          : 0;

      const country = (
        o.billing_address?.country ||
        o.customer?.billing_address?.country ||
        o.customer?.country ||
        "US"
      ).toUpperCase();

      return {
        providerId: "polar" as const,
        externalTransactionId: o.id,
        externalProductId: o.product_id || o.product?.id || "prod_polar_general",
        externalCustomerId: o.user_id || o.customer_id || o.customer?.id,
        productName: o.product?.name || (o.product_id ? `Product ${o.product_id.substring(0, 8)}` : "Polar Product"),
        customerEmail: o.customer?.email || o.user?.email || "buyer@polar.sh",
        customerName: o.customer?.name || o.customer?.public_name || o.user?.name,
        amountCents: finalPaidCents,
        currency: (o.currency || "USD").toUpperCase(),
        feeCents: o.fee_amount || 0,
        netCents: o.net_amount || finalPaidCents,
        country: country.slice(0, 2),
        status: "succeeded" as const,
        occurredAt: o.created_at || new Date().toISOString(),
      };
    });

    const rawSubs = subsRes.items || subsRes.data || (Array.isArray(subsRes) ? subsRes : []);
    const subscriptions = rawSubs.map((s: any) => ({
      providerId: "polar" as const,
      externalSubscriptionId: s.id,
      externalProductId: s.product_id || (s.product?.id) || "prod_polar_sub",
      externalCustomerId: s.user_id || s.customer_id || (s.customer?.id),
      mrrCents: s.price?.price_amount || s.amount || 0,
      currency: (s.currency || "USD").toUpperCase(),
      status: s.status === "active" ? ("active" as const) : ("canceled" as const),
      interval: (s.recurring_interval || "month") as "month" | "year",
      startedAt: s.started_at || s.created_at || new Date().toISOString(),
      currentPeriodEnd: s.current_period_end,
    }));

    const customers = rawOrders
      .filter((o: any) => o.customer || o.user)
      .map((o: any) => {
        const c = o.customer || o.user;
        return {
          providerId: "polar" as const,
          externalCustomerId: c.id || o.customer_id,
          email: c.email || undefined,
          name: c.public_name || c.name || undefined,
          country: (o.billing_address?.country || c.billing_address?.country || c.country || "US").toUpperCase().slice(0, 2),
          createdAt: c.created_at || new Date().toISOString(),
        };
      });

    return { products, transactions, subscriptions, customers };
  }
}
