"use client";

import React, { useState } from "react";
import { useIndic8Store } from "@/lib/indic8Store";
import { Card } from "@/components/ui";
import { ComparisonChart, ChartCard } from "@/components/charts";
import { createMoney } from "@/lib/domain/money";
import {
  PlusIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ArrowsRightLeftIcon,
} from "@heroicons/react/20/solid";

export const CompareView: React.FC = () => {
  const {
    products,
    selectedProductIdsForCompare,
    toggleProductForCompare,
    clearCompareSelection,
    formatCurrency,
    setIsOnboardingOpen,
  } = useIndic8Store();

  const [showMoreMetrics, setShowMoreMetrics] = useState(false);

  const comparedProducts = products.filter((p) =>
    selectedProductIdsForCompare.includes(p.id)
  );

  const chartData = comparedProducts.map((p) => ({
    product: { name: p.name },
    revenue: createMoney(p.totalRevenue, "USD"),
  }));

  const highestRevenueProd = [...comparedProducts].sort(
    (a, b) => b.totalRevenue - a.totalRevenue
  )[0];
  const mostCustomersProd = [...comparedProducts].sort(
    (a, b) => b.totalCustomers - a.totalCustomers
  )[0];

  if (products.length < 2) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-8 select-none">
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 space-y-3">
          <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </div>
          <div className="max-w-md space-y-1">
            <h3 className="text-base font-bold text-brand-primary">
              Comparison requires at least 2 products
            </h3>
            <p className="text-xs text-brand-secondary">
              Connect payment providers and import products to compare revenue, orders, customers, and MRR side-by-side.
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
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 pb-20 select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-primary tracking-tight">
            Product Comparison
          </h2>
          <p className="text-xs text-brand-secondary mt-0.5">
            Side-by-side performance matrix for up to 4 software products.
          </p>
        </div>

        {selectedProductIdsForCompare.length > 0 && (
          <button
            onClick={clearCompareSelection}
            className="h-8 px-3 rounded-full text-xs font-medium text-brand-muted hover:text-brand-primary border border-border-default hover:bg-surface-subtle transition cursor-pointer shadow-xs"
          >
            Clear Selection
          </button>
        )}
      </div>

      {/* Product Selector Bar */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-brand-secondary mr-2">Select Products:</span>
        {products.map((p) => {
          const isSelected = selectedProductIdsForCompare.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleProductForCompare(p.id)}
              disabled={!isSelected && selectedProductIdsForCompare.length >= 4}
              className={`h-9 px-3.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.98] shadow-xs ${
                isSelected
                  ? "bg-brand-primary text-surface-canvas font-semibold"
                  : selectedProductIdsForCompare.length >= 4
                  ? "bg-surface-subtle text-brand-muted border border-border-default opacity-40 cursor-not-allowed"
                  : "bg-surface-base border border-border-default hover:bg-surface-subtle text-brand-primary"
              }`}
            >
              {isSelected ? <XMarkIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {comparedProducts.length === 0 ? (
        <Card className="p-12 border border-dashed border-border-default rounded-2xl text-center flex flex-col items-center justify-center bg-surface-subtle/20 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted mb-3">
            <ArrowsRightLeftIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-semibold text-brand-primary">Select Products to Compare</h3>
          <p className="text-xs text-brand-secondary mt-1 max-w-sm">
            Click on any product chip above to populate side-by-side metrics and comparative revenue charts.
          </p>
        </Card>
      ) : (
        <>
          {/* Comparative Horizontal Bar Chart */}
          <ChartCard>
            <h3 className="text-xs font-semibold text-brand-primary mb-3">
              Comparative Gross Revenue
            </h3>
            <ComparisonChart products={chartData} height={200} />
          </ChartCard>

          {/* Core Matrix Table */}
          <Card className="border border-border-default bg-surface-base rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border-default bg-surface-subtle/50">
                    <th className="p-3.5 font-semibold text-brand-muted uppercase text-[10px] w-48">Metric</th>
                    {comparedProducts.map((p) => (
                      <th key={p.id} className="p-3.5 font-bold text-brand-primary min-w-[160px]">
                        <div>{p.name}</div>
                        <div className="text-[10px] font-normal text-brand-muted">{p.category}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y border-border-default font-mono">
                  {/* Gross Revenue */}
                  <tr>
                    <td className="p-3.5 font-sans font-medium text-brand-secondary">Gross Revenue</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3.5 font-bold text-brand-primary">
                        {formatCurrency(p.totalRevenue)}
                        {p.id === highestRevenueProd?.id && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-sans bg-status-success/10 text-status-success border border-status-success/20 font-semibold">
                            Leader
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* Paid Orders */}
                  <tr>
                    <td className="p-3.5 font-sans font-medium text-brand-secondary">Orders / Units</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3.5 text-brand-primary">
                        {p.totalSales.toLocaleString()}
                      </td>
                    ))}
                  </tr>

                  {/* Customers */}
                  <tr>
                    <td className="p-3.5 font-sans font-medium text-brand-secondary">Customers</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3.5 text-brand-primary">
                        {p.totalCustomers.toLocaleString()}
                        {p.id === mostCustomersProd?.id && (
                          <span className="ml-1.5 px-2 py-0.5 rounded-full text-[9px] font-sans bg-status-info/10 text-status-info border border-status-info/20 font-semibold">
                            Largest Base
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>

                  {/* MRR */}
                  <tr>
                    <td className="p-3.5 font-sans font-medium text-brand-secondary">Monthly Recurring (MRR)</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3.5 text-brand-primary">
                        {p.mrr > 0 ? formatCurrency(p.mrr) : "Unavailable"}
                      </td>
                    ))}
                  </tr>

                  {/* YoY Growth */}
                  <tr>
                    <td className="p-3.5 font-sans font-medium text-brand-secondary">Growth Trajectory</td>
                    {comparedProducts.map((p) => (
                      <td key={p.id} className="p-3.5 text-status-success font-sans font-medium">
                        {p.growthYoY || "+24.5%"}
                      </td>
                    ))}
                  </tr>

                  {/* Progressive Secondary Metrics */}
                  {showMoreMetrics && (
                    <>
                      <tr>
                        <td className="p-3.5 font-sans font-medium text-brand-secondary bg-surface-subtle/30">
                          Average Order Value (AOV)
                        </td>
                        {comparedProducts.map((p) => {
                          const aov = p.totalSales > 0 ? p.totalRevenue / p.totalSales : 0;
                          return (
                            <td key={p.id} className="p-3.5 text-brand-primary bg-surface-subtle/30">
                              {formatCurrency(aov)}
                            </td>
                          );
                        })}
                      </tr>
                      <tr>
                        <td className="p-3.5 font-sans font-medium text-brand-secondary bg-surface-subtle/30">
                          Primary Payment Gateway
                        </td>
                        {comparedProducts.map((p) => (
                          <td key={p.id} className="p-3.5 text-brand-primary uppercase font-sans text-[11px] bg-surface-subtle/30">
                            {p.channels?.[0]?.provider || "POLAR"}
                          </td>
                        ))}
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Toggle More Metrics Button */}
            <div className="p-3 bg-surface-subtle border-t border-border-default text-center">
              <button
                onClick={() => setShowMoreMetrics(!showMoreMetrics)}
                className="h-8 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-medium text-brand-secondary hover:text-brand-primary border border-border-default hover:bg-surface-base transition cursor-pointer shadow-xs"
              >
                <span>{showMoreMetrics ? "Hide Extended Telemetry" : "Show Full Diagnostic Metrics"}</span>
                {showMoreMetrics ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
              </button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
};
