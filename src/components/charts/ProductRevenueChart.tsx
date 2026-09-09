"use client";

import React from "react";
import { Indic8Chart } from "./Indic8Chart";
import { RevenuePoint, CurrencyCode } from "@/lib/domain/types";

export interface ProductRevenueChartProps {
  data: RevenuePoint[];
  currency?: CurrencyCode;
  height?: number;
}

export const ProductRevenueChart: React.FC<ProductRevenueChartProps> = ({
  data,
  currency = "USD",
  height = 180,
}) => {
  return <Indic8Chart data={data} currency={currency} height={height} showGrid={true} />;
};
