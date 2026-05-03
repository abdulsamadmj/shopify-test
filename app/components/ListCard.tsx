import { useLayoutEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  BlockStack,
  Box,
  Card,
  InlineGrid,
  Text,
  Tooltip,
} from "@shopify/polaris";

export type ListCardRow = {
  id: string;
  label: string;
  /** Pre-formatted currency or count string (e.g. `₹0.00`). */
  valueFormatted: string;
};

export type ListCardTitleTooltip =
  | string
  | { heading: string; body: string };

export type ListCardProps = {
  title: string;
  titleTooltip?: ListCardTitleTooltip;
  rows: readonly ListCardRow[];
  /**
   * Total outer height (px) to match a sibling card (e.g. analytics chart card).
   * When set, the title stays visible and the row list scrolls inside the card.
   */
  fixedOuterHeightPx?: number;
};

const ROW_GRID = "minmax(0, 1fr) auto auto";

const TOOLTIP_TITLE_ACTIVATOR_STYLE: CSSProperties = {
  color: "var(--p-color-text)",
  textDecoration: "underline dotted",
  textUnderlineOffset: "0.18em",
  textDecorationThickness: "1px",
  textDecorationColor: "var(--p-color-text)",
};

export function ListCard({
  title,
  titleTooltip,
  rows,
  fixedOuterHeightPx,
}: ListCardProps) {
  const outerMeasureRef = useRef<HTMLDivElement>(null);
  const headerMeasureRef = useRef<HTMLDivElement>(null);
  const [scrollBodyMaxPx, setScrollBodyMaxPx] = useState<number>();

  useLayoutEffect(() => {
    if (fixedOuterHeightPx === undefined) {
      setScrollBodyMaxPx(undefined);
      return;
    }

    const outer = outerMeasureRef.current;
    const header = headerMeasureRef.current;
    if (!outer || !header) return;

    const measure = () => {
      const o = outerMeasureRef.current;
      const h = headerMeasureRef.current;
      if (!o || !h) return;
      const belowHeaderPx =
        o.getBoundingClientRect().bottom - h.getBoundingClientRect().bottom;
      setScrollBodyMaxPx(Math.max(48, Math.floor(belowHeaderPx)));
    };

    measure();
    requestAnimationFrame(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(outer);
    ro.observe(header);
    return () => ro.disconnect();
  }, [fixedOuterHeightPx]);
  const titleText = (
    <Text as="span" variant="headingMd" fontWeight="semibold">
      {title}
    </Text>
  );

  const titleBlock = titleTooltip ? (
    <Tooltip
      preferredPosition="above"
      width={typeof titleTooltip === "object" ? "wide" : "default"}
      content={
        typeof titleTooltip === "string" ? (
          titleTooltip
        ) : (
          <>
            <Text as="span" variant="headingSm" fontWeight="semibold">
              {titleTooltip.heading}
            </Text>
            <br />
            <Text as="span" variant="bodyMd">
              {titleTooltip.body}
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

  const headerBox = (
    <div ref={fixedOuterHeightPx !== undefined ? headerMeasureRef : undefined}>
      {titleBlock}
    </div>
  );

  const rowsStack = (
    <BlockStack gap="100">
      {rows.map((row, index) => {
        const zebra = index % 2 === 1;
        return (
          <Box
            key={row.id}
            paddingBlock="200"
            paddingInline="100"
            borderRadius="200"
            background={zebra ? "bg-surface-secondary" : undefined}
          >
            <InlineGrid columns={ROW_GRID} gap="200" alignItems="center">
              <Text as="span" variant="bodyMd" fontWeight="regular" truncate>
                <Box as="span" color="text-link">
                  {row.label}
                </Box>
              </Text>
              <Text
                as="span"
                variant="bodyMd"
                fontWeight="regular"
                alignment="end"
              >
                {row.valueFormatted}
              </Text>
              <Box minWidth="1.25rem">
                <Text
                  as="span"
                  variant="bodyMd"
                  fontWeight="regular"
                  tone="subdued"
                >
                  —
                </Text>
              </Box>
            </InlineGrid>
          </Box>
        );
      })}
    </BlockStack>
  );

  const scrollStyles =
    fixedOuterHeightPx !== undefined
      ? {
          maxHeight:
            scrollBodyMaxPx ??
            Math.max(48, fixedOuterHeightPx - 96),
          overflowY: "auto" as const,
          scrollbarGutter: "stable" as const,
        }
      : undefined;

  const cardInner = (
    <BlockStack gap="0">
      {headerBox}
      {fixedOuterHeightPx !== undefined ? (
        <div style={scrollStyles}>{rowsStack}</div>
      ) : (
        rowsStack
      )}
    </BlockStack>
  );

  const card = <Card>{cardInner}</Card>;

  if (fixedOuterHeightPx === undefined) {
    return card;
  }

  return (
    <div
      ref={outerMeasureRef}
      style={{
        height: fixedOuterHeightPx,
        width: "100%",
        minHeight: 0,
        overflow: "hidden",
        boxSizing: "border-box",
      }}
    >
      {card}
    </div>
  );
}
