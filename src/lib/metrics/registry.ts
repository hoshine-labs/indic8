import { formatMoney } from "../domain/money";
import { Money } from "../domain/types";

export interface MetricDefinition<T = unknown> {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  category: "financial" | "volume" | "subscription" | "retention";
  format: (value: T) => string;
}

export const METRIC_REGISTRY: Record<string, MetricDefinition<unknown>> = {
  grossRevenue: {
    id: "grossRevenue",
    label: "Gross Revenue",
    shortLabel: "Revenue",
    description: "Total authenticated revenue across all connected payment channels.",
    category: "financial",
    format: (val: unknown) => formatMoney(val as Money),
  },
  totalSales: {
    id: "totalSales",
    label: "Paid Orders & Units",
    shortLabel: "Sales",
    description: "Total count of successful checkouts and in-app purchases.",
    category: "volume",
    format: (val: unknown) => (val as number)?.toLocaleString() || "0",
  },
  totalCustomers: {
    id: "totalCustomers",
    label: "Total Customers",
    shortLabel: "Customers",
    description: "Unique purchasing accounts and email addresses.",
    category: "volume",
    format: (val: unknown) => (val as number)?.toLocaleString() || "0",
  },
  mrr: {
    id: "mrr",
    label: "Monthly Recurring Revenue",
    shortLabel: "MRR",
    description: "Normalized recurring revenue contribution from active subscriptions.",
    category: "subscription",
    format: (val: unknown) => (val ? formatMoney(val as Money) : "Unavailable"),
  },
  totalRefunds: {
    id: "totalRefunds",
    label: "Total Refunds",
    shortLabel: "Refunds",
    description: "Number of refunded orders processed across gateways.",
    category: "retention",
    format: (val: unknown) => (val as number)?.toString() || "0",
  },
};
