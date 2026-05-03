import {
  ActionList,
  BlockStack,
  Box,
  Button,
  DatePicker,
  InlineStack,
  Popover,
  Text,
} from "@shopify/polaris";
import { CalendarIcon } from "@shopify/polaris-icons";
import { useEffect, useMemo, useState } from "react";

import {
  dateToLocalIso,
  isoToLocalMidday,
} from "../../lib/analyticsDateIso";

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

export type PrimaryRangeFilterProps = {
  primaryPreset: PrimaryRangePreset;
  onPrimaryPreset: (preset: PrimaryRangePreset) => void;
  primaryRangeLabel: string;
  customRangeIso: { startIso: string; endIso: string };
  onCustomRangeApply: (range: { startIso: string; endIso: string }) => void;
};

export function PrimaryRangeFilter({
  primaryPreset,
  onPrimaryPreset,
  primaryRangeLabel,
  customRangeIso,
  onCustomRangeApply,
}: PrimaryRangeFilterProps) {
  const [primaryPopover, setPrimaryPopover] = useState(false);
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

  function closePrimary() {
    setPrimaryPopover(false);
    setPrimaryPane("preset");
  }

  return (
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
  );
}
