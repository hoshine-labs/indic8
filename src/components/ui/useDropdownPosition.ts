"use client";

import { useState, useEffect, RefObject } from "react";

export interface DropdownPosition {
  align: "left" | "right";
  vertical: "bottom" | "top";
  style: React.CSSProperties;
}

export function useDropdownPosition(
  triggerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
  estimatedWidth = 220,
  estimatedHeight = 280
): DropdownPosition {
  const [position, setPosition] = useState<DropdownPosition>({
    align: "left",
    vertical: "bottom",
    style: {},
  });

  useEffect(() => {
    if (!isOpen || !triggerRef.current || typeof window === "undefined") return;

    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const padding = 12;

    // Check horizontal space
    const spaceOnRight = vw - rect.left;
    const spaceOnLeft = rect.right;

    let align: "left" | "right" = "left";
    if (spaceOnRight < estimatedWidth && spaceOnLeft >= estimatedWidth) {
      align = "right";
    }

    // Check vertical space
    const spaceBelow = vh - rect.bottom;
    const spaceAbove = rect.top;

    let vertical: "bottom" | "top" = "bottom";
    if (spaceBelow < estimatedHeight && spaceAbove >= estimatedHeight) {
      vertical = "top";
    }

    // Calculate boundary constraint styles
    const style: React.CSSProperties = {
      maxWidth: `calc(100vw - ${padding * 2}px)`,
      maxHeight: `calc(100vh - ${padding * 2}px)`,
    };

    setPosition({ align, vertical, style });
  }, [isOpen, triggerRef, estimatedWidth, estimatedHeight]);

  return position;
}
