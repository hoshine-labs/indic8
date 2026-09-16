"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useSpring, useTransform } from "framer-motion";
import { useChart } from "../context/ChartContext";

import { cn } from "../utils";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export interface DateLabelToken {
  col1: string;
  col2: string;
  isTime: boolean;
}

export function parseDateLabel(val: unknown): DateLabelToken {
  const str = String(val ?? "").trim();
  if (!str) return { col1: "", col2: "", isTime: false };

  // 1. Time string (e.g. "14:00", "02:00", "2:00 PM")
  if (/^\d{1,2}:\d{2}/.test(str)) {
    return { col1: str, col2: "", isTime: true };
  }

  // 2. Month + 4-digit Year (e.g. "Mar 2026", "2026-03") -> All-time / 12-month views (show only month)
  const monthYearMatch = str.match(/^([a-zA-Z]+)\s+(\d{4})$/);
  if (monthYearMatch) {
    const mStr = monthYearMatch[1];
    const mIdx = MONTHS.findIndex((m) => mStr.toLowerCase().startsWith(m.toLowerCase()));
    return { col1: mIdx >= 0 ? MONTHS[mIdx] : mStr, col2: "", isTime: false };
  }

  // 3. String with month name + day number (e.g. "Mar 14", "Mon, Mar 9", "14 Mar") -> 3m, 30d, 7d
  const parts = str.split(/[\s,-/]+/);
  if (parts.length >= 2) {
    const mIdx = MONTHS.findIndex((m) => parts[0].toLowerCase().startsWith(m.toLowerCase()) || parts[1].toLowerCase().startsWith(m.toLowerCase()));
    if (mIdx >= 0) {
      const dayPart = parts.find((p) => /^\d{1,2}$/.test(p)) || "";
      return { col1: MONTHS[mIdx], col2: dayPart, isTime: false };
    }
  }

  // 4. ISO or standard Date object
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return {
      col1: MONTHS[parsed.getMonth()] || "",
      col2: String(parsed.getDate()),
      isTime: false,
    };
  }

  return { col1: str, col2: "", isTime: false };
}

export interface DateTickerPillProps {
  index: number;
  data: Record<string, any>[];
  xDataKey?: string;
  className?: string;
  monthOnly?: boolean;
  forceLight?: boolean;
}

