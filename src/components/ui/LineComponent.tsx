import React from "react";

export function SmartBorder({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`border border-border-default rounded-xl ${className}`}
    >
      {children}
    </div>
  );
}

export function AnimatedShimmerLine({
  className = "",
  direction = "horizontal",
}: {
  className?: string;
  direction?: "horizontal" | "vertical";
}) {
  if (direction === "vertical") {
    return (
      <div className={`relative w-[1px] h-full bg-border-default overflow-hidden ${className}`}>
        <div className="absolute inset-y-0 w-full bg-gradient-to-b from-transparent via-brand-primary/40 to-transparent dark:via-white/30 animate-shimmer-core" />
      </div>
    );
  }

  return (
    <div className={`relative h-[1px] w-full bg-border-default overflow-hidden ${className}`}>
      <div className="absolute inset-x-0 h-full bg-gradient-to-r from-transparent via-brand-primary/40 to-transparent dark:via-white/30 animate-shimmer-core" />
    </div>
  );
}

export function ConveyorLine({
  className = "",
}: {
  className?: string;
}) {
  return (
    <svg className={`w-full h-[1px] overflow-hidden ${className}`}>
      <line
        x1="0"
        y1="0.5"
        x2="100%"
        y2="0.5"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 4"
        className="text-border-default dark:text-border-default stroke-current animate-flow-conveyor"
      />
    </svg>
  );
}
