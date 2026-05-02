import { useEffect, useState } from "react";
import type { ComponentProps, CSSProperties } from "react";
import {
  Box,
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  SkeletonBodyText,
  Text,
  Tooltip,
} from "@shopify/polaris";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  YAxis,
} from "recharts";

type PolarisInlineGridGap = ComponentProps<typeof InlineGrid>["gap"];
type PolarisBlockStackGap = ComponentProps<typeof BlockStack>["gap"];

const DEFAULT_CHART_STROKE = "#2e72d2";

function formatInspectLabel(iso: string | undefined) {
  if (!iso || typeof iso !== "string") return "";
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(`${iso}T12:00:00`));
  } catch {
    return iso;
  }
}
const INLINE_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  md: "minmax(0, 1fr) minmax(140px, 2fr)",
} as const;

export type AnalyticsTooltipContent =
  | string
  | { heading: string; body: string };

export type AnalyticsChartDatum = Record<string, unknown>;

type AnalyticsSparklineProps = {
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  chartDataKey: string;
  chartStroke: string;
  chartStrokeWidth: number;
  chartMinHeight: number;
  chartInspectEnabled: boolean;
  activeDotRadius: number;
  layout?: "default" | "compactInline";
};

function AnalyticsSparkline({
  chartData,
  chartDataKey,
  chartStroke,
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

  /** One day / one bucket: draw a flat baseline at the bottom instead of a lone dot. */
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
                cursor={{ stroke: chartStroke, strokeWidth: 1, strokeDasharray: "4 4" }}
                labelFormatter={(label, payloadArr) => {
                  const datum = payloadArr?.[0]?.payload as {
                    occurredOn?: string;
                  } | undefined;
                  return formatInspectLabel(datum?.occurredOn) || String(label);
                }}
                formatter={(v: unknown) => {
                  if (typeof v === "number") {
                    if (Number.isInteger(v)) return [v.toLocaleString()];
                    return [v.toLocaleString(undefined, { maximumFractionDigits: 2 })];
                  }
                  return [String(v)];
                }}
              />
            ) : null}
            <Line
              type="monotone"
              dataKey={chartDataKey}
              stroke={chartStroke}
              strokeWidth={chartStrokeWidth}
              dot={false}
              activeDot={
                showPointInspect
                  ? {
                      r: activeDotRadius,
                      stroke: chartStroke,
                      strokeWidth: chartStrokeWidth,
                      fill: "#fff",
                    }
                  : false
              }
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}

export type AnalyticsCardProps = {
  title: string;
  tooltip?: AnalyticsTooltipContent;
  unit?: string;
  /** When omitted, a subdued placeholder is shown. */
  value?: number;
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  chartDataKey?: string;
  chartStroke?: string;
  /** Controls both row and column gap between the metrics stack and chart. */
  rowColumnGap?: PolarisInlineGridGap;
  metricsStackGap?: PolarisBlockStackGap;
  /** Minimum chart area height (px); combined with `aspect-ratio: 2 / 1` for responsiveness. */
  chartMinHeight?: number;
  /** When true, hover shows point detail (Recharts tooltip) and highlights the active point. */
  chartInspectEnabled?: boolean;
  /** Compact single-column layout for dense metric grids. */
  density?: "default" | "compact";
};

export function AnalyticsCard({
  title,
  tooltip,
  unit = "$",
  value,
  chartData,
  chartDataKey = "value",
  chartStroke = DEFAULT_CHART_STROKE,
  rowColumnGap = "400",
  metricsStackGap = "200",
  chartMinHeight = 104,
  chartInspectEnabled = true,
  density = "default",
}: AnalyticsCardProps) {
  const isCompact = density === "compact";
  const cardPadding = isCompact ? { xs: "300" as const } : { xs: "400" as const };
  const gridGap = rowColumnGap;
  const stackGap = isCompact ? ("100" as const) : metricsStackGap;
  const chartStrokeWidth = isCompact ? 1.5 : 2;
  const activeDotRadius = isCompact ? 4 : 5;

  const titleText = (
    <Text
      as="span"
      variant={isCompact ? "bodySm" : "bodyMd"}
      tone="subdued"
    >
      {title}
    </Text>
  );

  const titleBlock = tooltip ? (
    <Tooltip
      preferredPosition="above"
      width={typeof tooltip === "object" ? "wide" : "default"}
      hasUnderline
      content={
        typeof tooltip === "string" ? (
          tooltip
        ) : (
          <>
            <Text as="span" variant="headingSm" fontWeight="semibold">
              {tooltip.heading}
            </Text>
            <br />
            <Text as="span" variant="bodyMd" tone="subdued">
              {tooltip.body}
            </Text>
          </>
        )
      }
    >
      <span>{titleText}</span>
    </Tooltip>
  ) : (
    titleText
  );

  const sparkline = (
    <AnalyticsSparkline
      chartData={chartData}
      chartDataKey={chartDataKey}
      chartStroke={chartStroke}
      chartStrokeWidth={chartStrokeWidth}
      chartMinHeight={chartMinHeight}
      chartInspectEnabled={chartInspectEnabled}
      activeDotRadius={activeDotRadius}
      layout={isCompact ? "compactInline" : "default"}
    />
  );

  return (
    <Box width="100%" minHeight="100%">
      <Card padding={cardPadding}>
        {isCompact ? (
          <InlineStack
            align="space-between"
            blockAlign="end"
            gap="200"
            wrap={false}
          >
            <Box minWidth="0">
              <BlockStack gap={stackGap}>
                <div>{titleBlock}</div>
                <InlineStack gap="150" blockAlign="baseline" wrap={false}>
                  {value !== undefined ? (
                    <>
                      <Text as="span" variant="headingMd" fontWeight="semibold">
                        {unit}
                        {value.toLocaleString()}
                      </Text>
                      <Text as="span" variant="headingMd" tone="subdued">
                        —
                      </Text>
                    </>
                  ) : (
                    <Text as="span" variant="headingMd" tone="subdued">
                      —
                    </Text>
                  )}
                </InlineStack>
              </BlockStack>
            </Box>
            <div
              style={{
                flexShrink: 0,
                width: "clamp(4.5rem, 38%, 7.5rem)",
                minWidth: "4.5rem",
              }}
            >
              {sparkline}
            </div>
          </InlineStack>
        ) : (
          <InlineGrid columns={INLINE_GRID_COLUMNS} gap={gridGap}>
            <BlockStack gap={stackGap}>
              <div>{titleBlock}</div>
              {value !== undefined ? (
                <Text as="p" variant="headingLg" fontWeight="semibold">
                  {unit}
                  {value.toLocaleString()}
                </Text>
              ) : (
                <Text as="p" variant="headingLg" tone="subdued">
                  —
                </Text>
              )}
            </BlockStack>
            {sparkline}
          </InlineGrid>
        )}
      </Card>
    </Box>
  );
}
