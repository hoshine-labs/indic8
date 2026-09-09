"use client";

import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = "md",
  className = "",
}) => {
  const pixelSize = size === "sm" ? 32 : size === "lg" ? 64 : 48;
  const strokeWidth = size === "sm" ? 4 : size === "lg" ? 6 : 5;

  return (
    <div className={`w-full h-full min-h-[50vh] flex items-center justify-center select-none ${className}`}>
      <div
        className="m3-loader"
        role="progressbar"
        aria-label="Loading"
        style={{
          "--m3-size": `${pixelSize}px`,
          "--m3-stroke-width": `${strokeWidth}px`,
        } as React.CSSProperties}
      >
        <svg viewBox="0 0 48 48">
          {/* Inactive complementary arc */}
          <circle className="m3-arc m3-arc-track" cx="24" cy="24" r="20" />
          {/* Active primary arc */}
          <circle className="m3-arc m3-arc-active" cx="24" cy="24" r="20" />
        </svg>
      </div>
    </div>
  );
};
