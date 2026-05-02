import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import {
  Box,
  BlockStack,
  Card,
  InlineGrid,
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
  chartMinHeight: number;
  chartInspectEnabled: boolean;
};

function AnalyticsSparkline({
  chartData,
  chartDataKey,
  chartStroke,
  chartMinHeight,
  chartInspectEnabled,
}: AnalyticsSparklineProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const minHeightPx = `${chartMinHeight}px`;
  const chartWrapperStyle = {
    width: "100%",
    minHeight: minHeightPx,
    aspectRatio: "2 / 1" as const,
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
          <LineChart data={safeData} margin={{ top: 8, right: 4, bottom: 8, left: 4 }}>
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
              strokeWidth={2}
              dot={false}
              activeDot={
                showPointInspect
                  ? { r: 5, stroke: chartStroke, strokeWidth: 2, fill: "#fff" }
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
}: AnalyticsCardProps) {
  const titleText = (
    <Text as="span" variant="bodyMd" tone="subdued">
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

  return (
    <Box width="100%" minHeight="100%">
      <Card padding={{ xs: "400" }}>
        <InlineGrid columns={INLINE_GRID_COLUMNS} gap={rowColumnGap}>
          <BlockStack gap={metricsStackGap}>
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
          <AnalyticsSparkline
            chartData={chartData}
            chartDataKey={chartDataKey}
            chartStroke={chartStroke}
            chartMinHeight={chartMinHeight}
            chartInspectEnabled={chartInspectEnabled}
          />
        </InlineGrid>
      </Card>
    </Box>
  );
}
