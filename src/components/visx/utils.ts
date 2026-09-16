import {
  curveMonotoneX,
  curveLinear,
  curveNatural,
  curveBasis,
  curveStep,
} from "@visx/curve";
import { ChartConfig } from "./types";

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function getCurve(curveType: string = "monotone") {
  switch (curveType) {
    case "linear":
      return curveLinear;
    case "natural":
      return curveNatural;
    case "basis":
      return curveBasis;
    case "step":
      return curveStep;
    case "monotone":
    default:
      return curveMonotoneX;
  }
}

export function getSeriesColor(
  key: string,
  config?: ChartConfig,
  isDark: boolean = true,
  fallback: string = "#f97316"
): string {
  if (!config || !config[key]) return fallback;
  const cfg = config[key];
  if (isDark && cfg.colors?.dark && cfg.colors.dark[0]) {
    return cfg.colors.dark[0];
  }
  if (!isDark && cfg.colors?.light && cfg.colors.light[0]) {
    return cfg.colors.light[0];
  }
  if (cfg.color) return cfg.color;
  return fallback;
}

export function bisectIndex(
  xPos: number,
  xScale: (index: number) => number,
  dataLength: number
): number {
  if (dataLength <= 1) return 0;
  let low = 0;
  let high = dataLength - 1;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midX = xScale(mid);

    if (midX < xPos) {
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  const d0 = Math.max(0, Math.min(high, dataLength - 1));
  const d1 = Math.max(0, Math.min(low, dataLength - 1));
  const x0 = xScale(d0);
  const x1 = xScale(d1);

  return Math.abs(xPos - x0) <= Math.abs(xPos - x1) ? d0 : d1;
}

// Fritsch-Carlson Piecewise Cubic Monotone Hermite Spline Interpolator
export function createMonotoneSpline(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n === 0) return (_x: number) => 0;
  if (n === 1) return (_x: number) => points[0].y;

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);

  const deltas: number[] = [];
  const ms: number[] = [];

  for (let i = 0; i < n - 1; i++) {
    const dx = xs[i + 1] - xs[i];
    deltas.push(dx !== 0 ? (ys[i + 1] - ys[i]) / dx : 0);
  }

  ms.push(deltas[0]);
  for (let i = 1; i < n - 1; i++) {
    ms.push((deltas[i - 1] + deltas[i]) / 2);
  }
  ms.push(deltas[n - 2]);

  for (let i = 0; i < n - 1; i++) {
    if (deltas[i] === 0) {
      ms[i] = 0;
      ms[i + 1] = 0;
    } else {
      const alpha = ms[i] / deltas[i];
      const beta = ms[i + 1] / deltas[i];
      const dist = alpha * alpha + beta * beta;
      if (dist > 9) {
        const tau = 3 / Math.sqrt(dist);
        ms[i] = tau * alpha * deltas[i];
        ms[i + 1] = tau * beta * deltas[i];
      }
    }
  }

  return (x: number): number => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];

    let low = 0;
    let high = n - 2;
    while (low <= high) {
      const mid = (low + high) >> 1;
      if (x < xs[mid]) {
        high = mid - 1;
      } else if (x > xs[mid + 1]) {
        low = mid + 1;
      } else {
        const h = xs[mid + 1] - xs[mid];
        if (h === 0) return ys[mid];
        const t = (x - xs[mid]) / h;
        const t2 = t * t;
        const t3 = t2 * t;
        const h00 = 2 * t3 - 3 * t2 + 1;
        const h10 = t3 - 2 * t2 + t;
        const h01 = -2 * t3 + 3 * t2;
        const h11 = t3 - t2;
        return h00 * ys[mid] + h10 * h * ms[mid] + h01 * ys[mid + 1] + h11 * h * ms[mid + 1];
      }
    }
    return ys[n - 1];
  };
}

