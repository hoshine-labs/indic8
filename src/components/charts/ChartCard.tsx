"use client";

import React from "react";

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

/**
 * Standard Unified Chart Card Container
 * Outer Radius Math: 24px (mobile) / 28px (desktop)
 * Outer Padding: 14px (mobile) / 16px (desktop)
 */
export const ChartCard = React.forwardRef<HTMLDivElement, ChartCardProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[24px] sm:rounded-[28px] border border-border-default bg-surface-base p-3.5 sm:p-4 space-y-2.5 shadow-sm ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChartCard.displayName = "ChartCard";

/**
 * Standard Unified Chart Sub-Container (e.g. Side Leaderboards, Legend Panels, Preview Boxes)
 * Concentric Radius Math: R_sub = R_outer - Padding = 28px - 16px = 12px (desktop) / 24px - 14px = 10px (mobile)
 * Padding: 10px (mobile) / 12px (desktop)
 */
export interface ChartSubContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

export const ChartSubContainer = React.forwardRef<HTMLDivElement, ChartSubContainerProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[10px] sm:rounded-[12px] bg-surface-subtle border border-border-default/60 p-2.5 sm:p-3 ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChartSubContainer.displayName = "ChartSubContainer";

/**
 * Standard Unified Sub-Container Item / Row
 * Concentric Radius Math: R_item = R_sub - Sub_Padding = 12px - 6px = 6px (desktop)
 */
export interface ChartSubItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  isActive?: boolean;
}

export const ChartSubItem = React.forwardRef<HTMLDivElement, ChartSubItemProps>(
  ({ children, className = "", isActive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`rounded-[6px] sm:rounded-[8px] p-2 transition-colors cursor-pointer ${
          isActive
            ? "bg-surface-base border border-accent-primary shadow-xs"
            : "bg-surface-subtle/50 border border-transparent hover:bg-surface-base hover:border-border-default"
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);
ChartSubItem.displayName = "ChartSubItem";
