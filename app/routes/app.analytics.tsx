import type { LoaderFunctionArgs } from "@remix-run/node";
import { Card, Page, Text, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function AnalyticsPage() {
  return (
    <Page>
      <TitleBar title="Analytics" />
      <Card>
        <BlockStack gap="200">
          <Text as="p" variant="bodyMd">
            Analytics dashboard placeholder—add charts and KPIs here.
          </Text>
        </BlockStack>
      </Card>
    </Page>
  );
}
