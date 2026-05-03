import type { LoaderFunctionArgs } from "@remix-run/node";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { BlockStack, Box, InlineGrid, Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { AnalyticsCard } from "../components/AnalyticsCard";
import { ListCard } from "../components/ListCard";
import {
  AnalyticsFiltersBar,
  type PrimaryRangePreset,
} from "../components/AnalyticsFiltersBar";
import {
  MOCK_ANALYTICS_TODAY_ISO,
  MOCK_SALES_DAY_BUCKETS,
  buildHourlySalesOverTimeSeries,
  buildSalesBreakdownRows,
  filterBucketsByIsoRange,
  currencyDisplayPrefix,
  formatLegendDayIso,
  isoRangeEndingOn,
  totalGrossForDisplay,
  totalProfitForDisplay,
  totalReturnsForDisplay,
  toSalesChartSeries,
  toProfitChartSeries,
  toReturnsChartSeries,
  toFulfilledChartSeries,
  sumFulfilled,
  type MockCurrencyCode,
} from "../lib/mockShopifyAnalytics";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

function formatReadableIsoSpan(startIso: string, endIso: string): string {
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year:
      startIso.slice(0, 4) === endIso.slice(0, 4) ? undefined : "numeric",
  };
  const df = new Intl.DateTimeFormat(undefined, opts);
  const s = new Date(`${startIso}T12:00:00`);
  const e = new Date(`${endIso}T12:00:00`);
  const a = df.format(s);
  const b = df.format(e);
  return `${a}\u2009\u2013\u2009${b}`;
}

const METRIC_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  sm: "repeat(2, minmax(0, 1fr))",
  lg: "repeat(4, minmax(0, 1fr))",
} as const;

/** Bottom row: primary metric spans ~2/3 width on large screens. */
const LARGE_CHART_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  lg: "minmax(0, 2fr) minmax(0, 1fr)",
} as const;

const COMPACT_CHART_MIN_HEIGHT = 48;

const LARGE_CHART_HEIGHT_PX = 300;

