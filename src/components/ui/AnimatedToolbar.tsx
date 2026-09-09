"use client";

import { useState, useId } from "react";
import { motion } from "framer-motion";

export interface ToolbarItem {
  id: string;
  icon: React.ReactNode;
  label?: string;
  colorClass?: string;
  onClick?: () => void;
  isSeparator?: boolean;
}

interface AnimatedToolbarProps {
  items: ToolbarItem[];
  className?: string;
  onMouseLeave?: () => void;
}

export function AnimatedToolbar({
  items,
  className = "",
  onMouseLeave,
}: AnimatedToolbarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const groupId = useId();

  return (
    <div
      className={`relative flex items-center bg-surface-base border border-border-default rounded-lg shadow-xs p-1 pointer-events-auto cursor-pointer isolate ${className}`}
      onMouseLeave={() => {
        setHoveredId(null);
        if (onMouseLeave) onMouseLeave();
      }}
    >
      {items.map((item) => (
        <div key={item.id} className="flex items-center">
          {item.isSeparator ? (
            <div className="w-[1px] h-4 bg-border-default mx-1" />
          ) : (
            <button
              onMouseEnter={() => setHoveredId(item.id)}
              onClick={item.onClick}
              title={item.label}
              className={`relative p-1.5 px-2 rounded-md ${
                item.colorClass || "text-brand-secondary hover:text-brand-primary"
              } transition-colors cursor-pointer`}
            >
              {hoveredId === item.id && (
                <motion.div
                  layoutId={`toolbar-ghost-${groupId}`}
                  className="absolute inset-0 bg-surface-ghost rounded-md z-0"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.4 }}
                />
              )}
              <span className="relative z-20 isolate flex">{item.icon}</span>
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
