import React from "react";
import { ArrowTrendingUpIcon } from "@heroicons/react/20/solid";

export interface ChartEmptyStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export const ChartEmptyState: React.FC<ChartEmptyStateProps> = ({
  title = "No Telemetry Recorded",
  description = "No transaction data recorded for the selected time window.",
  className = "h-64",
}) => {
  return (
    <div
      className={`w-full border border-dashed border-border-default rounded-xl flex flex-col items-center justify-center p-6 text-center bg-surface-subtle/30 ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-surface-base border border-border-default flex items-center justify-center text-brand-muted mb-3">
        <ArrowTrendingUpIcon className="w-5 h-5" />
      </div>
      <h4 className="text-xs font-semibold text-brand-primary">{title}</h4>
      <p className="text-[11px] text-brand-secondary mt-0.5 max-w-xs">{description}</p>
    </div>
  );
};
