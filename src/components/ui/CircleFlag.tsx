"use client";

import React, { useState } from "react";

interface CircleFlagProps {
  countryCode: string;
  className?: string;
  size?: number;
  alt?: string;
}

export const CircleFlag: React.FC<CircleFlagProps> = ({
  countryCode,
  className = "",
  size = 16,
  alt,
}) => {
  const [hasError, setHasError] = useState(false);
  const code = (countryCode || "us").trim().toLowerCase();
  const flagUrl = `https://kapowaz.github.io/circle-flags/flags/${code}.svg`;

  if (hasError || !countryCode) {
    return (
      <span
        className={`inline-flex items-center justify-center rounded-full bg-surface-subtle border border-border-default/60 font-mono text-[9px] text-brand-muted shrink-0 ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
      >
        {code.toUpperCase().slice(0, 2)}
      </span>
    );
  }

  return (
    <img
      src={flagUrl}
      alt={alt || `${code.toUpperCase()} flag`}
      width={size}
      height={size}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
      onError={() => setHasError(true)}
      className={`rounded-full object-cover shrink-0 select-none block ${className}`}
      loading="lazy"
    />
  );
};
