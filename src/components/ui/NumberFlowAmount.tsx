"use client";

import React from "react";
import NumberFlow from "@number-flow/react";
import { CURRENCY_SYMBOLS } from "@/lib/currency";

export interface NumberFlowAmountProps {
  value: number;
  currency?: string;
  prefix?: string;
  suffix?: string;
  className?: string;
  hideDecimals?: boolean;
  compact?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export const NumberFlowAmount: React.FC<NumberFlowAmountProps> = ({
  value,
  currency,
  prefix,
  suffix,
  className = "",
  hideDecimals = false,
  compact = false,
  minimumFractionDigits,
  maximumFractionDigits,
}) => {
  const safeVal = isNaN(value) || value === null || value === undefined ? 0 : value;

  // If currency is provided, format with currency symbol or code
  const code = currency?.toUpperCase();
  const symbol = code ? CURRENCY_SYMBOLS[code] || `${code} ` : "";
  const displayPrefix = prefix ?? symbol;

  const fractionDigits =
    minimumFractionDigits !== undefined
      ? minimumFractionDigits
      : code === "JPY" || hideDecimals || Number.isInteger(safeVal)
      ? 0
      : 2;

  const maxFraction =
    maximumFractionDigits !== undefined ? maximumFractionDigits : fractionDigits;

  return (
    <span className={`inline-flex items-baseline tabular-nums ${className}`}>
      {displayPrefix && (
        <span className="select-none shrink-0 mr-0.5">{displayPrefix}</span>
      )}
      <NumberFlow
        value={safeVal}
        locales="en-US"
        format={{
          notation: compact ? "compact" : "standard",
          minimumFractionDigits: fractionDigits,
          maximumFractionDigits: maxFraction,
        }}
        transformTiming={{ duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        spinTiming={{ duration: 450, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }}
        opacityTiming={{ duration: 250, easing: "ease-out" }}
      />
      {suffix && (
        <span className="select-none shrink-0 ml-0.5">{suffix}</span>
      )}
    </span>
  );
};
