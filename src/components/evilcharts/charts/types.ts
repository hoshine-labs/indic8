import React from "react";

export interface ChartConfigItem {
  label?: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  colors?: {
    light?: string[];
    dark?: string[];
  };
  color?: string;
}

export type ChartConfig = Record<string, ChartConfigItem>;
