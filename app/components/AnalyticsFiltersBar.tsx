import { InlineStack } from "@shopify/polaris";

import type { MockCurrencyCode } from "../lib/mockShopifyAnalytics";
import type { PrimaryRangePreset } from "./analytics-filters/PrimaryRangeFilter";
import { PrimaryRangeFilter } from "./analytics-filters/PrimaryRangeFilter";
import { CompareDateFilter } from "./analytics-filters/CompareDateFilter";
import { CurrencyFilter } from "./analytics-filters/CurrencyFilter";

export type { PrimaryRangePreset } from "./analytics-filters/PrimaryRangeFilter";

export type AnalyticsFiltersBarProps = {
  primaryPreset: PrimaryRangePreset;
  onPrimaryPreset: (preset: PrimaryRangePreset) => void;
  /** Label on the primary range control (“Today”, “May 3 – May 10, 2026”, …). */
  primaryRangeLabel: string;
  customRangeIso: { startIso: string; endIso: string };
  onCustomRangeApply: (range: { startIso: string; endIso: string }) => void;
  compareIso: string;
  onCompareIso: (iso: string) => void;
  currency: MockCurrencyCode;
  onCurrency: (code: MockCurrencyCode) => void;
};

export function AnalyticsFiltersBar({
  primaryPreset,
  onPrimaryPreset,
  primaryRangeLabel,
  customRangeIso,
  onCustomRangeApply,
  compareIso,
  onCompareIso,
  currency,
  onCurrency,
}: AnalyticsFiltersBarProps) {
  return (
    <InlineStack gap="200" wrap blockAlign="center">
      <PrimaryRangeFilter
        primaryPreset={primaryPreset}
        onPrimaryPreset={onPrimaryPreset}
        primaryRangeLabel={primaryRangeLabel}
        customRangeIso={customRangeIso}
        onCustomRangeApply={onCustomRangeApply}
      />
      <CompareDateFilter compareIso={compareIso} onCompareIso={onCompareIso} />
      <CurrencyFilter currency={currency} onCurrency={onCurrency} />
    </InlineStack>
  );
}
