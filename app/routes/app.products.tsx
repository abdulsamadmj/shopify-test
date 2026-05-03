import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useRevalidator } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  InlineGrid,
  InlineStack,
  Page,
  Spinner,
  Text,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";

import { ProductCard } from "../components/ProductCard";
import { invokeProductCreateIntent } from "../lib/invokeProductEditIntent.client";
import { loadProductsPageData } from "../lib/productsPageData.server";

const PRODUCT_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  sm: "repeat(2, minmax(0, 1fr))",
  md: "repeat(3, minmax(0, 1fr))",
  lg: "repeat(4, minmax(0, 1fr))",
} as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const data = await loadProductsPageData(request);
  return json(data);
};

export default function ProductsPage() {
  const { products, graphqlError, adminProductsNewUrl } =
    useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const isRefreshing = revalidator.state === "loading";

  return (
    <Page
      fullWidth
      title="Products"
      subtitle="Manage products from your store in a card layout."
      primaryAction={{
        content: "Add product",
        icon: PlusIcon,
        onAction: () => {
          void invokeProductCreateIntent(adminProductsNewUrl);
        },
      }}
    >
      <TitleBar title="Products" />
      <Box paddingBlockEnd="400" width="100%">
        <BlockStack gap="400">
          {isRefreshing ? (
            <InlineStack align="end" blockAlign="center" gap="200">
              <Spinner size="small" accessibilityLabel="Updating products" />
              <Text as="span" variant="bodySm" tone="subdued">
                Updating list…
              </Text>
            </InlineStack>
          ) : null}

          {graphqlError ? (
            <Banner tone="critical" title="Could not load products">
              <BlockStack gap="200">
                <Text as="p" variant="bodyMd">
                  {graphqlError}
                </Text>
                <Box>
                  <Button onClick={() => void revalidator.revalidate()}>
                    Try again
                  </Button>
                </Box>
              </BlockStack>
            </Banner>
          ) : null}

          {products.length === 0 && !graphqlError ? (
            <Banner tone="info" title="No products yet">
              <Text as="p" variant="bodyMd">
                Create a product in the Shopify admin, then refresh this page.
              </Text>
            </Banner>
          ) : null}

          {products.length > 0 ? (
            <InlineGrid columns={PRODUCT_GRID_COLUMNS} gap="400">
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{
                    height: "100%",
                    minHeight: "100%",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <ProductCard product={product} />
                </div>
              ))}
            </InlineGrid>
          ) : null}

          {products.length === 0 && graphqlError ? (
            <Text as="p" variant="bodyMd" tone="subdued">
              Fix the error above, then reload.
            </Text>
          ) : null}
        </BlockStack>
      </Box>
    </Page>
  );
}
