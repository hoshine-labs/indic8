import React from "react";

export interface ChartConfigItem {
  label?: React.ReactNode;
  icon?: React.ComponentType;
  color?: string;
  colors?: {
    light?: string[];
    dark?: string[];
  };
  theme?: Record<string, string>;
}

export type ChartConfig = Record<string, ChartConfigItem>;

export interface VisxBrushRange {
  startIndex: number;
  endIndex: number;
}

export interface Margin {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface VisxGridProps {
  show?: boolean;
  strokeDasharray?: string;
  vertical?: boolean;
  horizontal?: boolean;
  className?: string;
}

export interface VisxXAxisProps {
  dataKey?: string;
  tickLine?: boolean;
  axisLine?: boolean;
  tickMargin?: number;
  minTickGap?: number;
  numTicks?: number;
  tickFormatter?: (value: unknown, index?: number) => string;
  className?: string;
  hide?: boolean;
}

export interface VisxYAxisProps {
  dataKey?: string;
  tickLine?: boolean;
  axisLine?: boolean;
  tickMargin?: number;
  numTicks?: number;
  tickFormatter?: (value: unknown) => string;
  className?: string;
  hide?: boolean;
  width?: number;
}

export interface VisxLegendProps {
  isClickable?: boolean;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

export interface VisxTooltipProps {
  formatter?: (value: any, name?: string, item?: any, index?: number, payload?: any) => React.ReactNode;
  indicator?: "dot" | "line" | "dashed";
  className?: string;
  forceLight?: boolean;
}

export interface VisxBrushProps {
  height?: number;
  minSpan?: number;
  formatLabel?: (value: unknown, index: number) => string;
  onChange?: (range: VisxBrushRange) => void;
  className?: string;
}

export interface VisxAreaSeriesProps {
  dataKey: string;
  variant?: "gradient" | "gradient-reverse" | "solid" | "lines";
  strokeVariant?: "solid" | "dashed";
  strokeWidth?: number;
  name?: string;
  curveType?: "linear" | "monotone" | "step" | "natural" | "basis";
  color?: string;
  fillOpacity?: number;
}

export interface VisxAreaChartProps {
  data: Record<string, any>[];
  config: ChartConfig;
  className?: string;
  curveType?: "linear" | "monotone" | "step" | "natural" | "basis";
  xDataKey?: string;
  height?: number | string;
  children?: React.ReactNode;
  margin?: Margin;
  interactive?: boolean;
  staticIndex?: number;
  id?: string;
  forceLight?: boolean;
}

export interface VisxPieSliceProps {
  isClickable?: boolean;
  innerRadius?: number | string;
  outerRadius?: number | string;
  paddingAngle?: number;
  cornerRadius?: number;
  showLabels?: boolean;
}

export interface VisxPieChartProps {
  data: any[];
  dataKey: string;
  nameKey: string;
  config?: ChartConfig;
  className?: string;
  style?: React.CSSProperties;
  height?: number | string;
  children?: React.ReactNode;
  valueFormatter?: (val: number) => string;
  onSliceClick?: (item: any, index: number) => void;
  activeIndex?: number | null;
  onActiveIndexChange?: (index: number | null) => void;
}