export default function AnalyticsPage() {
  const chartCardMeasureRef = useRef<HTMLDivElement>(null);
  const [chartCardOuterHeightPx, setChartCardOuterHeightPx] = useState<
    number | undefined
  >();

  useLayoutEffect(() => {
    const el = chartCardMeasureRef.current;
    if (!el) return;

    const measure = () => {
      setChartCardOuterHeightPx(
        Math.round(el.getBoundingClientRect().height),
      );
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [primaryPreset, setPrimaryPreset] =
    useState<PrimaryRangePreset>("last_7_days");
  const [customRangeIso, setCustomRangeIso] = useState(
    isoRangeEndingOn(MOCK_ANALYTICS_TODAY_ISO, 7),
  );
  const [compareIso, setCompareIso] = useState("2026-05-01");
  const [currency, setCurrency] = useState<MockCurrencyCode>("INR");

  const appliedRange = useMemo(() => {
    switch (primaryPreset) {
      case "today":
        return isoRangeEndingOn(MOCK_ANALYTICS_TODAY_ISO, 1);
      case "last_7_days":
        return isoRangeEndingOn(MOCK_ANALYTICS_TODAY_ISO, 7);
      case "last_30_days":
        return isoRangeEndingOn(MOCK_ANALYTICS_TODAY_ISO, 30);
      case "custom":
        return customRangeIso;
      default:
        return customRangeIso;
    }
  }, [primaryPreset, customRangeIso]);

  const primaryRangeLabel = useMemo(() => {
    switch (primaryPreset) {
      case "today":
        return "Today";
      case "last_7_days":
        return "Last 7 days";
      case "last_30_days":
        return "Last 30 days";
      case "custom":
        return formatReadableIsoSpan(
          customRangeIso.startIso,
          customRangeIso.endIso,
        );
      default:
        return "Last 7 days";
    }
  }, [primaryPreset, customRangeIso.endIso, customRangeIso.startIso]);

  const filteredBuckets = useMemo(
    () =>
      filterBucketsByIsoRange(
        MOCK_SALES_DAY_BUCKETS,
        appliedRange.startIso,
        appliedRange.endIso,
      ),
    [appliedRange.startIso, appliedRange.endIso],
  );

  const salesTotal = totalGrossForDisplay(filteredBuckets, currency);
  const profitTotal = totalProfitForDisplay(filteredBuckets, currency);
  const returnsTotal = totalReturnsForDisplay(filteredBuckets, currency);
  const fulfilledTotal = sumFulfilled(filteredBuckets);

  const salesSeries = useMemo(
    () => toSalesChartSeries(filteredBuckets, currency),
    [filteredBuckets, currency],
  );
  const profitSeries = useMemo(
    () => toProfitChartSeries(filteredBuckets, currency),
    [filteredBuckets, currency],
  );
  const returnsSeries = useMemo(
    () => toReturnsChartSeries(filteredBuckets, currency),
    [filteredBuckets, currency],
  );
  const fulfilledSeries = useMemo(
    () => toFulfilledChartSeries(filteredBuckets),
    [filteredBuckets],
  );

  const hourlySalesSeries = useMemo(
    () =>
      buildHourlySalesOverTimeSeries({
        currentDayIso: appliedRange.endIso,
        compareDayIso: compareIso,
        currency,
        allBuckets: MOCK_SALES_DAY_BUCKETS,
        forcePrimaryFlat: primaryPreset === "today",
      }),
    [appliedRange.endIso, compareIso, currency, primaryPreset],
  );

  const showSalesCompareLine = appliedRange.endIso !== compareIso;

  const moneyUnit = currencyDisplayPrefix(currency);

  const salesBreakdownRows = useMemo(
    () =>
      buildSalesBreakdownRows({
        grossDisplay: salesTotal,
        returnsDisplay: returnsTotal,
        unitPrefix: moneyUnit,
      }),
    [salesTotal, returnsTotal, moneyUnit],
  );

  const legendCurrentDay = formatLegendDayIso(appliedRange.endIso);
  const legendCompareDay = formatLegendDayIso(compareIso);

  return (
    <Page fullWidth>
      <TitleBar title="Analytics" />
      <Box width="100%" paddingBlockEnd="400">
        <BlockStack gap="400">
          <AnalyticsFiltersBar
            primaryPreset={primaryPreset}
            onPrimaryPreset={setPrimaryPreset}
            primaryRangeLabel={primaryRangeLabel}
            customRangeIso={customRangeIso}
            onCustomRangeApply={setCustomRangeIso}
            compareIso={compareIso}
            onCompareIso={setCompareIso}
            currency={currency}
            onCurrency={setCurrency}
          />
          <InlineGrid columns={METRIC_GRID_COLUMNS} gap="300">
            <AnalyticsCard
              size="sm"
              title="Profit"
              unit={moneyUnit}
              value={profitTotal}
              tooltip={{
                heading: "Profit",
                body: "Mock net-style profit derived from daily gross in this demo.",
              }}
              chartData={profitSeries}
              chartMinHeight={COMPACT_CHART_MIN_HEIGHT}
            />
            <AnalyticsCard
              size="sm"
              title="Sales"
              unit={moneyUnit}
              value={salesTotal}
              tooltip={{
                heading: "Sales",
                body: "Gross sales revenue for the selected period (before discounts and returns).",
              }}
              chartData={salesSeries}
              chartMinHeight={COMPACT_CHART_MIN_HEIGHT}
            />
            <AnalyticsCard
              size="sm"
              title="Returns"
              unit={moneyUnit}
              value={returnsTotal}
              tooltip={{
                heading: "Returns",
                body: "Return and refund value for the selected period (mock aggregate).",
              }}
              chartData={returnsSeries}
              chartMinHeight={COMPACT_CHART_MIN_HEIGHT}
            />
            <AnalyticsCard
              size="sm"
              title="Fulfilled"
              unit=""
              value={fulfilledTotal}
              tooltip="Fulfilled units or orders in the selected period (mock aggregate)."
              chartData={fulfilledSeries}
              chartDataKey="value"
              chartMinHeight={COMPACT_CHART_MIN_HEIGHT}
            />
          </InlineGrid>

          <InlineGrid columns={LARGE_CHART_GRID_COLUMNS} gap="300">
            <Box ref={chartCardMeasureRef} minWidth="0">
              <AnalyticsCard
                size="lg"
                title="Total sales over time"
                unit={moneyUnit}
                value={salesTotal}
                chartData={hourlySalesSeries}
                chartDataKey="value"
                comparisonDataKey="compareValue"
                largeChartXAxisKey="hourLabel"
                largeChartHeight={LARGE_CHART_HEIGHT_PX}
                largeChartLegendCurrent={legendCurrentDay}
                largeChartLegendCompare={legendCompareDay}
                showComparisonLine={showSalesCompareLine}
                tooltip={{
                  heading: "Total sales over time",
                  body: "Intraday gross sales for the range end date vs comparison date (mock hourly buckets).",
                }}
              />
            </Box>
            <Box minWidth="0" width="100%">
              <ListCard
                title="Total sales breakdown"
                titleTooltip={{
                  heading: "Total sales breakdown",
                  body: "Mock rollup of gross sales, adjustments, and taxes for the selected reporting period.",
                }}
                rows={salesBreakdownRows}
                fixedOuterHeightPx={chartCardOuterHeightPx}
              />
            </Box>
          </InlineGrid>
        </BlockStack>
      </Box>
    </Page>
  );
}
