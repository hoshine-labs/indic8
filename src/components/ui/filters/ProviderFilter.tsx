"use client";

import React, { useMemo } from "react";
import { CreditCardIcon } from "@heroicons/react/20/solid";
import { ProviderConnection, ProviderId } from "@/lib/domain/types";
import { BrandIcon } from "@/lib/brandLogos";
import { Dropdown, DropdownOption } from "../Dropdown";

export interface ProviderFilterProps {
  connections: ProviderConnection[];
  selectedProvider: ProviderId | "ALL";
  onChange: (provider: ProviderId | "ALL") => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ProviderFilter: React.FC<ProviderFilterProps> = ({
  connections,
  selectedProvider,
  onChange,
  className = "",
  size = "md",
}) => {
  const options: DropdownOption[] = useMemo(() => {
    const list: DropdownOption[] = [
      {
        id: "ALL",
        label: "All Gateways",
        icon: <CreditCardIcon className="w-3.5 h-3.5 text-brand-secondary" />,
        badge: connections.length > 0 ? connections.length : undefined,
      },
    ];

    connections.forEach((c) => {
      list.push({
        id: c.providerId,
        label: c.accountName || c.providerId,
        sublabel: c.providerId,
        icon: <BrandIcon provider={c.providerId} className="w-3.5 h-3.5 shrink-0" colored={true} />,
        divider: list.length === 1,
      });
    });

    return list;
  }, [connections]);

  return (
    <Dropdown
      options={options}
      value={selectedProvider}
      onChange={(id) => onChange(id as ProviderId | "ALL")}
      size={size}
      className={className}
      width="220px"
    />
  );
};
