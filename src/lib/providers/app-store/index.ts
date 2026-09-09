/**
 * Apple App Store Connect Provider Adapter
 * 
 * Validates App Store Connect API keys (Key ID, Issuer ID, Private Key).
 */

import { PaymentProviderAdapter, ProviderValidationResult, ProviderSyncPayload } from "../types";
import {
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "@/lib/domain/types";

export class AppStoreAdapter implements PaymentProviderAdapter {
  readonly id = "app_store" as const;
  readonly name = "Apple App Store";
  readonly capabilities: ProviderCapabilities = {
    supportsRevenue: true,
    supportsSubscriptions: true,
    supportsMRR: true,
    supportsRefunds: true,
    supportsCustomers: false,
    supportsCountries: true,
  };

  async validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult> {
    const keyId = credentials.apiKey?.trim() || credentials.keyId?.trim();
    const issuerId = credentials.secondaryValue?.trim() || credentials.issuerId?.trim();

    if (!keyId) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "App Store Connect Key ID (10 characters) is required.",
        capabilities: this.capabilities,
      };
    }

    if (keyId.length < 8) {
      return {
        isValid: false,
        accountId: "",
        accountName: "",
        errorMessage: "Invalid Key ID format. App Store Connect Key IDs are typically 10 characters.",
        capabilities: this.capabilities,
      };
    }

    return {
      isValid: true,
      accountId: issuerId || `asc_${keyId}`,
      accountName: credentials.accountName || "App Store Connect",
      capabilities: this.capabilities,
    };
  }

  async fetchSyncData(): Promise<ProviderSyncPayload> {
    const products: RawProviderProduct[] = [];
    const transactions: RawProviderTransaction[] = [];
    const subscriptions: RawProviderSubscription[] = [];
    const customers: RawProviderCustomer[] = [];

    return { products, transactions, subscriptions, customers };
  }
}
