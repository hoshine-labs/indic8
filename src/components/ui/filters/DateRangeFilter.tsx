"use client";

import React from "react";
import { CalendarDaysIcon } from "@heroicons/react/20/solid";
import { TimeRangeOption } from "@/lib/domain/types";
import { Dropdown, DropdownOption } from "../Dropdown";

export interface DateRangeFilterProps {
  value: TimeRangeOption;
  onChange: (range: TimeRangeOption) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
}

const RANGES: DropdownOption[] = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "this_month", label: "This Month" },
  { id: "lifetime", label: "All Time" },
];

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
  value,
  onChange,
  className = "",
  size = "md",
}) => {
  return (
    <Dropdown
      options={RANGES}
      value={value}
      onChange={(id) => onChange(id as TimeRangeOption)}
      icon={CalendarDaysIcon}
      size={size}
      className={className}
      width="180px"
    />
  );
};
