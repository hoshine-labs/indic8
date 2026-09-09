import React from "react";

export type LogoVariant = "icon" | "text" | "full";

export interface LogoProps {
  variant?: LogoVariant;
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  size?: number;
}

export function Logo({
  variant = "full",
  className = "",
  iconClassName = "",
  textClassName = "",
  size = 18,
}: LogoProps) {
  const Icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${iconClassName}`}
    >
      <rect width="32" height="32" rx="8" fill="currentColor" fillOpacity="0.12" />
      <path
        d="M10 9H13.5V23H10V9Z"
        fill="currentColor"
      />
      <circle cx="19.5" cy="12" r="3" stroke="currentColor" strokeWidth="2.2" />
      <circle cx="19.5" cy="20" r="3.5" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );

  const Text = (
    <span
      className={`text-[0.9375rem] font-semibold tracking-tight leading-none pt-[1px] text-brand-primary ${textClassName}`}
    >
      indic8
    </span>
  );

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {Icon}
      </div>
    );
  }

  if (variant === "text") {
    return <div className={`inline-flex items-center ${className}`}>{Text}</div>;
  }

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {Icon}
      {Text}
    </div>
  );
}
