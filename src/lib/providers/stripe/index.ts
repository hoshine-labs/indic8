/**
 * Stripe Payment Provider Adapter
 * 
 * Interacts directly with Stripe REST API (api.stripe.com/v1)
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import { ProviderCapabilities } from "@/lib/domain/types";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export class StripeAdapter implements PaymentProviderAdapter {
  readonly id = "stripe" as const;
  readonly name = "Stripe";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const apiKey = credentials.apiKey?.trim();

    if (!apiKey) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Stripe API key is required.",
        capabilities: this.capabilities,
      };
    }

    try {
      // 1. Validate key against Stripe Account endpoint
      const res = await fetch(`${STRIPE_API_BASE}/account`, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      });

      if (!res.ok) {
        // Restricted keys might not have /v1/account read access, test /v1/balance as fallback
        const balanceRes = await fetch(`${STRIPE_API_BASE}/balance`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        });

        if (!balanceRes.ok) {
          const errData = await balanceRes.json().catch(() => ({}));
          return {
            isValid: false,
            accountId: "",
            accountName: "",
            errorMessage:
              errData?.error?.message ||
              "Stripe rejected this credential. Please verify your Restricted API key permissions.",
            capabilities: this.capabilities,
          };
        }

        return {
          isValid: true,
          accountId: credentials.accountId || `acct_stripe_live`,
          accountName: credentials.accountName || "Stripe Primary",
          capabilities: this.capabilities,
        };
      }

      const accountData = await res.json();
      return {
        isValid: true,
        accountId: accountData.id || `acct_stripe_${Date.now()}`,
        accountName: accountData.business_profile?.name || accountData.settings?.dashboard?.display_name || "Stripe Primary",
        capabilities: this.capabilities,
      };
    } catch (err: unknown) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: err instanceof Error ? err.message : "Network error contacting Stripe API.",
        capabilities: this.capabilities,
      };
    }
  }

  async fetchSyncData(credentials: Record<string, string>): Promise<ProviderSyncPayload> {
    const apiKey = credentials.apiKey?.trim();
    if (!apiKey) {
      throw new Error("Missing Stripe API key.");
    }

    const headers = { Authorization: `Bearer ${apiKey}` };

    // Fetch Products, Charges, Subscriptions, Customers in parallel
    const [productsRes, chargesRes, subsRes, custRes] = await Promise.all([
      fetch(`${STRIPE_API_BASE}/products?limit=100`, { headers }).then((r) => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(`${STRIPE_API_BASE}/charges?limit=100`, { headers }).then((r) => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(`${STRIPE_API_BASE}/subscriptions?limit=100&status=all`, { headers }).then((r) => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(`${STRIPE_API_BASE}/customers?limit=100`, { headers }).then((r) => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]);

    const products = (productsRes.data || []).map((p: any) => ({
      providerId: "stripe" as const,
      externalProductId: p.id,
      name: p.name,
      description: p.description || undefined,
      category: p.metadata?.category || "Software Product",
      imageUrl: p.images?.[0] || undefined,
      createdAt: new Date(p.created * 1000).toISOString(),
    }));

    const transactions = (chargesRes.data || []).map((c: any) => {
      const amountCents = c.amount || 0;
      const feeCents = c.balance_transaction?.fee || Math.round(amountCents * 0.029 + 30);
      const netCents = amountCents - feeCents;
      const customerEmail = c.receipt_email || c.billing_details?.email || undefined;
      const customerName = c.billing_details?.name || undefined;
      const country = (c.billing_details?.address?.country || c.payment_method_details?.card?.country || "US").toUpperCase().slice(0, 2);

      return {
        providerId: "stripe" as const,
        externalTransactionId: c.id,
        externalProductId: c.metadata?.product_id || (c.lines?.data?.[0]?.price?.product) || "prod_stripe_general",
        productName: c.description || c.metadata?.product_name || undefined,
        externalCustomerId: typeof c.customer === "string" ? c.customer : c.customer?.id,
        customerEmail,
        customerName,
        amount: amountCents / 100,
        amountCents,
        feeCents,
        netCents,
        currency: (c.currency || "usd").toUpperCase(),
        status: c.refunded ? ("refunded" as const) : c.status === "succeeded" ? ("succeeded" as const) : ("failed" as const),
        country,
        occurredAt: new Date(c.created * 1000).toISOString(),
        timestamp: new Date(c.created * 1000).toISOString(),
      };
    });

    const subscriptions = (subsRes.data || []).map((s: any) => {
      const planAmount = s.items?.data?.[0]?.price?.unit_amount || 0;
      const interval = s.items?.data?.[0]?.price?.recurring?.interval || "month";
      const mrrCents = interval === "year" ? Math.round(planAmount / 12) : planAmount;

      return {
        providerId: "stripe" as const,
        externalSubscriptionId: s.id,
        externalProductId: s.items?.data?.[0]?.price?.product || "prod_stripe_subscription",
        externalCustomerId: typeof s.customer === "string" ? s.customer : s.customer?.id,
        customerEmail: s.customer?.email || undefined,
        mrrCents,
        mrrContribution: mrrCents / 100,
        currency: (s.currency || "usd").toUpperCase(),
        status: s.status === "active" || s.status === "trialing" ? ("active" as const) : ("canceled" as const),
        interval: interval as "month" | "year",
        startedAt: new Date(s.start_date * 1000).toISOString(),
        currentPeriodEnd: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : undefined,
      };
    });

    const customers = (custRes.data || []).map((cu: any) => ({
      id: cu.id,
      providerId: "stripe" as const,
      externalCustomerId: cu.id,
      email: cu.email || undefined,
      name: cu.name || undefined,
      country: (cu.address?.country || cu.shipping?.address?.country || "US").toUpperCase().slice(0, 2),
      totalSpend: (cu.balance || 0) / 100,
      currency: (cu.currency || "usd").toUpperCase(),
      createdAt: new Date(cu.created * 1000).toISOString(),
    }));

    return { products, transactions, subscriptions, customers };

    return { products, transactions, subscriptions, customers };
  }
}
