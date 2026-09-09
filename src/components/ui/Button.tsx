"use client";

import React, { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "subtle" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  isActive?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = "subtle",
      size = "md",
      icon,
      iconPosition = "left",
      isActive = false,
      type = "button",
      disabled,
      ...props
    },
    ref
  ) => {
    const isIconOnly = !children && Boolean(icon);

    const sizeClasses = isIconOnly
      ? {
          sm: "w-7 h-7 p-0 rounded-full",
          md: "w-8 h-8 p-0 rounded-full",
          lg: "w-9 h-9 p-0 rounded-full",
        }[size]
      : {
          sm: "h-7 px-3 text-[11px] gap-1.5 rounded-full",
          md: "h-8 px-3.5 text-xs gap-1.5 rounded-full",
          lg: "h-9 px-4 text-xs gap-2 rounded-full",
        }[size];

    const variantClasses = {
      default: "bg-brand-primary text-background hover:opacity-90 shadow-xs font-medium",
      subtle: isActive
        ? "bg-surface-subtle border-border-hover text-brand-primary border shadow-xs font-medium"
        : "bg-surface-base border-border-default text-brand-secondary hover:text-brand-primary hover:bg-surface-subtle border shadow-xs font-medium",
      outline: isActive
        ? "border-brand-primary bg-surface-subtle text-brand-primary border font-medium shadow-xs"
        : "border-border-default hover:border-border-hover hover:bg-surface-subtle/50 text-brand-muted hover:text-brand-primary border font-medium shadow-xs",
      ghost: isActive
        ? "bg-surface-subtle text-brand-primary font-medium"
        : "hover:bg-surface-subtle text-brand-muted hover:text-brand-primary font-medium",
    }[variant];

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all select-none cursor-pointer whitespace-nowrap shrink-0 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]",
          sizeClasses,
          variantClasses,
          className
        )}
        {...props}
      >
        {icon && iconPosition === "left" && <span className="shrink-0 flex items-center">{icon}</span>}
        {children && <span>{children}</span>}
        {icon && iconPosition === "right" && <span className="shrink-0 flex items-center">{icon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";
