"use client";

import React from "react";
import { DateRangeFilter } from "./DateRangeFilter";
import { ProductFilter } from "./ProductFilter";
import { ProviderFilter } from "./ProviderFilter";
import { FilterPopover, AdvancedFilterValues } from "./FilterPopover";
import { TimeRangeOption, UnifiedProduct, ProviderConnection, ProviderId } from "@/lib/domain/types";

export interface FilterBarProps {
  range: TimeRangeOption;
  onRangeChange: (range: TimeRangeOption) => void;
  products?: UnifiedProduct[];
  selectedProduct?: string | "ALL";
  onProductChange?: (productId: string | "ALL") => void;
  connections?: ProviderConnection[];
  selectedProvider?: ProviderId | "ALL";
  onProviderChange?: (providerId: ProviderId | "ALL") => void;
  advancedFilters?: AdvancedFilterValues;
  onAdvancedFilterChange?: (filters: AdvancedFilterValues) => void;
  onResetAdvanced?: () => void;
  className?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  range,
  onRangeChange,
  products = [],
  selectedProduct = "ALL",
  onProductChange,
  connections = [],
  selectedProvider = "ALL",
  onProviderChange,
  advancedFilters,
  onAdvancedFilterChange,
  onResetAdvanced,
  className = "",
}) => {
  return (
    <div className={`flex items-center gap-2 flex-wrap ${className}`}>
      <DateRangeFilter value={range} onChange={onRangeChange} />

      {products.length > 0 && onProductChange && (
        <ProductFilter
          products={products}
          selectedId={selectedProduct}
          onChange={onProductChange}
        />
      )}

      {connections.length > 0 && onProviderChange && (
        <ProviderFilter
          connections={connections}
          selectedProvider={selectedProvider}
          onChange={onProviderChange}
        />
      )}

      {advancedFilters && onAdvancedFilterChange && onResetAdvanced && (
        <FilterPopover
          filters={advancedFilters}
          onChange={onAdvancedFilterChange}
          onReset={onResetAdvanced}
        />
      )}
    </div>
  );
};
