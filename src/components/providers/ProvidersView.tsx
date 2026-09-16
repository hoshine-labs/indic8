"use client";

import React, { useState } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { BrandIcon } from "@/lib/brandLogos";
import { Card, Badge, AnimatedToggle } from "@/components/ui";
import { LocalPreferences } from "@/lib/storage/localPreferences";
import { ProviderId } from "@/lib/domain/types";
import {
  getProviderCapabilitiesDetails,
  CapabilityDetail,
} from "@/lib/providers/capabilitiesGuide";
import {
  ArrowPathIcon,
  PlusIcon,
  TrashIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon,
  CircleStackIcon,
  QuestionMarkCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";

export const ProvidersView: React.FC = () => {
  const {
    providers,
    connections,
    products,
    primaryCurrency,
    syncProvider,
    disconnectProvider,
    setIsOnboardingOpen,
    setActiveTab,
    isProviderSyncing,
  } = useIndic8Store();

  const [expandedProviderId, setExpandedProviderId] = useState<string | null>(null);
  const [showArchivedByProvider, setShowArchivedByProvider] = useState<Record<string, boolean>>(() => {
    if (typeof window !== "undefined") {
      return LocalPreferences.get("showArchivedByProvider") || {};
    }
    return {};
  });
  const [activeTooltipCapability, setActiveTooltipCapability] = useState<{
    providerId: string;
    capability: CapabilityDetail;
  } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedProviderId(expandedProviderId === id ? null : id);
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-brand-primary tracking-tight">
          Data Source Health &amp; Gateways
        </h2>
        <p className="text-xs text-brand-secondary mt-0.5">
          Manage authenticated read-only payment gateways, linked apps, scope permissions, and live sync status.
        </p>
      </div>

      {providers.length === 0 ? (
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-surface-base border border-border-default flex items-center justify-center text-brand-muted shadow-2xs">
            <CircleStackIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-brand-primary">No payment providers connected</h3>
            <p className="text-xs text-brand-secondary">
              Connect your Stripe, Polar, RevenueCat, Paddle, Gumroad, Creem, App Store Connect, Google Play, or Lemon Squeezy account to import live data.
            </p>
          </div>
          <button
            onClick={() => setIsOnboardingOpen(true)}
            className="mt-2 h-9 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>Connect Provider</span>
          </button>
        </Card>
      ) : (
        /* Provider Cards List */
        <div className="space-y-4">
          {providers.map((provider) => {
            const isExpanded = expandedProviderId === provider.id;
            const isSyncing = isProviderSyncing(provider.id) || isProviderSyncing(provider.provider);
            const isActive = provider.status === "active";

            const matchingConn = connections.find((c) => c.providerId === provider.provider || c.id === provider.id);
            const capabilitiesList = getProviderCapabilitiesDetails(
              provider.provider as ProviderId,
              matchingConn?.capabilities
            );

            const grantedCount = capabilitiesList.filter((c) => c.isGranted).length;

            // Compute linked apps/products and total gateway stats
            const linkedProducts = products.filter((p) =>
              p.providers.some((pv) => pv.provider === provider.provider)
            );

            const totalGatewayRevenue = linkedProducts.reduce((sum, p) => {
              const matched = p.providers.find((pv) => pv.provider === provider.provider);
              return sum + (matched?.revenue || 0);
            }, 0);

            const totalGatewaySales = linkedProducts.reduce((sum, p) => {
              const matched = p.providers.find((pv) => pv.provider === provider.provider);
              return sum + (matched?.salesCount || 0);
            }, 0);

            return (
              <Card
                key={provider.id}
                className="border border-border-default bg-surface-base rounded-2xl overflow-hidden transition-colors shadow-xs"
              >
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Gateway Identity */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-surface-subtle border border-border-default flex items-center justify-center shrink-0 shadow-2xs">
                      <BrandIcon provider={provider.provider} className="w-5 h-5" colored={true} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-brand-primary">
                          {provider.accountName}
                        </h3>
                        <Badge variant={isActive ? "success" : "neutral"} size="sm" className="rounded-full">
                          {isActive ? "Connected & Live" : "Disconnected"}
                        </Badge>
                        {provider.isSandbox && (
                          <Badge variant="warning" size="sm" className="rounded-full">
                            Sandbox
                          </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-brand-secondary font-mono mt-0.5">
                        Account: {provider.accountId} · {linkedProducts.length} {linkedProducts.length === 1 ? "app/product" : "apps/products"} linked · {grantedCount}/{capabilitiesList.length} permissions active
                      </div>
                    </div>
                  </div>

                  {/* Actions Strip */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => syncProvider(provider.id)}
                      disabled={isSyncing}
                      className={`h-8 px-3 rounded-full text-xs font-medium border border-border-default bg-surface-subtle hover:bg-surface-base text-brand-primary transition flex items-center gap-1.5 cursor-pointer shadow-xs ${
                        isSyncing ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <ArrowPathIcon
                        className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-brand-primary" : "text-brand-muted"}`}
                      />
                      <span>{isSyncing ? "Syncing..." : "Sync"}</span>
                    </button>

                    <button
                      onClick={() => toggleExpand(provider.id)}
                      className="h-8 px-3.5 rounded-full text-xs font-medium border border-border-default bg-surface-subtle hover:bg-surface-base text-brand-primary transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <span>Functionalities</span>
                      {capabilitiesList.some((c) => !c.isGranted) && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      )}
                      {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                    </button>

                    <button
                      onClick={() => disconnectProvider(provider.id)}
                      className="w-8 h-8 rounded-full border border-border-default bg-surface-subtle hover:bg-surface-base text-brand-muted hover:text-red-400 transition flex items-center justify-center cursor-pointer shadow-xs"
                      title="Disconnect Gateway"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Expandable Apps & Capabilities Inspector */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-border-default bg-surface-subtle/30 space-y-5">
                    {/* 1. Account Consolidated Totals Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-surface-base border border-border-default shadow-2xs">
                      <div>
                        <div className="text-[10px] uppercase font-mono text-brand-muted">Total Gateway Revenue</div>
                        <div className="text-base font-bold font-mono text-brand-primary mt-0.5">
                          ${totalGatewayRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-brand-muted">Total Ingested Orders</div>
                        <div className="text-base font-bold font-mono text-brand-primary mt-0.5">
                          {totalGatewaySales.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-mono text-brand-muted">Active Apps in Account</div>
                        <div className="text-base font-bold font-mono text-brand-primary mt-0.5">
                          {linkedProducts.length}
                        </div>
                      </div>
                    </div>

                    {/* 2. Linked Products / Apps Sub-List */}
                    {(() => {
                      const showArchived = Boolean(showArchivedByProvider[provider.id]);
                      const archivedProducts = linkedProducts.filter((p) => p.isArchived || p.providers.some((pv) => pv.provider === provider.provider && pv.isArchived));
                      const activeProducts = linkedProducts.filter((p) => !p.isArchived && !p.providers.some((pv) => pv.provider === provider.provider && pv.isArchived));
                      const displayedProducts = showArchived ? linkedProducts : activeProducts;

                      return (
                        <div>
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                                Linked Products ({displayedProducts.length})
                              </span>
                              {archivedProducts.length > 0 && !showArchived && (
                                <span className="text-[10px] text-brand-muted font-mono">
                                  ({archivedProducts.length} archived hidden)
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              {/* Animated Toggle to Switch Active vs All (with Archived) Products */}
                              {archivedProducts.length > 0 && (
                                <AnimatedToggle
                                  size="sm"
                                  layoutId={`provider-archived-toggle-${provider.id}`}
                                  options={[
                                    { id: "active", label: "Active", badge: activeProducts.length },
                                    { id: "all", label: "Include Archived", badge: archivedProducts.length },
                                  ]}
                                  activeId={showArchived ? "all" : "active"}
                                  onChange={(id) => {
                                    const isAll = id === "all";
                                    setShowArchivedByProvider((prev) => {
                                      const next = {
                                        ...prev,
                                        [provider.id]: isAll,
                                        [provider.provider]: isAll,
                                      };
                                      LocalPreferences.set("showArchivedByProvider", next);
                                      if (typeof window !== "undefined") {
                                        window.dispatchEvent(
                                          new CustomEvent("indic8_preferences_updated", {
                                            detail: { key: "showArchivedByProvider" },
                                          })
                                        );
                                      }
                                      return next;
                                    });
                                  }}
                                />
                              )}

                              <button
                                onClick={() => setActiveTab("products")}
                                className="text-[11px] font-medium text-brand-secondary hover:text-brand-primary underline transition cursor-pointer"
                              >
                                View in Catalog →
                              </button>
                            </div>
                          </div>

                          {displayedProducts.length === 0 ? (
                            <div className="p-4 rounded-xl border border-dashed border-border-default text-center text-xs text-brand-muted bg-surface-base">
                              {linkedProducts.length > 0 && !showArchived
                                ? `All ${linkedProducts.length} product(s) in this provider are archived. Enable "Show Archived Products" above to view them.`
                                : "No active apps linked to this connection yet. Click Sync or check scope permissions."}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                              {displayedProducts.map((prod) => {
                                const specificChannel = prod.providers.find((pv) => pv.provider === provider.provider);
                                const isProdArchived = prod.isArchived || specificChannel?.isArchived;

                                return (
                                  <div
                                    key={prod.id}
                                    className={`p-3 rounded-xl border flex items-center justify-between gap-2 shadow-2xs ${
                                      isProdArchived
                                        ? "bg-surface-subtle/40 border-dashed border-amber-500/30 opacity-75"
                                        : "bg-surface-base border-border-default"
                                    }`}
                                  >
                                    <div className="truncate">
                                      <div className="flex items-center gap-1.5 truncate">
                                        <span className="text-xs font-bold text-brand-primary truncate">
                                          {prod.name}
                                        </span>
                                        {isProdArchived && (
                                          <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-semibold shrink-0">
                                            Archived
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] font-mono text-brand-muted truncate">
                                        ID: {specificChannel?.externalProductId || prod.id}
                                      </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <div className="text-xs font-bold font-mono text-brand-primary">
                                        ${(specificChannel?.revenue || 0).toLocaleString()}
                                      </div>
                                      <div className="text-[10px] text-brand-muted">
                                        {specificChannel?.salesCount || 0} sales
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* 3. Granular Gateway Permissions & Stream Capabilities */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-brand-primary uppercase tracking-wider">
                          Ingestion Capabilities &amp; Permissions
                        </span>
                        <span className="text-[11px] text-brand-muted">
                          {grantedCount} of {capabilitiesList.length} streams granted
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                        {capabilitiesList.map((cap) => {
                          const isGranted = cap.isGranted;
                          const isMissing = cap.status === "missing_permission";
                          const isUnsupported = cap.status === "unsupported_by_platform";

                          return (
                            <div
                              key={cap.key}
                              onClick={() =>
                                setActiveTooltipCapability({
                                  providerId: provider.id,
                                  capability: cap,
                                } as any)
                              }
                              className={`p-3 rounded-xl border transition-all cursor-pointer relative group flex flex-col justify-between ${
                                isGranted
                                  ? "bg-surface-base border-border-default hover:border-emerald-500/40"
                                  : isMissing
                                  ? "bg-amber-500/5 border-amber-500/30 hover:border-amber-500/60"
                                  : "bg-surface-base/60 border-border-default hover:border-border-default"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="space-y-0.5">
                                  <div className="text-xs font-semibold text-brand-primary">
                                    {cap.label}
                                  </div>
                                  <div className="text-[10px] text-brand-secondary">
                                    {cap.statusText}
                                  </div>
                                </div>

                                <div className="shrink-0 mt-0.5">
                                  {isGranted && (
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                      <CheckCircleIcon className="w-3.5 h-3.5" />
                                      <span>Active</span>
                                    </div>
                                  )}
                                  {isMissing && (
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded animate-pulse">
                                      <ExclamationCircleIcon className="w-3.5 h-3.5" />
                                      <span>Missing</span>
                                    </div>
                                  )}
                                  {isUnsupported && (
                                    <div className="flex items-center gap-1 text-[10px] font-medium text-brand-muted bg-surface-subtle px-1.5 py-0.5 rounded">
                                      <InformationCircleIcon className="w-3.5 h-3.5" />
                                      <span>Not in API</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="mt-2 pt-2 border-t border-border-default/60 flex items-center justify-between text-[10px] text-brand-muted group-hover:text-brand-primary transition-colors">
                                <span>{isGranted ? "View stream detail" : "How to grant access"}</span>
                                <QuestionMarkCircleIcon className="w-3.5 h-3.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Interactive Permission / How to Grant Tooltip Modal */}
      {activeTooltipCapability && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface-canvas border border-border-default rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-border-default">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-brand-primary">
                    {activeTooltipCapability.capability.howToGrant.title}
                  </h3>
                  {activeTooltipCapability.capability.isGranted ? (
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-semibold px-2 py-0.5 rounded">
                      Active
                    </span>
                  ) : activeTooltipCapability.capability.status === "missing_permission" ? (
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-semibold px-2 py-0.5 rounded">
                      Scope Required
                    </span>
                  ) : (
                    <span className="text-[10px] bg-surface-subtle text-brand-muted font-medium px-2 py-0.5 rounded">
                      Platform Architecture
                    </span>
                  )}
                </div>
                <p className="text-xs text-brand-secondary">
                  {activeTooltipCapability.capability.label} · {activeTooltipCapability.capability.statusText}
                </p>
              </div>
              <button
                onClick={() => setActiveTooltipCapability(null)}
                className="p-1 text-brand-secondary hover:text-brand-primary rounded cursor-pointer"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <h4 className="text-xs font-semibold text-brand-primary mb-2">
                  How to configure &amp; grant access:
                </h4>
                <ol className="list-decimal list-inside space-y-1.5 text-brand-secondary text-[11px] leading-relaxed bg-surface-base p-3.5 rounded-xl border border-border-default">
                  {activeTooltipCapability.capability.howToGrant.steps.map((step, idx) => (
                    <li key={idx} className="pl-1">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {activeTooltipCapability.capability.howToGrant.scopeName && (
                <div className="p-2.5 rounded-xl bg-surface-subtle border border-border-default flex items-center justify-between text-[11px]">
                  <span className="text-brand-secondary font-medium">Required Scope:</span>
                  <code className="text-brand-primary font-mono text-[10px] bg-surface-base px-2 py-0.5 rounded border border-border-default">
                    {activeTooltipCapability.capability.howToGrant.scopeName}
                  </code>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveTooltipCapability(null)}
                className="px-4 py-2 rounded-xl bg-brand-primary text-surface-canvas font-semibold text-xs hover:bg-brand-darker transition cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
