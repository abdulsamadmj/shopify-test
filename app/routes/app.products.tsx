import type { LoaderFunctionArgs } from "@remix-run/node";
import { BlockStack, InlineGrid, Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { ProductCard } from "../components/ProductCard";
import { products } from "../data/mockStore";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function ProductsPage() {
  return (
    <Page
      title="Products"
      subtitle="Manage product visuals with mocked image tools."
      backAction={{ content: "Analytics", url: "/app" }}
    >
      <TitleBar title="Products" />
      <BlockStack gap="500">
        <InlineGrid gap="500" columns={{ xs: 1, sm: 1, md: 2, lg: 2 }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </InlineGrid>
      </BlockStack>
    </Page>
  );
}
