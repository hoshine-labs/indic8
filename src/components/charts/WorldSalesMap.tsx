"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from "react";
import "jsvectormap/dist/jsvectormap.css";
import { formatCurrencyAmount } from "@/lib/currency";
import { CurrencyCode } from "@/lib/types";
import { useTheme } from "@/context/ThemeContext";
import { PlusIcon, MinusIcon, XMarkIcon } from "@heroicons/react/20/solid";
import { NumberFlowAmount } from "@/components/ui";

export interface GeoProductBreakdown {
  count: number;
  revenueNorm: number;
}

export interface GeoDataPoint {
  revenueNorm: number;
  ordersCount: number;
  products: Record<string, GeoProductBreakdown | number>;
}

export interface WorldSalesMapRef {
  focusCountry: (countryCode: string) => void;
}

export interface WorldSalesMapProps {
  geoData: Record<string, GeoDataPoint>;
  targetCurrency?: CurrencyCode;
  height?: number;
  selectedCountry?: string | null;
  onSelectCountry?: (code: string | null) => void;
}

function getCountryName(code: string): string {
  try {
    const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
    return regionNames.of(code.toUpperCase()) || code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

function getThemeCountryColor(
  count: number,
  maxCount: number,
  tokens: any,
  isDark: boolean
): string {
  const baseFill = tokens?.surface?.subtle || (isDark ? "#18181f" : "#f1f5f9");
  if (count <= 0) return baseFill;

  const accent = tokens?.accent?.primary || (isDark ? "#6366f1" : "#4f46e5");
  const bright = tokens?.accent?.bright || accent;
  if (maxCount <= 1) return isDark ? bright : accent;

  const ratio = count / maxCount;
  if (ratio <= 0.25) {
    return `color-mix(in srgb, ${accent} 28%, ${baseFill})`;
  }
  if (ratio <= 0.5) {
    return `color-mix(in srgb, ${accent} 52%, ${baseFill})`;
  }
  if (ratio <= 0.75) {
    return `color-mix(in srgb, ${accent} 78%, ${baseFill})`;
  }
  return isDark ? bright : accent;
}

export const WorldSalesMap = forwardRef<WorldSalesMapRef, WorldSalesMapProps>(({
  geoData,
  targetCurrency = "USD",
  height = 340,
  selectedCountry,
  onSelectCountry,
}, ref) => {
  const { isDark, tokens } = useTheme();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [pinnedCountryCode, setPinnedCountryCode] = useState<string | null>(selectedCountry || null);
  const [hoveredCountryCode, setHoveredCountryCode] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Sync external selectedCountry with internal pinned state
  useEffect(() => {
    if (selectedCountry !== undefined) {
      setPinnedCountryCode(selectedCountry);
    }
  }, [selectedCountry]);

  // Clean up any stray jvm-tooltip nodes in document.body
  useEffect(() => {
    const removeStrayTooltips = () => {
      document.querySelectorAll(".jvm-tooltip").forEach((el) => el.remove());
    };
    removeStrayTooltips();
    return removeStrayTooltips;
  }, []);

  const focusOnCountry = useCallback((code: string) => {
    const map = mapInstanceRef.current;
    const upper = code.toUpperCase();
    setPinnedCountryCode(upper);
    setHoveredCountryCode(null);
    if (onSelectCountry) onSelectCountry(upper);

    if (map) {
      try {
        if (typeof map.setFocus === "function") {
          map.setFocus({
            region: upper,
            animate: true,
            scale: 3.5,
          });
        }
      } catch {}
    }
  }, [onSelectCountry]);

  useImperativeHandle(ref, () => ({
    focusCountry: (code: string) => {
      focusOnCountry(code);
    },
  }), [focusOnCountry]);

  // Handle click outside to close pinned country tooltip
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setPinnedCountryCode(null);
        if (onSelectCountry) onSelectCountry(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onSelectCountry]);

  // Track mouse coordinates within the map wrapper for React hover tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (pinnedCountryCode) return;
    if (wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect();
      setMousePos({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    }
  };

  const handleMouseLeaveWrapper = () => {
    setHoveredCountryCode(null);
    setMousePos(null);
  };

  useEffect(() => {
    let isCancelled = false;

    async function loadMap() {
      try {
        const jsVectorMapModule = await import("jsvectormap");
        const jsVectorMap = jsVectorMapModule.default || jsVectorMapModule;

        await import("jsvectormap/dist/maps/world-merc.js");

        if (isCancelled || !mapContainerRef.current) return;

        mapContainerRef.current.innerHTML = "";

        const baseFill = tokens?.surface?.subtle || (isDark ? "#18181f" : "#f1f5f9");
        const baseStroke = isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)";
        const hoverStroke = tokens?.brand?.primary || (isDark ? "#ffffff" : "#0f172a");

        const map = new (jsVectorMap as any)({
          selector: mapContainerRef.current,
          map: "world_merc",
          zoomButtons: false,
          showTooltip: false, // Managed via React tooltip
          zoomOnScroll: true,
          zoomOnScrollSpeed: 0.18,
          zoomMax: 16,
          zoomMin: 1,
          zoomStep: 1.35,
          draggable: true,
          regionStyle: {
            initial: {
              fill: baseFill,
              fillOpacity: 1,
              stroke: baseStroke,
              strokeWidth: 0.5,
              strokeOpacity: 1,
            },
            // On hover: thin 1px crisp border, zero fill change, no glow
            hover: {
              stroke: hoverStroke,
              strokeWidth: 1.0,
              strokeOpacity: 1,
              cursor: "pointer",
            },
            selected: {
              stroke: hoverStroke,
              strokeWidth: 1.2,
              strokeOpacity: 1,
            },
          },
          onRegionOver(event: any, code: string) {
            const upper = code.toUpperCase();
            setHoveredCountryCode(upper);
          },
          onRegionOut(event: any, code: string) {
            setHoveredCountryCode(null);
          },
          onRegionClick(event: any, code: string) {
            const upper = code.toUpperCase();
            setHoveredCountryCode(null);
            setPinnedCountryCode((prev) => (prev === upper ? null : upper));
            if (onSelectCountry) {
              onSelectCountry(upper === pinnedCountryCode ? null : upper);
            }
          },
          onRegionSelected() {},
          onRegionTooltipShow(event: any, tooltip: any, code: string) {
            if (event?.preventDefault) event.preventDefault();
            const upper = code.toUpperCase();
            setHoveredCountryCode(upper);
          },
        });

        if (isCancelled) {
          map.destroy();
          return;
        }

        mapInstanceRef.current = map;

        // Apply theme-driven sales scale and lock hover fill to keep color constant on hover
        if (map.regions) {
          const maxOrders = Math.max(
            1,
            ...Object.values(geoData).map((d) => d.ordersCount || 0)
          );

          Object.entries(map.regions).forEach(([code, region]: [string, any]) => {
            const upper = code.toUpperCase();
            const data = geoData[upper] || geoData[code];
            const count = data?.ordersCount || 0;
            const color = getThemeCountryColor(count, maxOrders, tokens, isDark);

            if (region && region.element) {
              if (region.element.config) {
                region.element.config.style = region.element.config.style || {};
                region.element.config.style.initial = {
                  ...(region.element.config.style.initial || {}),
                  fill: color,
                  stroke: baseStroke,
                  strokeWidth: 0.5,
                };
                region.element.config.style.hover = {
                  ...(region.element.config.style.hover || {}),
                  fill: color, // EXACT same fill so color NEVER changes on hover
                  stroke: hoverStroke, // Thin crisp contrasting theme border
                  strokeWidth: 1.0,
                };
                region.element.config.style.selected = {
                  ...(region.element.config.style.selected || {}),
                  fill: color,
                  stroke: hoverStroke,
                  strokeWidth: 1.2,
                };
              }
              region.element.setStyle({
                fill: color,
                stroke: baseStroke,
                strokeWidth: 0.5,
              });
            }
          });
        }
      } catch (err) {
        console.warn("[WorldSalesMap] Initialization deferred:", err);
      }
    }

    loadMap();

    return () => {
      isCancelled = true;
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.destroy();
        } catch {}
      }
    };
  }, [geoData, isDark, tokens, targetCurrency, onSelectCountry]);

  const handleZoom = (type: "in" | "out") => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const isZoomIn = type === "in";
    const zoomStep = map.params?.zoomStep || 1.35;
    const currentScale = map.scale || 1;
    const nextScale = isZoomIn ? currentScale * zoomStep : currentScale / zoomStep;
    const width = map._width || map.container?.offsetWidth || 500;
    const height = map._height || map.container?.offsetHeight || 320;

    if (typeof map._setScale === "function") {
      map._setScale(nextScale, width / 2, height / 2, false, true);
    } else if (typeof map.setScale === "function") {
      map.setScale(nextScale, width / 2, height / 2, true);
    }
  };

  // Pinned country data
  const pinnedData = pinnedCountryCode ? geoData[pinnedCountryCode] : null;
  const pinnedCountryName = pinnedCountryCode ? getCountryName(pinnedCountryCode) : "";

  // Hovered country data
  const hoveredData = hoveredCountryCode && !pinnedCountryCode ? geoData[hoveredCountryCode] : null;
  const hoveredCountryName = hoveredCountryCode ? getCountryName(hoveredCountryCode) : "";

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeaveWrapper}
      className="relative w-full overflow-hidden rounded-xl bg-surface-subtle border border-border-default select-none"
      style={{ height }}
    >
      {/* Zoom Controls */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 rounded-full bg-surface-base p-1 border border-border-default">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoom("in");
          }}
          title="Zoom In"
          className="w-7 h-7 rounded-full bg-surface-subtle hover:bg-surface-base text-brand-primary flex items-center justify-center transition cursor-pointer active:scale-90 border border-border-default/50"
        >
          <PlusIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleZoom("out");
          }}
          title="Zoom Out"
          className="w-7 h-7 rounded-full bg-surface-subtle hover:bg-surface-base text-brand-primary flex items-center justify-center transition cursor-pointer active:scale-90 border border-border-default/50"
        >
          <MinusIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating React Hover Tooltip */}
      {hoveredCountryCode && !pinnedCountryCode && mousePos && (
        <div
          className="pointer-events-none absolute z-30 transition-transform duration-75 ease-out"
          style={{
            left: Math.min(mousePos.x + 12, (wrapperRef.current?.clientWidth || 500) - 230),
            top: Math.max(8, Math.min(mousePos.y - 35, (wrapperRef.current?.clientHeight || 340) - 110)),
          }}
        >
          <div className="bg-surface-base border border-border-default rounded-lg px-2.5 py-2 min-w-[170px] max-w-[230px] space-y-1 animate-in fade-in duration-100 text-xs shadow-md">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <img
                  src={`https://flagcdn.com/24x18/${hoveredCountryCode.toLowerCase()}.png`}
                  width={16}
                  height={12}
                  alt={hoveredCountryCode}
                  className="rounded-xs shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
                <span className="font-semibold text-xs text-brand-primary truncate">{hoveredCountryName}</span>
              </div>
              <span className="text-[10px] font-mono uppercase bg-surface-subtle px-1 py-0.5 rounded text-brand-muted shrink-0">
                {hoveredCountryCode}
              </span>
            </div>

            {hoveredData && hoveredData.ordersCount > 0 ? (
              <div className="flex items-center justify-between gap-4 pt-1 border-t border-border-default/50 text-xs font-mono">
                <div>
                  <div className="text-[9px] uppercase text-brand-muted">Orders</div>
                  <div className="font-semibold text-brand-primary">
                    {hoveredData.ordersCount} {hoveredData.ordersCount === 1 ? "order" : "orders"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] uppercase text-brand-muted">Revenue</div>
                  <div className="font-semibold text-brand-primary">
                    {formatCurrencyAmount(hoveredData.revenueNorm, targetCurrency)}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-[11px] text-brand-muted">No checkouts recorded</div>
            )}
          </div>
        </div>
      )}

      {/* Pinned Country Interactive Card Overlay */}
      {pinnedCountryCode && (
        <div
          onMouseLeave={() => {
            setPinnedCountryCode(null);
            if (onSelectCountry) onSelectCountry(null);
          }}
          className="absolute top-3 right-3 z-30 w-72 sm:w-80 p-3 rounded-xl bg-surface-base border border-border-default animate-in fade-in duration-150 shadow-lg"
        >
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-default/60">
            <div className="flex items-center gap-2 min-w-0">
              <img
                src={`https://flagcdn.com/24x18/${pinnedCountryCode.toLowerCase()}.png`}
                width={18}
                height={13}
                alt={pinnedCountryCode}
                className="rounded-xs object-cover shrink-0"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
              <span className="font-semibold text-sm text-brand-primary truncate">{pinnedCountryName}</span>
              <span className="text-[10px] font-mono uppercase bg-surface-subtle px-1.5 py-0.5 rounded text-brand-muted shrink-0">
                {pinnedCountryCode}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setPinnedCountryCode(null);
                if (onSelectCountry) onSelectCountry(null);
              }}
              className="w-5 h-5 rounded-full bg-surface-subtle hover:bg-surface-hover text-brand-secondary hover:text-brand-primary flex items-center justify-center transition cursor-pointer"
              title="Close"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {pinnedData && pinnedData.ordersCount > 0 ? (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2 bg-surface-subtle p-2 rounded-lg border border-border-default/50">
                <div>
                  <span className="text-[9px] uppercase font-mono text-brand-muted block">Completed Orders</span>
                  <span className="text-xs font-semibold text-brand-primary font-mono">
                    <NumberFlowAmount value={pinnedData.ordersCount} />
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[9px] uppercase font-mono text-brand-muted block">Gross Revenue</span>
                  <span className="text-xs font-semibold text-brand-primary font-mono">
                    <NumberFlowAmount value={pinnedData.revenueNorm} currency={targetCurrency} />
                  </span>
                </div>
              </div>

              {/* Products List Breakdown */}
              <div>
                <span className="text-[10px] font-mono uppercase text-brand-muted block mb-1 tracking-wider">
                  Products ({Object.keys(pinnedData.products || {}).length})
                </span>
                <div className="space-y-1 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                  {Object.entries(pinnedData.products || {})
                    .map(([name, data]) => {
                      const count = typeof data === "number" ? data : data.count;
                      const rev = typeof data === "number" ? 0 : data.revenueNorm;
                      return { name, count, rev };
                    })
                    .sort((a, b) => b.count - a.count)
                    .map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-xs p-1.5 rounded-lg bg-surface-base border border-border-default/40"
                      >
                        <span className="truncate text-brand-primary font-medium pr-2">{p.name}</span>
                        <div className="flex items-center gap-2 font-mono text-right shrink-0">
                          <span className="text-brand-muted">{p.count}x</span>
                          <span className="font-semibold text-brand-primary">
                            <NumberFlowAmount value={p.rev} currency={targetCurrency} />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-3 text-center text-xs text-brand-muted">
              No orders registered in {pinnedCountryName} yet.
            </div>
          )}
        </div>
      )}

      {/* Embedded Vector Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
});

WorldSalesMap.displayName = "WorldSalesMap";
