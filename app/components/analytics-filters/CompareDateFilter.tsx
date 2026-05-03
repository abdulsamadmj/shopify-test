import {
  Box,
  Button,
  DatePicker,
  Popover,
} from "@shopify/polaris";
import type { ComponentProps } from "react";
import { useMemo, useState } from "react";
import { CalendarTimeIcon } from "@shopify/polaris-icons";

import {
  dateToLocalIso,
  isoToLocalMidday,
} from "../../lib/analyticsDateIso";

export type CompareDateFilterProps = {
  compareIso: string;
  onCompareIso: (iso: string) => void;
};

export function CompareDateFilter({
  compareIso,
  onCompareIso,
}: CompareDateFilterProps) {
  const [comparePopover, setComparePopover] = useState(false);

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

  return (
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
  );
}
