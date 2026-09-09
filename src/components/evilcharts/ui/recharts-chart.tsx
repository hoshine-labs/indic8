"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import { cn } from "./utils";

// Format: { [k in string]: { label?: React.ReactNode; icon?: React.ComponentType; color?: string; colors?: { light?: string[]; dark?: string[] } } }
export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    colors?: {
      light?: string[];
      dark?: string[];
    };
  };
};

export function getColorsCount(configItem?: ChartConfig[string]): number {
  if (!configItem) return 1;
  if (configItem.colors) {
    const l = configItem.colors.light?.length || 0;
    const d = configItem.colors.dark?.length || 0;
    return Math.max(l, d, 1);
  }
  return 1;
}

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />");
  }
  return context;
}

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-slot="chart"
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex w-full h-full justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-layer]:outline-hidden [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-surface]:outline-hidden",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%" debounce={0}>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = "ChartContainer";

export const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, c]) => c.color || c.colors
  );

  if (!colorConfig.length) {
    return null;
  }

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(config)
          .map(([key, item]) => {
            const strokeColor = item.color || item.colors?.light?.[0] || item.colors?.dark?.[0] || "#FF8A3D";
            const lightStops = item.colors?.light || [strokeColor];
            const darkStops = item.colors?.dark || [strokeColor];

            const lightCss = lightStops
              .map((color, i) => `  --color-${key}-${i}: ${color};`)
              .join("\n");
            const darkCss = darkStops
              .map((color, i) => `  --color-${key}-${i}: ${color};`)
              .join("\n");

            return `
[data-chart=${id}] {
${lightCss}
}
.dark [data-chart=${id}] {
${darkCss}
}
`;
          })
          .join("\n"),
      }}
    />
  );
};

export const ChartTooltip = RechartsPrimitive.Tooltip;

export interface ChartTooltipContentProps extends React.ComponentProps<"div"> {
  active?: boolean;
  payload?: Array<{
    dataKey?: string | number;
    name?: string;
    value?: any;
    payload?: any;
    color?: string;
    fill?: string;
    [key: string]: any;
  }>;
  label?: any;
  hideLabel?: boolean;
  hideIndicator?: boolean;
  indicator?: "line" | "dot" | "dashed";
  nameKey?: string;
  labelKey?: string;
  labelFormatter?: (value: any, payload: any) => React.ReactNode;
  labelClassName?: string;
  formatter?: (value: any, name: any, item: any, index: number, payload: any) => React.ReactNode;
  color?: string;
}

export const ChartTooltipContent = React.forwardRef<
  HTMLDivElement,
  ChartTooltipContentProps
>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      formatter,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart();

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) {
        return null;
      }

      const [item] = payload;
      const key = `${labelKey || item.dataKey || item.name || "value"}`;
      const itemConfig = getPayloadConfigFromPayload(config, item, key);
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label;

      if (labelFormatter) {
        return (
          <div className={cn("font-medium text-brand-secondary text-[11px]", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        );
      }

      if (!value) {
        return null;
      }

      return <div className={cn("font-medium text-brand-secondary text-[11px]", labelClassName)}>{value}</div>;
    }, [
      label,
      labelFormatter,
      payload,
      hideLabel,
      labelClassName,
      config,
      labelKey,
    ]);

    if (!active || !payload?.length) {
      return null;
    }

    const nestLabel = payload.length === 1 && indicator !== "dot";

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8.5rem] items-start gap-1.5 rounded-xl border border-border-default bg-surface-base/95 p-2.5 text-xs text-brand-primary shadow-xl backdrop-blur-md z-50",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item, index) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const rawColor = color || itemConfig?.color || itemConfig?.colors?.light?.[0] || item.color || item.payload?.fill;
            const indicatorColor =
              typeof rawColor === "string" && !rawColor.startsWith("url(")
                ? rawColor
                : `var(--color-${item.dataKey || key}-0, #FF8A3D)`;

            return (
              <div
                key={item.dataKey || index}
                className={cn(
                  "flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-brand-muted",
                  indicator === "dot" && "items-center"
                )}
              >
                {formatter && item?.value !== undefined ? (
                  <div className="flex w-full items-center gap-2">
                    {!hideIndicator && (
                      <div
                        className="shrink-0 h-2 w-2 rounded-full"
                        style={{ backgroundColor: indicatorColor }}
                      />
                    )}
                    <div className="flex-1">
                      {formatter(item.value, item.name || item.dataKey, item, index, item.payload)}
                    </div>
                  </div>
                ) : (
                  <>
                    {itemConfig?.icon ? (
                      <itemConfig.icon />
                    ) : (
                      !hideIndicator && (
                        <div
                          className={cn(
                            "shrink-0 rounded-full",
                            {
                              "h-2 w-2": indicator === "dot",
                              "w-1 h-3": indicator === "line",
                              "w-0 border-[1.5px] border-dashed bg-transparent":
                                indicator === "dashed",
                              "my-0.5": nestLabel && indicator === "dashed",
                            }
                          )}
                          style={
                            {
                              backgroundColor: indicator === "dashed" ? "transparent" : indicatorColor,
                              borderColor: indicatorColor,
                            }
                          }
                        />
                      )
                    )}
                    <div
                      className={cn(
                        "flex flex-1 justify-between items-center leading-none gap-3",
                        nestLabel ? "items-end" : "items-center"
                      )}
                    >
                      <div className="grid gap-1">
                        {nestLabel ? tooltipLabel : null}
                        <span className="text-brand-secondary text-xs">
                          {itemConfig?.label || item.name || "Amount"}
                        </span>
                      </div>
                      {item.value !== undefined && (
                        <span className="font-mono font-medium tabular-nums text-brand-primary text-xs ml-2">
                          {typeof item.value === "number" ? item.value.toLocaleString() : String(item.value)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

export const ChartLegend = RechartsPrimitive.Legend;

export interface ChartLegendContentProps extends React.ComponentProps<"div"> {
  hideIcon?: boolean;
  nameKey?: string;
  verticalAlign?: "top" | "middle" | "bottom";
  payload?: Array<{
    value?: any;
    dataKey?: string | number;
    color?: string;
    [key: string]: any;
  }>;
}

export const ChartLegendContent = React.forwardRef<
  HTMLDivElement,
  ChartLegendContentProps
>(
  (
    { className, hideIcon = false, payload, verticalAlign = "top", nameKey },
    ref
  ) => {
    const { config } = useChart();

    if (!payload?.length) {
      return null;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-end gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item, i) => {
          const key = `${nameKey || item.dataKey || "value"}`;
          const itemConfig = getPayloadConfigFromPayload(config, item, key);

          return (
            <div
              key={item.value || i}
              className={cn(
                "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
              )}
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{
                    backgroundColor: item.color,
                  }}
                />
              )}
              <span className="text-xs font-medium text-brand-secondary">{itemConfig?.label}</span>
            </div>
          );
        })}
      </div>
    );
  }
);
ChartLegendContent.displayName = "ChartLegendContent";

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config: ChartConfig,
  payload: unknown,
  key: string
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  const payloadPayload =
    "payload" in payload &&
      typeof payload.payload === "object" &&
      payload.payload !== null
      ? payload.payload
      : undefined;

  let configLabelKey: string = key;

  if (
    key in payload &&
    typeof payload[key as keyof typeof payload] === "string"
  ) {
    configLabelKey = payload[key as keyof typeof payload] as string;
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
  ) {
    configLabelKey = payloadPayload[
      key as keyof typeof payloadPayload
    ] as string;
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key as keyof typeof config];
}
