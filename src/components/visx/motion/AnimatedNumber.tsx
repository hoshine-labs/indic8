"use client";

import React from "react";
import NumberFlow, { type Format } from "@number-flow/react";

export interface AnimatedNumberProps {
  value: number;
  format?: Format | ((n: number) => string);
  currency?: string;
  className?: string;
}

export const AnimatedNumber: React.FC<AnimatedNumberProps> = ({
  value,
  format,
  currency,
  className = "",
}) => {
  const safeVal = Math.max(0, isNaN(value) ? 0 : value);

  if (typeof format === "function") {
    // If a custom string format function is passed, format and flow smoothly
    return (
      <span className={`tabular-nums font-semibold ${className}`}>
        {format(safeVal)}
      </span>
    );
  }

  const flowFormat: Format = format || (currency ? {
    style: "currency",
    currency: currency,
    maximumFractionDigits: 2,
  } : {
    maximumFractionDigits: 2,
  });

  return (
    <NumberFlow
      value={safeVal}
      format={flowFormat}
      className={`tabular-nums font-semibold ${className}`}
      willChange
    />
  );
};
