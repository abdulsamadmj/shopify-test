import { useState } from "react";
import type { LoaderFunctionArgs } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { Form, useLoaderData } from "@remix-run/react";
import {
  AppProvider as PolarisAppProvider,
  BlockStack,
  Box,
  Button,
  Card,
  FormLayout,
  InlineStack,
  Page,
  Text,
  TextField,
} from "@shopify/polaris";
import polarisTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";

import { login } from "../../shopify.server";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();
  const [shop, setShop] = useState("");

  const featureCopy =
    "Some detail about your feature and its benefit to your customer.";

  const features = (
    <Box
      as="ul"
      paddingInlineStart="500"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--p-space-400)",
        margin: 0,
        listStyleType: "disc",
        listStylePosition: "outside",
      }}
    >
      {Array.from({ length: 3 }, (_, index) => (
        <Box key={index} as="li">
          <Text as="p" variant="bodyMd">
            <Text as="span" variant="bodyMd" fontWeight="semibold">
              Product feature
            </Text>
            . {featureCopy}
          </Text>
        </Box>
      ))}
    </Box>
  );

  return (
    <PolarisAppProvider i18n={polarisTranslations}>
      <Page narrowWidth>
        <BlockStack gap="600">
          <BlockStack gap="300">
            <Text as="h1" variant="headingXl">
              A short heading about [your app]
            </Text>
            <Text as="p" variant="bodyLg">
              A tagline about [your app] that describes your value proposition.
            </Text>
          </BlockStack>

          {showForm ? (
            <Card>
              <Form method="post" action="/auth/login">
                <FormLayout>
                  <TextField
                    type="text"
                    name="shop"
                    label="Shop domain"
                    helpText="e.g: my-shop-domain.myshopify.com"
                    value={shop}
                    onChange={setShop}
                    autoComplete="on"
                  />
                  <InlineStack>
                    <Button submit>Log in</Button>
                  </InlineStack>
                </FormLayout>
              </Form>
            </Card>
          ) : null}

          {features}
        </BlockStack>
      </Page>
    </PolarisAppProvider>
  );
}
