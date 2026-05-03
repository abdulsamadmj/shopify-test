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
    <Card padding={{ xs: "0" }}>
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

      <Box padding="400">
        <BlockStack gap="300">
          <InlineStack align="space-between" blockAlign="start" gap="300">
            <Box minWidth="0" maxWidth="100%">
              <Text as="h3" variant="headingSm" fontWeight="semibold" breakWord>
                {title}
              </Text>
            </Box>
            <Text as="p" variant="bodyMd" fontWeight="semibold" tone="base">
              {priceFormatted}
            </Text>
          </InlineStack>

          <Box
            borderBlockStartWidth="025"
            borderColor="border"
            paddingBlockStart="300"
          >
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Media ({mediaCount})
              </Text>
              <InlineStack
                align="space-between"
                blockAlign="center"
                gap="200"
                wrap={false}
              >
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
                <div style={{ flexShrink: 0 }}>
                  <Button
                    variant="primary"
                    icon={EditIcon}
                    url={adminEditUrl}
                    target="_parent"
                    accessibilityLabel="Edit product"
                    size="large"
                  />
                </div>
              </InlineStack>
            </BlockStack>
          </Box>
        </BlockStack>
      </Box>
    </Card>
  );
}
