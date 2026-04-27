import type { LoaderFunctionArgs } from "@remix-run/node";
import { Page } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";

import { AnalyticsDashboard } from "../components/AnalyticsDashboard";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function DashboardPage() {
  return (
    <Page
      title="Analytics"
      subtitle="Mocked storefront performance for the current store."
      primaryAction={{ content: "View products", url: "/app/products" }}
    >
      <TitleBar title="Analytics" />
      <AnalyticsDashboard />
    </Page>
  );
}
