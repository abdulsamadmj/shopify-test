import { useEffect, useState } from "react";
import { Box, SkeletonBodyText } from "@shopify/polaris";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  POLAR_CHART_AXIS_STROKE,
  POLAR_CHART_GRID_STROKE,
  POLAR_CHART_TICK_FILL,
} from "./chartTheme";
import type { AnalyticsChartDatum } from "./types";

const LARGE_CHART_LINE_ANIMATION_MS = 500;
const LARGE_CHART_COMPARISON_ANIMATION_BEGIN_MS = 100;

export type AnalyticsLargeCartesianChartProps = {
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  valueKey: string;
  comparisonKey: string;
  xAxisKey: string;
  primaryStroke: string;
  comparisonStroke: string;
  heightPx: number;
  legendCurrentLabel: string;
  legendCompareLabel: string;
  yTickPrefix: string;
  showComparisonLine: boolean;
};

export function AnalyticsLargeCartesianChart({
  chartData,
  valueKey,
  comparisonKey,
  xAxisKey,
  primaryStroke,
  comparisonStroke,
  heightPx,
  legendCurrentLabel,
  legendCompareLabel,
  showComparisonLine,
  yTickPrefix,
}: AnalyticsLargeCartesianChartProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const safeData =
    chartData.length > 0
      ? [...chartData]
      : [{ [xAxisKey]: "12 AM", [valueKey]: 0, [comparisonKey]: 0 }];

  if (!mounted) {
    return (
      <Box width="100%" minHeight={`${heightPx}px`}>
        <SkeletonBodyText lines={5} />
      </Box>
    );
  }

  return (
    <Box width="100%" minWidth="0">
      <div style={{ width: "100%", height: heightPx, minHeight: heightPx }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={safeData}
            margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={POLAR_CHART_GRID_STROKE}
            />
            <XAxis
              dataKey={xAxisKey}
              tick={{
                fontSize: 11,
                fill: POLAR_CHART_TICK_FILL,
              }}
              tickLine={false}
              axisLine={{ stroke: POLAR_CHART_AXIS_STROKE }}
              interval={1}
              tickMargin={8}
            />
            <YAxis
              width={56}
              tick={{
                fontSize: 11,
                fill: POLAR_CHART_TICK_FILL,
              }}
              tickLine={false}
              axisLine={{ stroke: POLAR_CHART_AXIS_STROKE }}
              tickFormatter={(v: number) =>
                `${yTickPrefix}${Number(v).toLocaleString(undefined, {
                  maximumFractionDigits: Number.isInteger(v) ? 0 : 2,
                })}`
              }
              domain={[0, "auto"]}
            />
            <RechartsTooltip
              formatter={(v: unknown) =>
                typeof v === "number"
                  ? [
                      `${yTickPrefix}${v.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}`,
                    ]
                  : [String(v)]
              }
              labelFormatter={(label) => String(label)}
            />
            <Legend
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ paddingTop: "var(--p-space-300)" }}
              formatter={(value) => (
                <span
                  style={{
                    fontSize: "var(--p-font-size-200)",
                    color: "var(--p-color-text)",
                  }}
                >
                  {value}
                </span>
              )}
            />
            <Line
              type="monotone"
              name={legendCurrentLabel}
              dataKey={valueKey}
              stroke={primaryStroke}
              strokeWidth={2}
              dot={false}
              isAnimationActive
              animationBegin={0}
              animationDuration={LARGE_CHART_LINE_ANIMATION_MS}
              animationEasing="ease-out"
            />
            {showComparisonLine ? (
              <Line
                type="monotone"
                name={legendCompareLabel}
                dataKey={comparisonKey}
                stroke={comparisonStroke}
                strokeWidth={2}
                strokeDasharray="6 5"
                dot={false}
                isAnimationActive
                animationBegin={LARGE_CHART_COMPARISON_ANIMATION_BEGIN_MS}
                animationDuration={LARGE_CHART_LINE_ANIMATION_MS}
                animationEasing="ease-out"
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}
