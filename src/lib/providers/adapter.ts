import {
  ProviderId,
  ProviderConnection,
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "../domain/types";

export interface SyncResult {
  success: boolean;
  recordsCount: number;
  lastSyncedAt: string;
  error?: string;
}

export interface PaymentProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  readonly defaultCapabilities: ProviderCapabilities;

  connect(credentials: Record<string, string>): Promise<ProviderConnection>;
  disconnect(connectionId: string): Promise<void>;
  sync(connection: ProviderConnection): Promise<SyncResult>;

  getProducts(connection: ProviderConnection): Promise<RawProviderProduct[]>;
  getTransactions(connection: ProviderConnection): Promise<RawProviderTransaction[]>;
  getSubscriptions(connection: ProviderConnection): Promise<RawProviderSubscription[]>;
  getCustomers(connection: ProviderConnection): Promise<RawProviderCustomer[]>;
  getCapabilities(connection: ProviderConnection): ProviderCapabilities;
}

export abstract class BaseProviderAdapter implements PaymentProviderAdapter {
  abstract readonly id: ProviderId;
  abstract readonly name: string;
  abstract readonly defaultCapabilities: ProviderCapabilities;

  async connect(credentials: Record<string, string>): Promise<ProviderConnection> {
    const isConfigured = Boolean(credentials?.apiKey || credentials?.token || credentials?.clientId);
    return {
      id: `conn_${this.id}_${Date.now()}`,
      providerId: this.id,
      accountName: credentials.accountName || `${this.name} Primary`,
      accountId: credentials.accountId || `acct_${this.id}_live`,
      status: isConfigured ? "connected" : "unconfigured",
      connectedAt: isConfigured ? new Date().toISOString() : undefined,
      lastSyncedAt: isConfigured ? new Date().toISOString() : undefined,
      isSandbox: Boolean(credentials.isSandbox),
      capabilities: this.defaultCapabilities,
    };
  }

  async disconnect(): Promise<void> {
    // Adapter disconnect lifecycle
  }

  async sync(connection: ProviderConnection): Promise<SyncResult> {
    if (connection.status !== "connected") {
      return {
        success: false,
        recordsCount: 0,
        lastSyncedAt: connection.lastSyncedAt || new Date().toISOString(),
        error: `${this.name} is not connected.`,
      };
    }
    return {
      success: true,
      recordsCount: 0,
      lastSyncedAt: new Date().toISOString(),
    };
  }

  async getProducts(): Promise<RawProviderProduct[]> {
    return [];
  }

  async getTransactions(): Promise<RawProviderTransaction[]> {
    return [];
  }

  async getSubscriptions(): Promise<RawProviderSubscription[]> {
    return [];
  }

  async getCustomers(): Promise<RawProviderCustomer[]> {
    return [];
  }

  getCapabilities(): ProviderCapabilities {
    return this.defaultCapabilities;
  }
}

// Concrete Adapters (Cleanly ready for live REST/SDK integrations)

export class StripeAdapter extends BaseProviderAdapter {
  readonly id = "stripe" as const;
  readonly name = "Stripe";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };
}

export class PolarAdapter extends BaseProviderAdapter {
  readonly id = "polar" as const;
  readonly name = "Polar.sh";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: false,
    supportsCustomers: true,
    supportsCountries: true,
  };
}

export class RevenueCatAdapter extends BaseProviderAdapter {
  readonly id = "revenuecat" as const;
  readonly name = "RevenueCat";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: false,
  };
}

export class AppStoreAdapter extends BaseProviderAdapter {
  readonly id = "app_store" as const;
  readonly name = "Apple App Store";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };
}

export class GooglePlayAdapter extends BaseProviderAdapter {
  readonly id = "google_play" as const;
  readonly name = "Google Play";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };
}

export class LemonSqueezyAdapter extends BaseProviderAdapter {
  readonly id = "lemonsqueezy" as const;
  readonly name = "Lemon Squeezy";
  readonly defaultCapabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: true,
    supportsCountries: true,
  };
}

export const PROVIDER_ADAPTERS: Record<ProviderId, PaymentProviderAdapter> = {
  stripe: new StripeAdapter(),
  polar: new PolarAdapter(),
  revenuecat: new RevenueCatAdapter(),
  app_store: new AppStoreAdapter(),
  google_play: new GooglePlayAdapter(),
  lemonsqueezy: new LemonSqueezyAdapter(),
};
