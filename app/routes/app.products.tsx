import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Banner,
  BlockStack,
  Box,
  InlineGrid,
  Page,
  Text,
} from "@shopify/polaris";
import { PlusIcon } from "@shopify/polaris-icons";
import { TitleBar } from "@shopify/app-bridge-react";

import { ProductCard } from "../components/ProductCard";
import { fetchProductsForListing } from "../lib/shopifyProducts.server";
import { authenticate } from "../shopify.server";

const PRODUCT_GRID_COLUMNS = {
  xs: "minmax(0, 1fr)",
  sm: "repeat(2, minmax(0, 1fr))",
  md: "repeat(3, minmax(0, 1fr))",
  lg: "repeat(4, minmax(0, 1fr))",
} as const;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const { products, graphqlError } = await fetchProductsForListing(
    admin,
    shop,
    50,
  );

  return json({
    products,
    graphqlError: graphqlError ?? null,
    adminProductsNewUrl: `https://${shop}/admin/products/new`,
  });
};

export default function ProductsPage() {
  const { products, graphqlError, adminProductsNewUrl } =
    useLoaderData<typeof loader>();

  return (
    <Page
      fullWidth
      title="Products"
      subtitle="Manage products from your store in a card layout."
      primaryAction={{
        content: "Add product",
        icon: PlusIcon,
        url: adminProductsNewUrl,
        target: "_parent",
      }}
    >
      <TitleBar title="Products" />
      <Box paddingBlockEnd="400" width="100%">
        <BlockStack gap="400">
          {graphqlError ? (
            <Banner tone="critical" title="Could not load products">
              <p>{graphqlError}</p>
            </Banner>
          ) : null}

          {products.length === 0 && !graphqlError ? (
            <Banner tone="info" title="No products yet">
              <p>
                Create a product in the Shopify admin, then refresh this page.
              </p>
            </Banner>
          ) : null}

          {products.length > 0 ? (
            <InlineGrid columns={PRODUCT_GRID_COLUMNS} gap="400">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
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
