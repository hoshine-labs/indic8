"use client";

import React, { useRef } from "react";
import { useDropdownPosition } from "./useDropdownPosition";

interface PopoverPositionerProps {
  isOpen: boolean;
  triggerRef: React.RefObject<HTMLElement | null>;
  children: React.ReactNode;
  className?: string;
  width?: number;
  height?: number;
}

export const PopoverPositioner: React.FC<PopoverPositionerProps> = ({
  isOpen,
  triggerRef,
  children,
  className = "",
  width = 220,
  height = 260,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const { align, vertical, style } = useDropdownPosition(triggerRef, isOpen, width, height);

  if (!isOpen) return null;

  const verticalClass = vertical === "top" ? "bottom-full mb-1.5" : "top-full mt-1.5";
  const horizontalClass = align === "right" ? "right-0" : "left-0";

  return (
    <div
      ref={popoverRef}
      style={style}
      className={`absolute z-40 ${verticalClass} ${horizontalClass} ${className}`}
    >
      {children}
    </div>
  );
};
