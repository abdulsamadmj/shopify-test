import {
  InlineStack,
  Popover,
  Button,
  ActionList,
  DatePicker,
  Box,
  Text,
  BlockStack,
} from "@shopify/polaris";
import type { ComponentProps } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarIcon,
  CalendarTimeIcon,
  CurrencyConvertIcon,
} from "@shopify/polaris-icons";
import type { MockCurrencyCode } from "../lib/mockShopifyAnalytics";

export type PrimaryRangePreset =
  | "today"
  | "last_7_days"
  | "last_30_days"
  | "custom";

const PRESET_PRIMARY_LABEL: Record<
  Exclude<PrimaryRangePreset, "custom">,
  string
> = {
  today: "Today",
  last_7_days: "Last 7 days",
  last_30_days: "Last 30 days",
};

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

/** Local calendar date → YYYY-MM-DD (matches mock bucket keys for typical browser TZ demo). */
function dateToLocalIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function isoToLocalMidday(iso: string): Date {
  const [y, mo, dy] = iso.split("-").map(Number);
  return new Date(y, mo - 1, dy, 12, 0, 0);
}

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
  const [primaryPopover, setPrimaryPopover] = useState(false);
  const [comparePopover, setComparePopover] = useState(false);
  const [currencyPopover, setCurrencyPopover] = useState(false);

  const [primaryPane, setPrimaryPane] = useState<"preset" | "custom">(
    "preset",
  );

  const customSelectedRange = useMemo(
    (): { start: Date; end: Date } => ({
      start: isoToLocalMidday(customRangeIso.startIso),
      end: isoToLocalMidday(customRangeIso.endIso),
    }),
    [customRangeIso.endIso, customRangeIso.startIso],
  );

  const [customDraft, setCustomDraft] = useState<{ start: Date; end: Date }>(
    customSelectedRange,
  );

  useEffect(() => {
    setCustomDraft(customSelectedRange);
  }, [customSelectedRange]);

  /** Month header for the custom-range `DatePicker` (separate from selected range). */
  const [pickerNav, setPickerNav] = useState(() => ({
    month: isoToLocalMidday(customRangeIso.startIso).getMonth(),
    year: isoToLocalMidday(customRangeIso.startIso).getFullYear(),
  }));

  useEffect(() => {
    if (primaryPopover && primaryPane === "custom") {
      const start = customDraft.start;
      setPickerNav({ month: start.getMonth(), year: start.getFullYear() });
    }
    // intentional: snapshot month when pane opens — not whenever draft edits
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primaryPopover, primaryPane]);

  const compareSelected: ComponentProps<typeof DatePicker>["selected"] =
    useMemo(() => isoToLocalMidday(compareIso), [compareIso]);

  const [compareMonth, setCompareMonth] = useState(() => {
    const d = isoToLocalMidday(compareIso);
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const compareLabel = useMemo(() => {
    return new Intl.DateTimeFormat(undefined, {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(isoToLocalMidday(compareIso));
  }, [compareIso]);

  const currencyLabel = currency === "INR" ? "INR ₹" : "USD $";

  function closePrimary() {
    setPrimaryPopover(false);
    setPrimaryPane("preset");
  }

  return (
    <InlineStack gap="200" wrap blockAlign="center">
      <Popover
        active={primaryPopover}
        preferredPosition="below"
        autofocusTarget="none"
        onClose={() => {
          closePrimary();
        }}
        activator={
          <Button
            icon={CalendarIcon}
            disclosure
            pressed={primaryPopover}
            onClick={() => {
              setPrimaryPopover((active) => !active);
              if (!primaryPopover) setPrimaryPane("preset");
            }}
          >
            {primaryRangeLabel}
          </Button>
        }
      >
        <Popover.Pane fixed>
          <Box padding="300">
            {primaryPane === "preset" ? (
              <Box minWidth="200px">
                <ActionList
                  items={([
                    ["today"],
                    ["last_7_days"],
                    ["last_30_days"],
                    ["custom"],
                  ] as const).map(([key]) =>
                    key === "custom"
                      ? {
                          content: "Custom range…",
                          active: primaryPreset === "custom",
                          onAction: () => {
                            setPrimaryPane("custom");
                            onPrimaryPreset("custom");
                          },
                        }
                      : {
                          content: PRESET_PRIMARY_LABEL[key],
                          active: primaryPreset === key,
                          onAction: () => {
                            onPrimaryPreset(key);
                            closePrimary();
                          },
                        },
                  )}
                />
              </Box>
            ) : (
              <Box minWidth="320px">
                <BlockStack gap="200">
                  <Text as="p" variant="bodySm" tone="subdued">
                    Pick a date range, then Apply (shop local calendar).
                  </Text>
                  <DatePicker
                    month={pickerNav.month}
                    year={pickerNav.year}
                    allowRange
                    selected={customDraft}
                    onMonthChange={(month: number, year: number) => {
                      setPickerNav({ month, year });
                    }}
                    onChange={(range: {
                      start: Date;
                      end?: Date | undefined;
                    }) => {
                      const start = range.start;
                      const end = range.end ?? range.start;
                      setCustomDraft({ start, end });
                    }}
                  />
                  <InlineStack gap="200" blockAlign="center">
                    <Button
                      variant="primary"
                      onClick={() => {
                        const start = customDraft.start;
                        const end = customDraft.end;
                        let low = dateToLocalIso(start);
                        let high = dateToLocalIso(end);
                        if (high < low) {
                          [low, high] = [high, low];
                        }
                        onCustomRangeApply({ startIso: low, endIso: high });
                        closePrimary();
                      }}
                    >
                      Apply range
                    </Button>
                    <Button
                      variant="plain"
                      onClick={() => setPrimaryPane("preset")}
                    >
                      Back to presets
                    </Button>
                  </InlineStack>
                </BlockStack>
              </Box>
            )}
          </Box>
        </Popover.Pane>
      </Popover>

      <Popover
        active={comparePopover}
        preferredPosition="below"
        autofocusTarget="none"
        onClose={() => setComparePopover(false)}
        activator={
          <Button
            icon={CalendarTimeIcon}
            disclosure
            pressed={comparePopover}
            onClick={() => setComparePopover((a) => !a)}
          >
            {compareLabel}
          </Button>
        }
      >
        <Popover.Pane fixed>
          <Box padding="300">
            <DatePicker
              month={compareMonth.month}
              year={compareMonth.year}
              selected={compareSelected}
              onMonthChange={(month: number, year: number) =>
                setCompareMonth({ month, year })
              }
              onChange={(range: {
                start: Date;
                end?: Date | undefined;
              }) => {
                const d = range.end ?? range.start;
                onCompareIso(dateToLocalIso(d));
                setComparePopover(false);
              }}
            />
          </Box>
        </Popover.Pane>
      </Popover>

      <Popover
        active={currencyPopover}
        preferredPosition="below"
        autofocusTarget="none"
        onClose={() => setCurrencyPopover(false)}
        activator={
          <Button
            icon={CurrencyConvertIcon}
            pressed={currencyPopover}
            onClick={() => setCurrencyPopover((a) => !a)}
          >
            {currencyLabel}
          </Button>
        }
      >
        <Popover.Pane fixed>
          <Box padding="200">
            <ActionList
              items={[
                {
                  content: "INR ₹",
                  active: currency === "INR",
                  onAction: () => {
                    onCurrency("INR");
                    setCurrencyPopover(false);
                  },
                },
                {
                  content: "USD $",
                  active: currency === "USD",
                  onAction: () => {
                    onCurrency("USD");
                    setCurrencyPopover(false);
                  },
                },
              ]}
            />
          </Box>
        </Popover.Pane>
      </Popover>
    </InlineStack>
  );
}
