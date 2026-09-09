"use client";

import React, { useState, useMemo } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { UnifiedProduct, ProviderType } from "@/lib/types";
import { Card, AnimatedTabs, LoadingSpinner, Dropdown, NumberFlowAmount } from "@/components/ui";
import { ProductDetailInspector } from "./ProductDetailInspector";
import { ProductCard } from "./ProductCard";
import { BrandIcon } from "@/lib/brandLogos";
import { formatCurrencyAmount } from "@/lib/currency";
import {
  CubeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  Bars3Icon,
  ChevronDownIcon,
  ArrowRightIcon,
  ChevronUpDownIcon,
  FunnelIcon,
} from "@heroicons/react/20/solid";

export type ProductSortOption = "revenue_desc" | "revenue_asc" | "orders_desc" | "name_asc" | "newest";

export const ProductsView: React.FC = () => {
  const {
    products,
    primaryCurrency,
    setIsOnboardingOpen,
    providers,
    isInitialLoading,
  } = useIndic8Store();

  const [inspectingProduct, setInspectingProduct] = useState<UnifiedProduct | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [sortBy, setSortBy] = useState<ProductSortOption>("revenue_desc");

  // Filter and Sort Products
  const filteredAndSortedProducts = useMemo(() => {
    // By default, catalog hides archived products
    let result = products.filter((p) => !p.isArchived);

    // 1. Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.toLowerCase().includes(q) ||
          p.id.toLowerCase().includes(q)
      );
    }

    // 2. Provider filter
    if (selectedProvider !== "all") {
      result = result.filter((p) => {
        const channels = p.channels || p.providers || [];
        return channels.some((ch) => ch.provider === selectedProvider);
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case "revenue_desc":
          return (b.totalRevenue || 0) - (a.totalRevenue || 0);
        case "revenue_asc":
          return (a.totalRevenue || 0) - (b.totalRevenue || 0);
        case "orders_desc":
          return (b.totalSales || 0) - (a.totalSales || 0);
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "newest":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        default:
          return 0;
      }
    });

    return result;
  }, [products, searchQuery, selectedProvider, sortBy]);

  // Extract unique available providers for filter dropdown
  const availableProviders = useMemo(() => {
    const set = new Set<ProviderType>();
    products.forEach((p) => {
      const channels = p.channels || p.providers || [];
      channels.forEach((ch) => set.add(ch.provider));
    });
    return Array.from(set);
  }, [products]);

  // Initial Loading state before store hydration completes
  if (isInitialLoading) {
    return (
      <div className="w-full h-full min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 md:px-6 pb-20 select-none">
      {/* Fixed Sticky Top Controls Toolbar (Search, Filter, Sort, Layout Switcher) */}
      <div className="sticky top-0 z-30 bg-surface-canvas pt-4 md:pt-6 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Left Side: Search Input */}
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-brand-muted">
              <MagnifyingGlassIcon className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search products by title or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-full bg-surface-base border border-border-default text-xs text-brand-primary placeholder:text-brand-muted focus:outline-none focus:border-brand-primary/40 transition shadow-xs"
            />
          </div>

          {/* Right Side: Filters, Sorting, and Grid/List Tabs */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Provider Filter Dropdown */}
            <Dropdown
              options={[
                { id: "all", label: "All Providers", icon: FunnelIcon },
                ...availableProviders.map((prov) => ({
                  id: prov,
                  label: prov.toUpperCase(),
                  icon: <BrandIcon provider={prov} className="w-3.5 h-3.5" colored={true} />,
                })),
              ]}
              value={selectedProvider}
              onChange={(id) => setSelectedProvider(id)}
              icon={FunnelIcon}
              size="md"
              width="180px"
            />

            {/* Sort Dropdown */}
            <Dropdown
              options={[
                { id: "revenue_desc", label: "Highest Revenue" },
                { id: "revenue_asc", label: "Lowest Revenue" },
                { id: "orders_desc", label: "Most Orders" },
                { id: "name_asc", label: "Name A-Z" },
                { id: "newest", label: "Newest" },
              ]}
              value={sortBy}
              onChange={(id) => setSortBy(id as ProductSortOption)}
              icon={ChevronUpDownIcon}
              size="md"
              width="180px"
            />

            {/* Reusable Universal AnimatedTabs for View Switching */}
            <AnimatedTabs
              options={[
                { id: "grid", label: "Grid", icon: Squares2X2Icon },
                { id: "list", label: "List", icon: Bars3Icon },
              ]}
              activeId={viewMode}
              onChange={(id) => setViewMode(id as "grid" | "list")}
              size="md"
              layoutId="product-view-mode-pill"
            />
          </div>
        </div>
      </div>

      {/* Content Area */}
      {products.length === 0 ? (
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-surface-base border border-border-default flex items-center justify-center text-brand-muted shadow-2xs">
            <CubeIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-brand-primary">No products imported yet</h3>
            <p className="text-xs text-brand-secondary">
              Connect a payment provider (Stripe, Polar, RevenueCat, Lemon Squeezy, App Store, Google Play) to automatically aggregate and sync all your software products and revenue.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="h-9 px-4 rounded-full bg-brand-primary text-surface-canvas text-xs font-semibold hover:opacity-90 transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs"
            >
              <PlusIcon className="w-4 h-4" />
              <span>Connect Gateway</span>
            </button>
          </div>
        </Card>
      ) : filteredAndSortedProducts.length === 0 ? (
        <div className="py-16 text-center rounded-2xl border border-dashed border-border-default bg-surface-subtle/30 space-y-2">
          <p className="text-sm font-medium text-brand-primary">No products match your filter criteria.</p>
          <p className="text-xs text-brand-secondary">Try searching for a different keyword or resetting filters.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* 1. Unified Grid Layout */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 pt-1">
          {filteredAndSortedProducts.map((product, idx) => {
            const cardKey = product.id || `product_${idx}_${product.slug || "item"}`;

            return (
              <ProductCard
                key={cardKey}
                product={product}
                primaryCurrency={primaryCurrency}
                fallbackProvider={providers[0]?.provider || "polar"}
                onInspect={setInspectingProduct}
              />
            );
          })}
        </div>
      ) : (
        /* 2. Minimalist Squircle List Table Layout with Sticky Header & Sleek Scrollbar */
        <div className="w-full rounded-2xl border border-border-default bg-surface-base shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs border-collapse table-auto sm:table-fixed">
              <thead className="sticky top-0 z-20 bg-surface-subtle border-b border-border-default shadow-2xs">
                <tr className="text-[11px] font-mono uppercase text-brand-secondary">
                  <th className="py-3 px-3.5 font-semibold w-12 text-center">#</th>
                  <th className="py-3 px-4 font-semibold w-[36%]">Product</th>
                  <th className="py-3 px-4 font-semibold w-[18%]">Gateways</th>
                  <th className="py-3 px-4 font-semibold w-[14%] text-right">Orders</th>
                  <th className="py-3 px-4 font-semibold w-[18%] text-right">Gross Revenue</th>
                  <th className="py-3 px-4 text-right font-semibold w-[14%]">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default/50">
                {filteredAndSortedProducts.map((product, idx) => {
                  const channels = product.channels || product.providers || [];
                  const activeProv = channels[0]?.provider || "polar";
                  const ordersCount = product.totalSales || 0;
                  const revenueAmount = product.totalRevenue || 0;
                  const thumb = product.medias?.[0] || product.imageUrl;

                  return (
                    <tr
                      key={product.id}
                      onClick={() => setInspectingProduct(product)}
                      className="hover:bg-surface-subtle/50 transition-colors cursor-pointer group"
                    >
                      {/* # Number Column */}
                      <td className="py-3 px-3.5 text-center">
                        <div className="w-6 h-6 rounded-full bg-surface-subtle border border-border-default/60 flex items-center justify-center font-mono text-[10px] text-brand-muted mx-auto shadow-2xs">
                          {idx + 1}
                        </div>
                      </td>

                      {/* Product Column */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-[10px] bg-surface-subtle border border-border-default/50 overflow-hidden flex items-center justify-center shrink-0">
                            {thumb ? (
                              <img
                                src={thumb}
                                alt={product.name}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = `/api/image-proxy?url=${encodeURIComponent(thumb)}&name=${encodeURIComponent(product.name)}`;
                                }}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <CubeIcon className="w-5 h-5 text-brand-muted" />
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-brand-primary text-xs group-hover:text-blue-500 transition-colors">
                              {product.name}
                            </div>
                            <div className="text-[10px] font-mono text-brand-muted">
                              ID: {product.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Gateways Column */}
                      <td className="py-3 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface-subtle border border-border-default/60 shadow-2xs">
                          <BrandIcon provider={activeProv} className="w-3.5 h-3.5" colored={true} />
                          <span className="font-mono text-[10px] font-semibold text-brand-primary uppercase">
                            {activeProv}
                          </span>
                        </div>
                      </td>

                      {/* Orders Column */}
                      <td className="py-3 px-4 text-right font-mono font-semibold text-brand-primary">
                        <NumberFlowAmount value={ordersCount} />
                      </td>

                      {/* Revenue Column */}
                      <td className="py-3 px-4 text-right font-mono font-bold text-brand-primary text-xs">
                        <NumberFlowAmount value={revenueAmount} currency={primaryCurrency} />
                      </td>

                      {/* Actions Column */}
                      <td className="py-3 px-4 text-right">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingProduct(product);
                          }}
                          className="h-7 px-3.5 rounded-full bg-surface-subtle hover:bg-surface-base border border-border-default text-brand-primary text-[11px] font-medium inline-flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                        >
                          <span>Details</span>
                          <ArrowRightIcon className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over Inspector */}
      {inspectingProduct && (
        <ProductDetailInspector
          product={inspectingProduct}
          onClose={() => setInspectingProduct(null)}
        />
      )}
    </div>
  );
};
