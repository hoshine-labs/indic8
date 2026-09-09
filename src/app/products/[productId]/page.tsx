"use client";

import React, { use } from "react";
import Link from "next/link";
import { useIndic8Store } from "@/lib/indic8Store";
import { Card, Badge } from "@/components/ui";
import { ProductRevenueChart, ChartCard } from "@/components/charts";
import { generateRevenueTimeSeries } from "@/lib/metrics/engine";
import { BrandIcon } from "@/lib/brandLogos";
import { ProductProviderMapping } from "@/lib/types";
import {
  ArrowLeftIcon,
  ShieldCheckIcon,
  ShareIcon,
  CubeIcon,
} from "@heroicons/react/20/solid";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const resolvedParams = use(params);
  const { productId } = resolvedParams;
  const { products, transactions, formatCurrency, loadMilestoneIntoStudio } = useIndic8Store();

  const product = products.find((p) => p.id === productId);

  if (!product) {
    return (
      <div className="min-h-screen bg-surface-canvas text-brand-primary p-4 md:p-8 space-y-6 max-w-5xl mx-auto select-none pb-24">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-brand-secondary hover:text-brand-primary transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted">
            <CubeIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-brand-primary">Product Not Found</h3>
          <p className="text-xs text-brand-secondary max-w-sm">
            This product ID is not linked to any currently connected payment provider in your session.
          </p>
        </Card>
      </div>
    );
  }

  const prodTxs = transactions.filter((t) => t.productId === product.id || t.productName === product.name);
  const series = generateRevenueTimeSeries(prodTxs, "30d");
  const channels: ProductProviderMapping[] = product.channels || product.providers || [];

  return (
    <div className="min-h-screen bg-surface-canvas text-brand-primary p-4 md:p-8 space-y-6 max-w-5xl mx-auto select-none pb-24">
      {/* Top Breadcrumb / Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-brand-secondary hover:text-brand-primary transition"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>Back to Workspace</span>
        </Link>
        <Badge variant="verified" size="sm">
          <ShieldCheckIcon className="w-3.5 h-3.5 mr-1 inline" /> Authenticated Product
        </Badge>
      </div>

      {/* Product Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-surface-subtle border border-border-default text-brand-secondary">
              {product.category}
            </span>
            <span className="text-xs text-brand-muted font-mono">{product.id}</span>
          </div>
          <h1 className="text-2xl font-bold text-brand-primary mt-1.5">{product.name}</h1>
        </div>

        <button
          onClick={() =>
            loadMilestoneIntoStudio({
              numericValue: product.totalRevenue,
              metricLabel: product.name,
              currencySymbol: "$",
              subtext: `Verified ${product.category} Revenue Record`,
              growthDelta: "+48.2% YoY",
              verifiedSource: channels[0]?.provider || "stripe",
              backdropId: "obsidian",
            })
          }
          className="h-9 px-4 rounded-lg bg-brand-primary text-surface-canvas text-xs font-semibold hover:bg-brand-darker transition flex items-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          <ShareIcon className="w-4 h-4" />
          <span>Generate Milestone Post</span>
        </button>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="p-4 border border-border-default bg-surface-base">
          <span className="text-[11px] font-medium text-brand-muted">Total Revenue</span>
          <div className="text-2xl font-bold text-brand-primary font-mono mt-1">
            {formatCurrency(product.totalRevenue)}
          </div>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-base">
          <span className="text-[11px] font-medium text-brand-muted">Orders & Units Sold</span>
          <div className="text-2xl font-bold text-brand-primary font-mono mt-1">
            {product.totalSales.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-base">
          <span className="text-[11px] font-medium text-brand-muted">Customers</span>
          <div className="text-2xl font-bold text-brand-primary font-mono mt-1">
            {product.totalCustomers.toLocaleString()}
          </div>
        </Card>
        <Card className="p-4 border border-border-default bg-surface-base">
          <span className="text-[11px] font-medium text-brand-muted">Active Subscriptions</span>
          <div className="text-2xl font-bold text-brand-primary font-mono mt-1">
            {product.activeSubscriptions > 0 ? product.activeSubscriptions.toLocaleString() : "Unavailable"}
          </div>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <ChartCard>
        <h3 className="text-xs font-semibold text-brand-primary mb-4">
          30-Day Revenue Trend
        </h3>
        <ProductRevenueChart data={series} height={220} />
      </ChartCard>

      {/* Channel Attribution Breakdown */}
      <Card className="p-5 border border-border-default bg-surface-base space-y-3">
        <h3 className="text-xs font-semibold text-brand-primary">
          Connected Gateway Channels ({channels.length})
        </h3>
        <div className="divide-y divide-border-default">
          {channels.map((ch: ProductProviderMapping, idx: number) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <BrandIcon provider={ch.provider} className="w-5 h-5" />
                <div>
                  <div className="font-semibold text-brand-primary">{ch.externalProductName}</div>
                  <div className="font-mono text-[10px] text-brand-muted">{ch.externalProductId}</div>
                </div>
              </div>
              <div className="text-right font-mono">
                <div className="font-bold text-brand-primary">{formatCurrency(ch.revenue)}</div>
                <div className="text-[11px] text-brand-secondary">{ch.salesCount} sales</div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
