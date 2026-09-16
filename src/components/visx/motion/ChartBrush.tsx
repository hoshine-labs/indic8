"use client";

import React from "react";
import { ChartBrushOverlay } from "../ui/ChartBrushOverlay";
import { VisxBrushProps, ChartConfig, VisxBrushRange } from "../types";

export interface ChartBrushComponentProps extends VisxBrushProps {
  data?: Record<string, any>[];
  dataKeys?: string[];
  xDataKey?: string;
  config?: ChartConfig;
  range?: VisxBrushRange;
}

export const ChartBrush: React.FC<ChartBrushComponentProps> = (props) => {
  return <ChartBrushOverlay {...(props as any)} />;
};

ChartBrush.displayName = "AreaChart.Brush";
