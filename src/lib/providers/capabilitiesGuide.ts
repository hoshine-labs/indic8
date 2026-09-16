/**
 * Provider Capabilities & Scope Resolution Engine
 * 
 * Provides real capability matrix and exact dashboard steps to grant access
 * for Stripe, Polar, RevenueCat, Lemon Squeezy, Apple App Store, and Google Play.
 */

import { ProviderId, ProviderCapabilities } from "@/lib/domain/types";

export interface CapabilityDetail {
  key: keyof ProviderCapabilities;
  label: string;
  isGranted: boolean;
  status: "granted" | "missing_permission" | "unsupported_by_platform";
  statusText: string;
  howToGrant: {
    title: string;
    steps: string[];
    scopeName?: string;
  };
}

export const PROVIDER_CAPABILITY_MATRIX: Record<
  ProviderId,
  (activeCaps?: Partial<ProviderCapabilities>) => CapabilityDetail[]
> = {
  stripe: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Charges",
      isGranted: caps?.supportsRevenue ?? true,
      status: (caps?.supportsRevenue ?? true) ? "granted" : "missing_permission",
      statusText: "Live Charges & Balances",
      howToGrant: {
        title: "Grant Stripe Charges Access",
        steps: [
          "Open Stripe Dashboard > Developers > API keys.",
          "Under Restricted keys, click 'Edit' on your indic8 key.",
          "Set 'Charges' and 'Balance' permissions to 'Read'.",
          "Save changes and click 'Sync Now' in indic8.",
        ],
        scopeName: "rak_charges_read",
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: (caps?.supportsSubscriptions ?? true) ? "granted" : "missing_permission",
      statusText: "Recurring Invoices & Plans",
      howToGrant: {
        title: "Grant Stripe Subscriptions Access",
        steps: [
          "Open Stripe Dashboard > Developers > API keys.",
          "Edit your Restricted key.",
          "Set 'Subscriptions' to 'Read'.",
          "Set 'Invoices' to 'Read'.",
          "Save changes in Stripe.",
        ],
        scopeName: "rak_subscriptions_read",
      },
    },
    {
      key: "supportsMRR",
      label: "MRR & Churn",
      isGranted: caps?.supportsMRR ?? true,
      status: (caps?.supportsMRR ?? true) ? "granted" : "missing_permission",
      statusText: "Normalized MRR & Cohorts",
      howToGrant: {
        title: "Grant MRR Telemetry Access",
        steps: [
          "MRR is computed from Subscriptions and Plans data.",
          "Ensure both 'Subscriptions' and 'Products' have 'Read' access in Stripe API keys.",
        ],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Records",
      isGranted: caps?.supportsCustomers ?? true,
      status: (caps?.supportsCustomers ?? true) ? "granted" : "missing_permission",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Grant Stripe Customers Access",
        steps: [
          "Open Stripe Dashboard > Developers > API keys.",
          "Edit your Restricted key.",
          "Set 'Customers' permission to 'Read'.",
          "Save key and click 'Sync Now'.",
        ],
        scopeName: "rak_customers_read",
      },
    },
    {
      key: "supportsRefunds",
      label: "Disputes & Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: (caps?.supportsRefunds ?? true) ? "granted" : "missing_permission",
      statusText: "Refund Tracking & Volume",
      howToGrant: {
        title: "Grant Stripe Refunds Access",
        steps: [
          "Open Stripe Dashboard > Developers > API keys.",
          "Edit your Restricted key.",
          "Set 'Refunds' and 'Disputes' permissions to 'Read'.",
          "Save changes in Stripe.",
        ],
        scopeName: "rak_refunds_read",
      },
    },
    {
      key: "supportsCountries",
      label: "Country Breakdown",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Billing & Card Geographies",
      howToGrant: {
        title: "Country Breakdown",
        steps: [
          "Automatically ingested from Stripe charge billing addresses and payment methods.",
        ],
      },
    },
  ],

  polar: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Orders",
      isGranted: caps?.supportsRevenue ?? true,
      status: (caps?.supportsRevenue ?? true) ? "granted" : "missing_permission",
      statusText: "Product Sales & Checkouts",
      howToGrant: {
        title: "Grant Polar Orders Access",
        steps: [
          "Go to Polar.sh > Organization Settings > Developers > Access Tokens.",
          "Create or edit your Organization Access Token.",
          "Ensure 'orders:read' and 'products:read' scopes are checked.",
          "Paste new token in indic8.",
        ],
        scopeName: "orders:read, products:read",
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: (caps?.supportsSubscriptions ?? true) ? "granted" : "missing_permission",
      statusText: "Developer Tiers & Memberships",
      howToGrant: {
        title: "Grant Polar Subscriptions Access",
        steps: [
          "Go to Polar.sh > Settings > Developers > Access Tokens.",
          "Ensure 'subscriptions:read' scope is enabled on your token.",
        ],
        scopeName: "subscriptions:read",
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Aggregated Recurring MRR",
      howToGrant: {
        title: "Polar MRR Normalization",
        steps: ["Computed continuously from active recurring subscription intervals."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Profiles",
      isGranted: caps?.supportsCustomers ?? true,
      status: (caps?.supportsCustomers ?? true) ? "granted" : "missing_permission",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Grant Polar Customer Access",
        steps: [
          "In Polar.sh Access Tokens, check 'customers:read' or 'users:read'.",
          "Re-save and synchronize.",
        ],
        scopeName: "customers:read",
      },
    },
    {
      key: "supportsRefunds",
      label: "Disputes & Refunds",
      isGranted: false,
      status: "unsupported_by_platform",
      statusText: "Managed in Merchant Batches",
      howToGrant: {
        title: "Polar Refund Architecture",
        steps: [
          "Polar Merchant of Record manages buyer chargebacks and refunds directly at the payout level.",
          "Dispute deductions are accounted for automatically in your net payout reports.",
        ],
      },
    },
    {
      key: "supportsCountries",
      label: "Country Breakdown",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Buyer Tax Geographies",
      howToGrant: {
        title: "Geographic Ingestion",
        steps: ["Parsed automatically from Polar checkout tax location records."],
      },
    },
  ],

  revenuecat: (caps) => [
    {
      key: "supportsRevenue",
      label: "Mobile & Web Revenue",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "App Store, Google Play & Stripe Sales",
      howToGrant: {
        title: "Grant RevenueCat REST API v1 Access",
        steps: [
          "Open RevenueCat Dashboard > Project Settings > API Keys.",
          "Copy your v1 Secret API Key.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "In-App Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Cross-Platform Entitlements",
      howToGrant: {
        title: "In-App Subscriptions",
        steps: ["Synced directly from RevenueCat customer subscriber records."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Normalization",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Live Cross-Platform MRR",
      howToGrant: {
        title: "MRR Calculations",
        steps: ["Calculated from monthly and annual active entitlement pricing."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer PII / Emails",
      isGranted: false,
      status: "unsupported_by_platform",
      statusText: "Anonymous App User IDs",
      howToGrant: {
        title: "Enrich Customer Identifiers",
        steps: [
          "RevenueCat uses anonymous App User IDs (e.g. $RCAnonymousID) by default.",
          "To attach real emails: Call Purchases.logIn(userEmail) in your iOS/Android mobile SDK.",
        ],
      },
    },
    {
      key: "supportsRefunds",
      label: "Revocations & Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Store Refund Event Telemetry",
      howToGrant: {
        title: "Store Refund Telemetry",
        steps: ["Imported from Apple / Google Play revocation webhooks in RevenueCat."],
      },
    },
    {
      key: "supportsCountries",
      label: "Storefront Countries",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "App Store Territory Codes",
      howToGrant: {
        title: "Storefront Geographies",
        steps: ["Extracted from transaction country storefront headers."],
      },
    },
  ],

  lemonsqueezy: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Orders",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "Merchant of Record Sales",
      howToGrant: {
        title: "Grant Lemon Squeezy API Access",
        steps: [
          "Sign in to Lemon Squeezy > Settings > API.",
          "Generate a new API key with full store permissions.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Recurring Billing Plans",
      howToGrant: {
        title: "Subscriptions Ingestion",
        steps: ["Synced via Lemon Squeezy Subscriptions REST API."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Recurring Revenue Cohorts",
      howToGrant: {
        title: "MRR Calculations",
        steps: ["Computed continuously from active recurring subscriptions."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Records",
      isGranted: caps?.supportsCustomers ?? true,
      status: "granted",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Customer Records",
        steps: ["Imported from Lemon Squeezy Customers endpoint."],
      },
    },
    {
      key: "supportsRefunds",
      label: "Refund Tracking",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Disputes & Partial Refunds",
      howToGrant: {
        title: "Refunds",
        steps: ["Queried from Lemon Squeezy Orders / Refunds endpoints."],
      },
    },
    {
      key: "supportsCountries",
      label: "Country Breakdown",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Tax & Buyer Geographies",
      howToGrant: {
        title: "Geographies",
        steps: ["Derived from order billing country and EU VAT data."],
      },
    },
  ],

  app_store: (caps) => [
    {
      key: "supportsRevenue",
      label: "App Store Revenue",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "iOS & macOS Sales Reports",
      howToGrant: {
        title: "Grant App Store Connect API Access",
        steps: [
          "Go to App Store Connect > Users and Access > Integrations > App Store Connect API.",
          "Generate an API Key with 'Finance' or 'Sales and Reports' role.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Auto-Renewable Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "App Store Subscription Telemetry",
      howToGrant: {
        title: "Subscription Reports",
        steps: ["Ingested from App Store Connect Subscription Reports."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized iOS MRR",
      howToGrant: {
        title: "MRR Normalization",
        steps: ["Computed from active subscriber tiers."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Emails",
      isGranted: false,
      status: "unsupported_by_platform",
      statusText: "Restricted by Apple Privacy",
      howToGrant: {
        title: "Apple Privacy Policy Restriction",
        steps: [
          "Apple does not expose individual buyer emails or personal identifiers in App Store Connect financial reports.",
          "Revenue, units, renewals, and territory aggregates are fully synced.",
        ],
      },
    },
    {
      key: "supportsRefunds",
      label: "Refund Tracking",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Apple Customer Refunds",
      howToGrant: {
        title: "Apple Refunds",
        steps: ["Imported from Apple daily financial refund ledger."],
      },
    },
    {
      key: "supportsCountries",
      label: "Store Territories",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "175+ Apple Storefronts",
      howToGrant: {
        title: "Territories",
        steps: ["Mapped directly from Apple 3-letter territory codes (e.g. USA, GBR, JPN)."],
      },
    },
  ],

  google_play: (caps) => [
    {
      key: "supportsRevenue",
      label: "Google Play Revenue",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "Android In-App & App Purchases",
      howToGrant: {
        title: "Google Play Access",
        steps: [
          "Open Google Play Console > API access.",
          "Link Google Cloud Service Account with Finance role.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Google Play Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Google Subscriptions v2",
      howToGrant: {
        title: "Subscriptions Access",
        steps: ["Queried via Google Play Developer Subscriptions API v2."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized Android MRR",
      howToGrant: {
        title: "MRR Calculation",
        steps: ["Calculated from monthly and annual recurring subscription base."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Emails",
      isGranted: false,
      status: "unsupported_by_platform",
      statusText: "Restricted by Google Play",
      howToGrant: {
        title: "Google Play Privacy Policy",
        steps: [
          "Google Play Developer API masks buyer emails in compliance with Google Developer Distribution Agreement.",
          "Buyer country, order token, and financial figures are fully verified.",
        ],
      },
    },
    {
      key: "supportsRefunds",
      label: "Voided Purchases / Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Voided Purchases Ingestion",
      howToGrant: {
        title: "Voided Purchases",
        steps: ["Ingested from Google Play Voided Purchases API."],
      },
    },
    {
      key: "supportsCountries",
      label: "Buyer Countries",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Global Play Country Breakdown",
      howToGrant: {
        title: "Buyer Countries",
        steps: ["Parsed from Google Play Order billing territory data."],
      },
    },
  ],

  dodopayments: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Charges",
      isGranted: caps?.supportsRevenue ?? true,
      status: (caps?.supportsRevenue ?? true) ? "granted" : "missing_permission",
      statusText: "Dodo MOR Payments & Checkout",
      howToGrant: {
        title: "Grant Dodo Payments Access",
        steps: [
          "Open Dodo Payments Dashboard > Developer > API Keys.",
          "Create a Secret API Key with read permissions.",
          "Copy key starting with dodo_sk_.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: (caps?.supportsSubscriptions ?? true) ? "granted" : "missing_permission",
      statusText: "Recurring Billing Tiers",
      howToGrant: {
        title: "Grant Dodo Subscriptions Access",
        steps: [
          "Dodo Subscriptions are fetched via /v1/subscriptions REST endpoint.",
        ],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized Dodo MRR",
      howToGrant: {
        title: "MRR Normalization",
        steps: ["Computed continuously from active Dodo recurring subscription tiers."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Profiles",
      isGranted: caps?.supportsCustomers ?? true,
      status: (caps?.supportsCustomers ?? true) ? "granted" : "missing_permission",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Customer Profiles",
        steps: ["Synced directly from Dodo Payments customer records."],
      },
    },
    {
      key: "supportsRefunds",
      label: "Disputes & Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Disputes & Partial Refunds",
      howToGrant: {
        title: "Refunds",
        steps: ["Accounted for in Dodo Merchant of Record tax & refund ledgers."],
      },
    },
    {
      key: "supportsCountries",
      label: "Country Breakdown",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Buyer Tax Geographies",
      howToGrant: {
        title: "Geographic Ingestion",
        steps: ["Derived from Dodo checkout billing territory records."],
      },
    },
  ],

  paddle: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Orders",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "Paddle Billing & Checkouts",
      howToGrant: {
        title: "Grant Paddle API Access",
        steps: [
          "Open Paddle Dashboard > Developer Tools > Authentication.",
          "Generate an API Key with read permissions for products and transactions.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Paddle Billing Subscriptions",
      howToGrant: {
        title: "Paddle Subscriptions",
        steps: ["Synced via Paddle Billing Subscriptions API."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized Paddle MRR",
      howToGrant: {
        title: "MRR Calculations",
        steps: ["Calculated from monthly and annual active subscription cohorts."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Profiles",
      isGranted: caps?.supportsCustomers ?? true,
      status: "granted",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Customer Records",
        steps: ["Imported from Paddle Customers API."],
      },
    },
    {
      key: "supportsRefunds",
      label: "Adjustments & Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Adjustments & Credit Notes",
      howToGrant: {
        title: "Refunds",
        steps: ["Ingested from Paddle Adjustments / Transactions ledger."],
      },
    },
    {
      key: "supportsCountries",
      label: "Buyer Countries",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Global MoR Geographies",
      howToGrant: {
        title: "Geographies",
        steps: ["Derived from customer billing address and tax locale."],
      },
    },
  ],

  gumroad: (caps) => [
    {
      key: "supportsRevenue",
      label: "Sales & Net Revenue",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "Gumroad Creator Sales",
      howToGrant: {
        title: "Grant Gumroad API Access",
        steps: [
          "Go to Gumroad Dashboard > Settings > Advanced.",
          "Under Applications, create an Access Token with read permissions.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Memberships & Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Recurring Memberships",
      howToGrant: {
        title: "Gumroad Memberships",
        steps: ["Synced via Gumroad Subscribers API."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Normalization",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized Gumroad MRR",
      howToGrant: {
        title: "MRR Calculations",
        steps: ["Computed continuously from active monthly/annual recurring tiers."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Buyer & Customer Profiles",
      isGranted: caps?.supportsCustomers ?? true,
      status: "granted",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Customer Records",
        steps: ["Extracted from Gumroad sales orders and subscribers."],
      },
    },
    {
      key: "supportsRefunds",
      label: "Refunds & Chargebacks",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Disputes & Partial Refunds",
      howToGrant: {
        title: "Refunds",
        steps: ["Tracked via Gumroad sales ledger."],
      },
    },
    {
      key: "supportsCountries",
      label: "Buyer Countries",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Global Buyer Geographies",
      howToGrant: {
        title: "Geographies",
        steps: ["Derived from buyer billing localization data."],
      },
    },
  ],

  creem: (caps) => [
    {
      key: "supportsRevenue",
      label: "Revenue & Orders",
      isGranted: caps?.supportsRevenue ?? true,
      status: "granted",
      statusText: "Creem Merchant of Record Sales",
      howToGrant: {
        title: "Grant Creem API Access",
        steps: [
          "Open Creem Dashboard > Developers > API Keys.",
          "Copy your API Key and paste it into Indic8.",
        ],
      },
    },
    {
      key: "supportsSubscriptions",
      label: "Subscriptions",
      isGranted: caps?.supportsSubscriptions ?? true,
      status: "granted",
      statusText: "Recurring Billing Plans",
      howToGrant: {
        title: "Creem Subscriptions",
        steps: ["Synced via Creem Subscriptions API."],
      },
    },
    {
      key: "supportsMRR",
      label: "MRR Telemetry",
      isGranted: caps?.supportsMRR ?? true,
      status: "granted",
      statusText: "Normalized Creem MRR",
      howToGrant: {
        title: "MRR Calculations",
        steps: ["Computed continuously from active recurring subscription intervals."],
      },
    },
    {
      key: "supportsCustomers",
      label: "Customer Profiles",
      isGranted: caps?.supportsCustomers ?? true,
      status: "granted",
      statusText: "Customer Names & Emails",
      howToGrant: {
        title: "Customer Records",
        steps: ["Imported from Creem Customers API."],
      },
    },
    {
      key: "supportsRefunds",
      label: "Disputes & Refunds",
      isGranted: caps?.supportsRefunds ?? true,
      status: "granted",
      statusText: "Refund Tracking & Volume",
      howToGrant: {
        title: "Refunds",
        steps: ["Accounted for in Creem tax & dispute settlement ledgers."],
      },
    },
    {
      key: "supportsCountries",
      label: "Buyer Countries",
      isGranted: caps?.supportsCountries ?? true,
      status: "granted",
      statusText: "Global Tax & Buyer Geographies",
      howToGrant: {
        title: "Geographies",
        steps: ["Derived from Creem checkout billing location data."],
      },
    },
  ],
};

export function getProviderCapabilitiesDetails(
  providerId: ProviderId,
  capabilities?: Partial<ProviderCapabilities>
): CapabilityDetail[] {
  const resolver = PROVIDER_CAPABILITY_MATRIX[providerId];
  if (!resolver) return [];
  return resolver(capabilities);
}
