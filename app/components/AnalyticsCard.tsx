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
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";

const TOOLTIP_TITLE_ACTIVATOR_STYLE: CSSProperties = {
  color: "var(--p-color-text)",
  textDecoration: "underline dotted",
  textUnderlineOffset: "0.18em",
  textDecorationThickness: "1px",
  textDecorationColor: "var(--p-color-text)",
};

type PolarisInlineGridGap = ComponentProps<typeof InlineGrid>["gap"];
type PolarisBlockStackGap = ComponentProps<typeof BlockStack>["gap"];

const DEFAULT_CHART_STROKE = "#2e72d2";
const DEFAULT_COMPARISON_STROKE = "#84bfff";

const POLAR_CHART_GRID_STROKE = "var(--p-color-border-secondary)";
const POLAR_CHART_AXIS_STROKE = "var(--p-color-border-secondary)";
const POLAR_CHART_TICK_FILL = "var(--p-color-text-secondary)";

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

export type AnalyticsCardSize = "sm" | "md" | "lg";

type AnalyticsSparklineProps = {
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  chartDataKey: string;
  primarySeriesStroke: string;
  chartStrokeWidth: number;
  chartMinHeight: number;
  chartInspectEnabled: boolean;
  activeDotRadius: number;
  layout?: "default" | "compactInline";
};

function AnalyticsSparkline({
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
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Box>
  );
}

type AnalyticsLargeCartesianProps = {
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

function AnalyticsLargeCartesianChart({
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
}: AnalyticsLargeCartesianProps) {
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
              isAnimationActive={false}
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
                isAnimationActive={false}
              />
            ) : null}
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
  value?: number;
  chartData: ReadonlyArray<AnalyticsChartDatum>;
  chartDataKey?: string;
  /** Primary series color; same for sparkline (`sm`/`md`) and cartesian chart (`lg`). */
  chartStroke?: string;
  rowColumnGap?: PolarisInlineGridGap;
  metricsStackGap?: PolarisBlockStackGap;
  chartMinHeight?: number;
  chartInspectEnabled?: boolean;
  /** `sm` — dense metric strip; `md` — default KPI + sparkline; `lg` — detailed cartesian chart row. */
  size?: AnalyticsCardSize;
  /** Dashed comparison line stroke (`lg` only). */
  comparisonStroke?: string;
  /** Cartesian chart height in px (`lg` only). */
  largeChartHeight?: number;
  /** X-axis category key for hourly charts (`lg`). */
  largeChartXAxisKey?: string;
  comparisonDataKey?: string;
  largeChartLegendCurrent?: string;
  largeChartLegendCompare?: string;
  /** When false, omit comparison series (`lg`). */
  showComparisonLine?: boolean;
};

export function AnalyticsCard({
  title,
  tooltip,
  unit = "$",
  value,
  chartData,
  chartDataKey = "value",
  chartStroke = DEFAULT_CHART_STROKE,
  comparisonStroke = DEFAULT_COMPARISON_STROKE,
  rowColumnGap = "400",
  metricsStackGap = "200",
  chartMinHeight = 104,
  chartInspectEnabled = true,
  size = "md",
  largeChartHeight = 300,
  largeChartXAxisKey = "hourLabel",
  comparisonDataKey = "compareValue",
  largeChartLegendCurrent = "Current",
  largeChartLegendCompare = "Comparison",
  showComparisonLine = true,
}: AnalyticsCardProps) {
  const isSm = size === "sm";
  const isLg = size === "lg";
  const cardPadding = isSm
    ? { xs: "300" as const }
    : { xs: "400" as const };
  const gridGap = rowColumnGap;
  const stackGap = isSm ? ("100" as const) : metricsStackGap;
  const chartStrokeWidth = isSm ? 1.5 : 2;
  const activeDotRadius = isSm ? 4 : 5;
  const primarySeriesStroke = chartStroke;

  const titleText = (
    <Text as="span" variant="headingMd" fontWeight="semibold">
      {title}
    </Text>
  );

  const titleBlock = tooltip ? (
    <Tooltip
      preferredPosition="above"
      width={typeof tooltip === "object" ? "wide" : "default"}
      content={
        typeof tooltip === "string" ? (
          tooltip
        ) : (
          <>
            <Text as="span" variant="headingSm" fontWeight="semibold">
              {tooltip.heading}
            </Text>
            <br />
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              {tooltip.body}
            </Text>
          </>
        )
      }
    >
      <span style={TOOLTIP_TITLE_ACTIVATOR_STYLE}>{titleText}</span>
    </Tooltip>
  ) : (
    titleText
  );

  const sparkline = (
    <AnalyticsSparkline
      chartData={chartData}
      chartDataKey={chartDataKey}
      primarySeriesStroke={primarySeriesStroke}
      chartStrokeWidth={chartStrokeWidth}
      chartMinHeight={chartMinHeight}
      chartInspectEnabled={chartInspectEnabled}
      activeDotRadius={activeDotRadius}
      layout={isSm ? "compactInline" : "default"}
    />
  );

  const valueMoneyFormatted =
    value !== undefined
      ? value.toLocaleString(undefined, {
          minimumFractionDigits: unit === "" ? 0 : 2,
          maximumFractionDigits: unit === "" ? 0 : 2,
        })
      : null;

  return (
    <Box width="100%" minHeight="100%">
      <Card padding={cardPadding}>
        {isSm ? (
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
                        {unit === ""
                          ? value.toLocaleString()
                          : valueMoneyFormatted}
                      </Text>
                      <Text
                        as="span"
                        variant="headingMd"
                        fontWeight="semibold"
                        tone="subdued"
                      >
                        —
                      </Text>
                    </>
                  ) : (
                    <Text
                      as="span"
                      variant="headingMd"
                      fontWeight="semibold"
                      tone="subdued"
                    >
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
        ) : isLg ? (
          <BlockStack gap="300">
            <div>{titleBlock}</div>
            <InlineStack gap="150" blockAlign="baseline" wrap={false}>
              {value !== undefined ? (
                <>
                  <Text as="span" variant="headingLg" fontWeight="semibold">
                    {unit}
                    {unit === ""
                      ? value.toLocaleString()
                      : valueMoneyFormatted}
                  </Text>
                  <Text
                    as="span"
                    variant="headingLg"
                    fontWeight="semibold"
                    tone="subdued"
                  >
                    —
                  </Text>
                </>
              ) : (
                <Text
                  as="span"
                  variant="headingLg"
                  fontWeight="semibold"
                  tone="subdued"
                >
                  —
                </Text>
              )}
            </InlineStack>
            <AnalyticsLargeCartesianChart
              chartData={chartData}
              valueKey={chartDataKey}
              comparisonKey={comparisonDataKey}
              xAxisKey={largeChartXAxisKey}
              primaryStroke={primarySeriesStroke}
              comparisonStroke={comparisonStroke}
              heightPx={largeChartHeight}
              legendCurrentLabel={largeChartLegendCurrent}
              legendCompareLabel={largeChartLegendCompare}
              showComparisonLine={showComparisonLine}
              yTickPrefix={unit}
            />
          </BlockStack>
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
                <Text
                  as="p"
                  variant="headingLg"
                  fontWeight="semibold"
                  tone="subdued"
                >
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
