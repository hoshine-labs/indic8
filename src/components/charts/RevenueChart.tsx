"use client";

import React from "react";
import { Indic8Chart } from "./Indic8Chart";
import { RevenuePoint, TimeRangeOption } from "@/lib/domain/types";

export interface RevenueChartProps {
  data: RevenuePoint[];
  range?: TimeRangeOption | string;
  currency?: string;
  height?: number;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({
  data,
  currency = "USD",
  height = 200,
}) => {
  return (
    <div className="w-full">
      <Indic8Chart data={data} currency={currency} height={height} />
    </div>
  );
};
