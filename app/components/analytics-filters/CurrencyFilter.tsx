import { ActionList, Box, Button, Popover } from "@shopify/polaris";
import { CurrencyConvertIcon } from "@shopify/polaris-icons";
import { useState } from "react";

import type { MockCurrencyCode } from "../../lib/mockShopifyAnalytics";

export type CurrencyFilterProps = {
  currency: MockCurrencyCode;
  onCurrency: (code: MockCurrencyCode) => void;
};

export function CurrencyFilter({
  currency,
  onCurrency,
}: CurrencyFilterProps) {
  const [currencyPopover, setCurrencyPopover] = useState(false);

  return (
    <Popover
      active={currencyPopover}
      preferredPosition="below"
      autofocusTarget="none"
      onClose={() => setCurrencyPopover(false)}
      activator={
        <Button
          icon={CurrencyConvertIcon}
          disclosure
          pressed={currencyPopover}
          onClick={() => setCurrencyPopover((a) => !a)}
        >
          {currency}
        </Button>
      }
    >
      <Popover.Pane fixed>
        <Box padding="300">
          <ActionList
            items={[
              {
                content: "INR",
                active: currency === "INR",
                onAction: () => {
                  onCurrency("INR");
                  setCurrencyPopover(false);
                },
              },
              {
                content: "USD",
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
  );
}
