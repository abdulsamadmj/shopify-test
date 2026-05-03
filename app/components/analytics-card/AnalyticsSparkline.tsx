import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Box, SkeletonBodyText } from "@shopify/polaris";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  YAxis,
} from "recharts";

import { formatInspectLabel } from "./formatInspectLabel";
import type { AnalyticsChartDatum } from "./types";

const SPARKLINE_LINE_ANIMATION_MS = 300;

export type AnalyticsSparklineProps = {
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  chartDataKey: string;
  primarySeriesStroke: string;
  chartStrokeWidth: number;
  chartMinHeight: number;
  chartInspectEnabled: boolean;
  activeDotRadius: number;
  layout?: "default" | "compactInline";
};

export function AnalyticsSparkline({
  chartData,
  chartDataKey,
  primarySeriesStroke,
  chartStrokeWidth,
  chartMinHeight,
  chartInspectEnabled,
  activeDotRadius,
  layout = "default",
}: AnalyticsSparklineProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const minHeightPx = `${chartMinHeight}px`;
  const isCompactInline = layout === "compactInline";
  const chartWrapperStyle: CSSProperties = {
    width: "100%",
    minHeight: minHeightPx,
    aspectRatio: isCompactInline ? "3 / 1" : "2 / 1",
    minWidth: 0,
  };

  const baseData =
    chartData.length > 0 ? [...chartData] : [{ [chartDataKey]: 0 }];

  const isSinglePointSeries = baseData.length === 1;
  const safeData: AnalyticsChartDatum[] = isSinglePointSeries
    ? [
        { ...baseData[0], [chartDataKey]: 0, __flatBaseline: "start" },
        { ...baseData[0], [chartDataKey]: 0, __flatBaseline: "end" },
      ]
    : baseData;

  const showPointInspect = chartInspectEnabled && !isSinglePointSeries;

  if (!mounted) {
    return (
      <Box width="100%" minWidth="0" paddingBlockStart="300">
        <div style={chartWrapperStyle}>
          <SkeletonBodyText lines={3} />
        </div>
      </Box>
    );
  }

  return (
    <Box width="100%" minWidth="0">
      <div style={chartWrapperStyle}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={safeData}
            margin={
              isCompactInline
                ? { top: 4, right: 2, bottom: 4, left: 2 }
                : { top: 8, right: 4, bottom: 8, left: 4 }
            }
          >
            {isSinglePointSeries ? (
              <YAxis hide domain={[0, 1]} />
            ) : null}
            {showPointInspect ? (
              <RechartsTooltip
                cursor={{
                  stroke: primarySeriesStroke,
                  strokeWidth: 1,
                  strokeDasharray: "4 4",
                }}
                labelFormatter={(label, payloadArr) => {
                  const datum = payloadArr?.[0]?.payload as
                    | { occurredOn?: string }
                    | undefined;
                  return formatInspectLabel(datum?.occurredOn) || String(label);
                }}
                formatter={(v: unknown) => {
                  if (typeof v === "number") {
                    if (Number.isInteger(v)) return [v.toLocaleString()];
                    return [
                      v.toLocaleString(undefined, { maximumFractionDigits: 2 }),
                    ];
                  }
                  return [String(v)];
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey={chartDataKey}
              stroke={primarySeriesStroke}
              strokeWidth={chartStrokeWidth}
              dot={false}
              activeDot={
                showPointInspect
                  ? {
                      r: activeDotRadius,
                      stroke: primarySeriesStroke,
                      strokeWidth: chartStrokeWidth,
                      fill: "var(--p-color-bg-surface)",
                    }
                  : false
              }
              isAnimationActive
              animationDuration={SPARKLINE_LINE_ANIMATION_MS}
              animationEasing="ease-out"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}
