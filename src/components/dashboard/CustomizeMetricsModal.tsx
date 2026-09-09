"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  XMarkIcon,
  Bars2Icon,
  PlusIcon,
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
} from "@heroicons/react/20/solid";
import { useTheme } from "@/context/ThemeContext";

export interface MetricDefinition {
  id: string;
  title: string;
  category: "Revenue" | "Subscriptions" | "Orders & Customers" | "Geographic";
  description: string;
}

export const ALL_METRICS_CATALOG: MetricDefinition[] = [
  // Revenue
  {
    id: "revenue",
    title: "Gross Revenue",
    category: "Revenue",
    description: "Consolidated revenue trajectory from all completed transactions.",
  },
  {
    id: "net_revenue",
    title: "Net Revenue",
    category: "Revenue",
    description: "Revenue after deducting gateway fees and processing costs.",
  },
  {
    id: "cumulative_revenue",
    title: "Cumulative Revenue",
    category: "Revenue",
    description: "Running total of gross revenue over the selected period.",
  },
  {
    id: "aov",
    title: "Average Order Value",
    category: "Revenue",
    description: "Mean gross value per completed customer order.",
  },

  // Subscriptions
  {
    id: "mrr",
    title: "Monthly Recurring Revenue",
    category: "Subscriptions",
    description: "Normalized monthly revenue from active recurring subscription tiers.",
  },
  {
    id: "subscriptions",
    title: "Active Subscriptions",
    category: "Subscriptions",
    description: "Total number of active customer subscriptions.",
  },

  // Orders & Customers
  {
    id: "orders",
    title: "Paid Orders",
    category: "Orders & Customers",
    description: "Number of completed checkout transactions.",
  },
  {
    id: "customers",
    title: "Customer Accounts",
    category: "Orders & Customers",
    description: "Distinct customer accounts with verified order history.",
  },
  {
    id: "refunds",
    title: "Refunds & Disputes",
    category: "Orders & Customers",
    description: "Total volume and rate of refunded customer transactions.",
  },

  // Geographic & Distribution
  {
    id: "world_map",
    title: "Global Sales Distribution",
    category: "Geographic",
    description: "Interactive worldwide geographic country heatmap and top regions.",
  },
  {
    id: "distribution_breakdown",
    title: "Share & Distribution Breakdown",
    category: "Geographic",
    description: "Interactive multi-dimensional pie, donut & bar share analysis by product, country, provider, or payment status.",
  },
];

export const DEFAULT_METRICS_ORDER = ["revenue", "mrr", "subscriptions", "world_map", "distribution_breakdown"];

export interface CustomizeMetricsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMetricIds: string[];
  onSave: (newMetricIds: string[]) => void;
}