export const DateTickerPill: React.FC<DateTickerPillProps> = ({
  index,
  data,
  xDataKey = "date",
  className = "",
  monthOnly = true,
  forceLight = false,
}) => {
  const total = data.length;
  if (total === 0) return null;

  const safeIdx = Math.max(0, Math.min(total - 1, index));
  const rawValue = data[safeIdx]?.[xDataKey];
  const token = parseDateLabel(rawValue);
  const labelText = token.col1 || String(rawValue ?? "");

  return (
    <div
      className={cn(
        "h-[22px] px-2.5 flex items-center justify-center rounded-full border shadow-sm pointer-events-none select-none",
        forceLight
          ? "border-slate-300/90 bg-white/95 text-slate-900 shadow-sm"
          : "border-border-default bg-surface-base/90 backdrop-blur-md text-brand-primary shadow-md",
        className
      )}
    >
      <div className="h-[17px] overflow-hidden relative flex items-center justify-center">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={labelText}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{
              duration: 0.18,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={cn(
              "flex items-center justify-center whitespace-nowrap text-xs font-semibold leading-none",
              forceLight ? "text-slate-900" : "text-brand-primary"
            )}
          >
            {labelText}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export interface DateTickerProps {
  className?: string;
  pillWidth?: number;
  forceLight?: boolean;
}

export const DateTicker: React.FC<DateTickerProps> = ({
  className = "",
  pillWidth = 84,
  forceLight: propForceLight,
}) => {
  const {
    springX,
    hoverOpacity,
    activeIndex,
    isHovered,
    data,
    xDataKey,
    margin,
    width,
    forceLight: contextForceLight,
    staticIndex,
  } = useChart();

  const forceLight = propForceLight ?? contextForceLight ?? false;
  const total = data.length;

  const labels = useMemo(() => {
    return data.map((d) => parseDateLabel(d[xDataKey]));
  }, [data, xDataKey]);

  const groups = useMemo(() => {
    const g: { col1: string; startIndex: number }[] = [];
    labels.forEach((l, i) => {
      const last = g[g.length - 1];
      if (!last || last.col1 !== l.col1) {
        g.push({ col1: l.col1, startIndex: i });
      }
    });
    return g;
  }, [labels]);

  const groupIndexFor = (idx: number) => {
    for (let i = groups.length - 1; i >= 0; i--) {
      if (groups[i].startIndex <= idx) return i;
    }
    return 0;
  };

  const daySpring = useSpring(0, { stiffness: 280, damping: 28 });
  const col1Spring = useSpring(0, { stiffness: 280, damping: 28 });

  // Initialize immediately for static index or current active item
  useEffect(() => {
    const targetIdx = staticIndex !== undefined ? staticIndex : Math.round(activeIndex.get() || 0);
    if (total > 0) {
      const idx = Math.max(0, Math.min(total - 1, targetIdx));
      const gi = groupIndexFor(idx);
      const step = forceLight ? -20 : -17;
      daySpring.jump(step * idx);
      col1Spring.jump(step * gi);
    }
  }, [staticIndex, total, activeIndex, forceLight]);

  useEffect(() => {
    const unsubscribe = activeIndex.on("change", (latest) => {
      const idx = Math.max(0, Math.min(total - 1, Math.round(latest)));
      const gi = groupIndexFor(idx);
      const step = forceLight ? -20 : -17;

      if (isHovered.get() === 0) {
        daySpring.jump(step * idx);
        col1Spring.jump(step * gi);
      } else {
        daySpring.set(step * idx);
        col1Spring.set(step * gi);
      }
    });
    return () => unsubscribe();
  }, [activeIndex, total, isHovered, daySpring, col1Spring, forceLight]);

  // Horizontal position glide (clamped within chart bounds)
  const pillHalfWidth = pillWidth / 2;
  const pillX = useTransform(springX, (val) => {
    const center = val + margin.left;
    return Math.min(Math.max(center, pillHalfWidth + 6), width - pillHalfWidth - 6);
  });

  const hasDays = labels.some((l) => Boolean(l.col2));
  const isTimeMode = labels.some((l) => l.isTime);

  if (total === 0) return null;

  return (
    <motion.div
      style={{
        x: pillX,
        opacity: hoverOpacity,
      }}
      className={cn("absolute bottom-0 z-30 pointer-events-none -translate-x-1/2 select-none", className)}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full border shadow-sm",
          forceLight
            ? "h-[28px] px-3.5 border-slate-300/90 bg-white/95 text-slate-900 shadow-md"
            : "h-[22px] px-2.5 border-border-default bg-surface-base/90 backdrop-blur-md shadow-md text-brand-primary"
        )}
      >
        {/* Column 1 (Month or Time) */}
        {groups.length > 0 && (
          <div className={cn("overflow-hidden relative", forceLight ? "h-[20px]" : "h-[17px]")}>
            <motion.div style={{ y: col1Spring }} className="flex flex-col will-change-transform">
              {groups.map((g, i) => (
                <span
                  key={`${g.col1}-${i}`}
                  className={cn(
                    "flex items-center justify-center whitespace-nowrap leading-none",
                    forceLight
                      ? "h-[20px] text-sm text-slate-900 font-semibold"
                      : isTimeMode
                      ? "h-[17px] text-xs text-brand-primary font-bold tracking-tight"
                      : hasDays
                      ? "h-[17px] text-xs text-brand-muted font-medium"
                      : "h-[17px] text-xs text-brand-primary font-semibold"
                  )}
                >
                  {g.col1}
                </span>
              ))}
            </motion.div>
          </div>
        )}

        {/* Column 2 (Day date - only for 3m, 30d, 7d when days are present) */}
        {hasDays && (
          <div className={cn("overflow-hidden relative", forceLight ? "h-[20px]" : "h-[17px]")}>
            <motion.div style={{ y: daySpring }} className="flex flex-col will-change-transform">
              {labels.map((l, i) => (
                <span
                  key={`day-${i}`}
                  className={cn(
                    "flex items-center justify-center whitespace-nowrap leading-none tabular-nums font-semibold",
                    forceLight ? "h-[20px] text-sm text-slate-900" : "h-[17px] text-xs text-brand-primary"
                  )}
                >
                  {l.col2 || ""}
                </span>
              ))}
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

DateTicker.displayName = "AreaChart.DateTicker";
