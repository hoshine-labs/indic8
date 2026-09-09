import React from "react";

export function Card({
  children,
  className = "",
  onClick,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`bg-surface-base border border-border-default rounded-xl overflow-hidden ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}: {
  children: React.ReactNode;
  variant?: "success" | "danger" | "warning" | "neutral" | "accent" | "verified";
  size?: "sm" | "md";
  className?: string;
}) {
  const variants: Record<string, string> = {
    success: "bg-status-success-light text-status-success",
    danger: "bg-status-danger-subtle text-status-danger",
    warning: "bg-amber-500/10 text-amber-500",
    neutral: "bg-surface-subtle text-brand-muted border border-border-default",
    accent: "bg-status-blue-light text-blue-700",
    verified: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
  };

  const sizeClasses = size === "sm" ? "px-1.5 py-0.2 text-[10px]" : "px-2 py-0.5 text-[0.625rem]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md font-bold uppercase tracking-wider ${sizeClasses} ${variants[variant] || variants.neutral} ${className}`}
    >
      {children}
    </span>
  );
}

export { Logo } from "./Logo";
export type { LogoVariant, LogoProps } from "./Logo";

export { AnimatedTabs } from "./Tabs";
export type { TabOption } from "./Tabs";

export { AnimatedToggle } from "./AnimatedToggle";
export type { AnimatedToggleOption, AnimatedToggleProps } from "./AnimatedToggle";

export { AnimatedToolbar } from "./AnimatedToolbar";
export type { ToolbarItem } from "./AnimatedToolbar";

export { Dropdown } from "./Dropdown";
export type { DropdownOption, DropdownProps } from "./Dropdown";
export { PopoverPositioner } from "./PopoverPositioner";
export { useDropdownPosition } from "./useDropdownPosition";

export { SmartBorder, AnimatedShimmerLine, ConveyorLine } from "./LineComponent";
export { LoadingSpinner } from "./LoadingSpinner";
export type { LoadingSpinnerProps } from "./LoadingSpinner";

export { Button } from "./Button";
export type { ButtonProps } from "./Button";

export { NumberFlowAmount } from "./NumberFlowAmount";
export type { NumberFlowAmountProps } from "./NumberFlowAmount";

