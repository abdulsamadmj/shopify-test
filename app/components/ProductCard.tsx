import type { ComponentProps, SVGProps } from "react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  Card,
  InlineStack,
  Text,
  Thumbnail,
} from "@shopify/polaris";
import { CameraIcon, EditIcon } from "@shopify/polaris-icons";
import { invokeProductEditIntent } from "../lib/invokeProductEditIntent.client";
import type { ProductListItem, ProductOverlayKind } from "../lib/productList";

type BadgeTone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

function overlayBadge(overlay: ProductOverlayKind): {
  label: string;
  tone: BadgeTone;
} | null {
  switch (overlay) {
    case "draft":
      return { label: "Draft", tone: "read-only" };
    case "few_stock":
      return { label: "Few stock", tone: "critical" };
    case "best_seller":
      return { label: "Best seller", tone: "success" };
    default:
      return null;
  }
}

export type ProductCardProps = {
  product: ProductListItem;
};

export function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    title,
    featuredImageUrl,
    mediaCount,
    mediaPreviewUrls,
    priceFormatted,
    overlay,
    adminEditUrl,
  } = product;

  const badge = overlayBadge(overlay);
  const showTrailingMediaSlot = mediaCount > 0;

  return (
    <div
      style={{
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Card padding={{ xs: "0" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              minHeight: "100%",
            }}
          >
          <Box position="relative" width="100%" style={{ aspectRatio: "4 / 3" }}>
            {featuredImageUrl ? (
              <img
                src={featuredImageUrl}
                alt={title}
                width={800}
                height={600}
                loading="lazy"
                decoding="async"
                style={{
                  display: "block",
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <Box
                width="100%"
                height="100%"
                background="bg-fill-secondary"
                minHeight="100%"
              />
            )}
            {badge ? (
              <Box
                position="absolute"
                insetBlockStart="300"
                insetInlineStart="300"
                zIndex="100"
              >
                <Badge tone={badge.tone}>{badge.label}</Badge>
              </Box>
            ) : null}
          </Box>

          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
              padding: "var(--p-space-400)",
              gap: "var(--p-space-300)",
            }}
          >
            <div style={{ flex: 1, minHeight: 0 }}>
              <BlockStack gap="300">
                <BlockStack gap="100">
                  <Box minWidth="0" maxWidth="100%">
                    <Text
                      as="h3"
                      variant="headingSm"
                      fontWeight="semibold"
                      truncate
                    >
                      {title}
                    </Text>
                  </Box>
                  <Text
                    as="p"
                    variant="bodyMd"
                    fontWeight="semibold"
                    tone="base"
                    alignment="end"
                  >
                    {priceFormatted}
                  </Text>
                </BlockStack>

                <Box
                  borderBlockStartWidth="025"
                  borderColor="border"
                  paddingBlockStart="300"
                >
                  <BlockStack gap="200">
                    <Text as="p" variant="bodySm" tone="subdued">
                      Media ({mediaCount})
                    </Text>
                    <InlineStack align="start" blockAlign="center" gap="200" wrap>
                      <Box minWidth="0">
                        <InlineStack gap="200" blockAlign="center" wrap>
                          {mediaPreviewUrls.map((url, index) => (
                            <Thumbnail
                              key={`${url}-${index}`}
                              source={url}
                              alt=""
                              size="small"
                            />
                          ))}
                          {showTrailingMediaSlot ? (
                            <Box
                              padding="100"
                              borderWidth="025"
                              borderStyle="dashed"
                              borderColor="border"
                              borderRadius="200"
                              background="bg-surface-secondary"
                            >
                              <Thumbnail
                                source={CameraIcon}
                                alt=""
                                size="small"
                                transparent
                              />
                            </Box>
                          ) : null}
                        </InlineStack>
                      </Box>
                    </InlineStack>
                  </BlockStack>
                </Box>
              </BlockStack>
            </div>

            <Button
              variant="secondary"
              icon={EditIcon}
              fullWidth
              onClick={() => {
                void invokeProductEditIntent(id, adminEditUrl);
              }}
            >
              Edit product
            </Button>
          </div>
        </div>
        </Card>
      </div>
    </div>
  );
}
