import type { ComponentProps, CSSProperties } from "react";
import {
  Box,
  BlockStack,
  Card,
  InlineGrid,
  InlineStack,
  Text,
  Tooltip,
} from "@shopify/polaris";

import { AnalyticsLargeCartesianChart } from "./AnalyticsLargeCartesianChart";
import { AnalyticsSparkline } from "./AnalyticsSparkline";
import {
  DEFAULT_CHART_STROKE,
  DEFAULT_COMPARISON_STROKE,
  INLINE_GRID_COLUMNS,
} from "./chartTheme";
import type {
  AnalyticsCardSize,
  AnalyticsChartDatum,
  AnalyticsTooltipContent,
} from "./types";

export type {
  AnalyticsCardSize,
  AnalyticsChartDatum,
  AnalyticsTooltipContent,
} from "./types";

type PolarisInlineGridGap = ComponentProps<typeof InlineGrid>["gap"];
type PolarisBlockStackGap = ComponentProps<typeof BlockStack>["gap"];

const TOOLTIP_TITLE_ACTIVATOR_STYLE: CSSProperties = {
  color: "var(--p-color-text)",
  textDecoration: "underline dotted",
  textUnderlineOffset: "0.18em",
  textDecorationThickness: "1px",
  textDecorationColor: "var(--p-color-text)",
};

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