export const CustomizeMetricsModal: React.FC<CustomizeMetricsModalProps> = ({
  isOpen,
  onClose,
  selectedMetricIds,
  onSave,
}) => {
  const [selectedList, setSelectedList] = useState<string[]>(selectedMetricIds);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    Revenue: true,
    Subscriptions: true,
    "Orders & Customers": true,
    Geographic: true,
  });

  const { isDark } = useTheme();

  // Keep state in sync on open
  React.useEffect(() => {
    if (isOpen) {
      setSelectedList(selectedMetricIds);
    }
  }, [isOpen, selectedMetricIds]);

  if (!isOpen) return null;

  const handleAddMetric = (id: string) => {
    if (!selectedList.includes(id)) {
      setSelectedList((prev) => [...prev, id]);
    }
  };

  const handleRemoveMetric = (id: string) => {
    setSelectedList((prev) => prev.filter((item) => item !== id));
  };

  const toggleCategory = (cat: string) => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleResetToDefault = () => {
    setSelectedList(DEFAULT_METRICS_ORDER);
  };

  const handleSave = () => {
    onSave(selectedList.length > 0 ? selectedList : DEFAULT_METRICS_ORDER);
    onClose();
  };

  const categories = ["Revenue", "Subscriptions", "Orders & Customers", "Geographic"] as const;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs select-none">
        <div className="fixed inset-0 cursor-pointer" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative z-10 w-full max-w-3xl rounded-3xl border border-border-default bg-surface-base shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-default">
            <div>
              <h2 className="text-sm font-semibold text-brand-primary">
                Customize Overview Metrics
              </h2>
              <p className="text-[11px] text-brand-secondary">
                Drag to reorder active charts, or add additional metrics from the catalog.
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-surface-subtle text-brand-secondary hover:text-brand-primary transition cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Modal 2-Column Body */}
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-border-default overflow-y-auto flex-1 p-6 gap-6 md:gap-0">
            {/* Left Column: Drag & Drop Reorderable Selected Metrics */}
            <div className="md:pr-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-primary">Selected Metrics</span>
                <span className="text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border-default text-brand-primary">
                  {selectedList.length} active
                </span>
              </div>

              <div className="flex-1 overflow-y-auto max-h-96 pr-1">
                {selectedList.length === 0 ? (
                  <div className="text-center py-10 text-xs text-brand-secondary border border-dashed border-border-default rounded-2xl">
                    No metrics selected. Pick from the available metrics list.
                  </div>
                ) : (
                  <Reorder.Group
                    axis="y"
                    values={selectedList}
                    onReorder={setSelectedList}
                    className="space-y-2"
                  >
                    {selectedList.map((id) => {
                      const metric = ALL_METRICS_CATALOG.find((m) => m.id === id);
                      if (!metric) return null;

                      return (
                        <Reorder.Item
                          key={id}
                          value={id}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-border-default bg-surface-subtle hover:border-brand-primary/40 transition-colors cursor-grab active:cursor-grabbing shadow-xs"
                          whileDrag={{ scale: 1.02, boxShadow: "0 10px 25px rgba(0,0,0,0.3)" }}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="text-brand-muted hover:text-brand-primary transition">
                              <Bars2Icon className="w-4 h-4" />
                            </span>
                            <div>
                              <span className="text-xs font-medium text-brand-primary block">
                                {metric.title}
                              </span>
                              <span className="text-[10px] text-brand-secondary block">
                                {metric.category}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveMetric(id);
                            }}
                            className="p-1 rounded-lg text-brand-secondary hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
                            title="Remove metric"
                          >
                            <XMarkIcon className="w-3.5 h-3.5" />
                          </button>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                )}
              </div>
            </div>

            {/* Right Column: Available Metrics by Category */}
            <div className="md:pl-6 space-y-4 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-brand-primary">Metrics Catalog</span>
                <span className="text-[11px] text-brand-secondary">Click to add/remove</span>
              </div>

              <div className="space-y-3 flex-1 overflow-y-auto max-h-96 pr-1">
                {categories.map((cat) => {
                  const items = ALL_METRICS_CATALOG.filter((m) => m.category === cat);
                  const isOpen = openCategories[cat] ?? true;

                  return (
                    <div
                      key={cat}
                      className="rounded-2xl border border-border-default overflow-hidden bg-surface-subtle"
                    >
                      <button
                        type="button"
                        onClick={() => toggleCategory(cat)}
                        className="w-full flex items-center justify-between p-3 text-left text-xs font-semibold text-brand-primary bg-surface-subtle cursor-pointer hover:bg-surface-subtle/80 transition select-none"
                      >
                        <span>{cat}</span>
                        <motion.div
                          animate={{ rotate: isOpen ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDownIcon className="w-3.5 h-3.5" />
                        </motion.div>
                      </button>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden bg-surface-subtle border-t border-border-default/50"
                          >
                            <div className="p-2 space-y-1.5 bg-surface-subtle">
                              {items.map((item) => {
                                const isSelected = selectedList.includes(item.id);

                                return (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() =>
                                      !isSelected
                                        ? handleAddMetric(item.id)
                                        : handleRemoveMetric(item.id)
                                    }
                                    className={`w-full text-left p-2.5 rounded-xl text-xs transition flex items-center justify-between cursor-pointer ${
                                      isSelected
                                        ? "bg-brand-primary/10 border border-brand-primary/30 text-brand-primary"
                                        : "bg-surface-base/60 hover:bg-surface-base border border-border-default/40 text-brand-primary"
                                    }`}
                                  >
                                    <div className="pr-2">
                                      <div className="font-medium text-xs">{item.title}</div>
                                      <div className="text-[10px] text-brand-secondary leading-tight mt-0.5">
                                        {item.description}
                                      </div>
                                    </div>

                                    <div className="shrink-0">
                                      {isSelected ? (
                                        <span className="p-1 rounded-full bg-brand-primary text-surface-canvas flex items-center justify-center">
                                          <CheckIcon className="w-3 h-3" />
                                        </span>
                                      ) : (
                                        <span className="p-1 rounded-full bg-surface-base border border-border-default text-brand-secondary hover:text-brand-primary flex items-center justify-center">
                                          <PlusIcon className="w-3 h-3" />
                                        </span>
                                      )}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-border-default bg-surface-subtle">
            <button
              type="button"
              onClick={handleResetToDefault}
              className="text-xs text-brand-secondary hover:text-brand-primary flex items-center gap-1.5 cursor-pointer py-1.5 px-3 rounded-full hover:bg-surface-base transition"
            >
              <ArrowPathIcon className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="h-9 px-4 rounded-full text-xs font-medium border border-border-default hover:bg-surface-base text-brand-secondary hover:text-brand-primary transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="h-9 px-5 rounded-full text-xs font-semibold bg-brand-primary text-surface-canvas hover:bg-brand-darker transition shadow-xs cursor-pointer active:scale-[0.98]"
              >
                Save Layout
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
