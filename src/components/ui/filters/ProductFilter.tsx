"use client";

import React, { useMemo } from "react";
import { CubeIcon } from "@heroicons/react/20/solid";
import { UnifiedProduct } from "@/lib/domain/types";
import { Dropdown, DropdownOption } from "../Dropdown";

export interface ProductFilterProps {
  products: UnifiedProduct[];
  selectedId: string | "ALL";
  onChange: (id: string | "ALL") => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ProductFilter: React.FC<ProductFilterProps> = ({
  products,
  selectedId,
  onChange,
  className = "",
  size = "md",
}) => {
  const options: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      {
        id: "ALL",
        label: "All Products",
        badge: products.length > 0 ? products.length : undefined,
      },
    ];

    products.forEach((p) => {
      list.push({
        id: p.id,
        label: p.name,
        sublabel: p.channels?.[0]?.providerId,
        divider: list.length === 1,
      });
    });

    return list;
  }, [products]);

  return (
    <Dropdown
      options={options}
      value={selectedId}
      onChange={(id) => onChange(id)}
      icon={CubeIcon}
      searchable={products.length > 5}
      searchPlaceholder="Filter products..."
      size={size}
      className={className}
      width="220px"
    />
  );
};
