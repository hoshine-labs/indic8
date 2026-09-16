/**
 * Provider Adapter Registry
 */

import { ProviderId, ProviderCapabilities } from "@/lib/domain/types";
import { PaymentProviderAdapter } from "./types";
import { StripeAdapter } from "./stripe";
import { PolarAdapter } from "./polar";
import { RevenueCatAdapter } from "./revenuecat";
import { LemonSqueezyAdapter } from "./lemon-squeezy";
import { AppStoreAdapter } from "./app-store";
import { GooglePlayAdapter } from "./google-play";
import { DodoPaymentsAdapter } from "./dodo";
import { PaddleAdapter } from "./paddle";
import { GumroadAdapter } from "./gumroad";
import { CreemAdapter } from "./creem";

export const PROVIDER_REGISTRY: Record<ProviderId, PaymentProviderAdapter> = {
  stripe: new StripeAdapter(),
  polar: new PolarAdapter(),
  revenuecat: new RevenueCatAdapter(),
  lemonsqueezy: new LemonSqueezyAdapter(),
  app_store: new AppStoreAdapter(),
  google_play: new GooglePlayAdapter(),
  dodopayments: new DodoPaymentsAdapter(),
  paddle: new PaddleAdapter(),
  gumroad: new GumroadAdapter(),
  creem: new CreemAdapter(),
};

export function getProviderAdapter(id: ProviderId): PaymentProviderAdapter | null {
  return PROVIDER_REGISTRY[id] || null;
}

export function getProviderCapabilities(id: ProviderId): ProviderCapabilities {
  const adapter = getProviderAdapter(id);
  if (!adapter) {
    return {
      supportsRevenue: false,
      supportsSubscriptions: false,
      supportsMRR: false,
      supportsRefunds: false,
      supportsCustomers: false,
      supportsCountries: false,
    };
  }
  return adapter.capabilities;
}
