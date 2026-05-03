import type { LoaderFunctionArgs } from "@remix-run/node";
import {
  Page,
  Card,
  Text,
  BlockStack,
  Button,
  InlineStack,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

const APP_TITLE = "Remix app";

export default function Index() {
  return (
    <Page
      title={APP_TITLE}
      subtitle="Open Analytics or Products from this app."
    >
      <TitleBar title={APP_TITLE} />
      <BlockStack gap="400">
        <Card>
          <InlineStack align="space-between" blockAlign="center" gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingSm">
                Analytics
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                View performance data and insights for your store.
              </Text>
            </BlockStack>
            <Button url="/app/analytics">Open</Button>
          </InlineStack>
        </Card>
        <Card>
          <InlineStack align="space-between" blockAlign="center" gap="400">
            <BlockStack gap="100">
              <Text as="h2" variant="headingSm">
                Products
              </Text>
              <Text as="p" variant="bodyMd" tone="subdued">
                Browse your catalog with image-first product cards.
              </Text>
            </BlockStack>
            <Button url="/app/products">Open</Button>
          </InlineStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
