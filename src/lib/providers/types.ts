import {
  ProviderId,
  ProviderCapabilities,
  RawProviderProduct,
  RawProviderTransaction,
  RawProviderSubscription,
  RawProviderCustomer,
} from "../domain/types";

export interface ProviderValidationResult {
  isValid: boolean;
  accountId: string;
  accountName: string;
  errorMessage?: string;
  capabilities: ProviderCapabilities;
}

export interface ProviderSyncPayload {
  products: RawProviderProduct[];
  transactions: RawProviderTransaction[];
  subscriptions: RawProviderSubscription[];
  customers: RawProviderCustomer[];
  nextCursor?: string;
}

export interface PaymentProviderAdapter {
  readonly id: ProviderId;
  readonly name: string;
  readonly capabilities: ProviderCapabilities;

  /**
   * Performs real server-side authentication test against provider API.
   * Confirms credentials, account identity, and required permissions.
   */
  validateConnection(credentials: Record<string, string>): Promise<ProviderValidationResult>;

  /**
   * Fetches real raw records from the provider API.
   */
  fetchSyncData(
    credentials: Record<string, string>,
    sinceCursor?: string
  ): Promise<ProviderSyncPayload>;
}
