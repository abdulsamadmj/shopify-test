import { useMemo, useState } from "react";
import {
  Badge,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Card,
  Divider,
  InlineGrid,
  InlineStack,
  Modal,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  CropIcon,
  DeleteIcon,
  DragHandleIcon,
  EditIcon,
  ExternalIcon,
  ImageAddIcon,
  MagicIcon,
  RotateRightIcon,
} from "@shopify/polaris-icons";

import type { Product, ProductImage } from "../data/mockStore";
import { imageLibrary } from "../data/mockStore";

type ProductCardProps = {
  product: Product;
};

export function ProductCard({ product }: ProductCardProps) {
  const [images, setImages] = useState(product.images);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const [editingImage, setEditingImage] = useState<ProductImage | null>(null);
  const [prompt, setPrompt] = useState("");
  const [contrast, setContrast] = useState(48);

  const nextImage = useMemo(() => {
    return imageLibrary[images.length % imageLibrary.length];
  }, [images.length]);

  const primaryImage = images[0];

  const addImage = () => {
    setImages((currentImages) => [
      ...currentImages,
      {
        ...nextImage,
        id: `${nextImage.id}-${Date.now()}`,
      },
    ]);
  };

  const removeImage = (imageId: string) => {
    setImages((currentImages) =>
      currentImages.filter((image) => image.id !== imageId),
    );
  };

  const reorderImage = (targetImageId: string) => {
    if (!draggedImageId || draggedImageId === targetImageId) {
      return;
    }

    setImages((currentImages) => {
      const draggedIndex = currentImages.findIndex(
        (image) => image.id === draggedImageId,
      );
      const targetIndex = currentImages.findIndex(
        (image) => image.id === targetImageId,
      );

      if (draggedIndex === -1 || targetIndex === -1) {
        return currentImages;
      }

      const reorderedImages = [...currentImages];
      const [draggedImage] = reorderedImages.splice(draggedIndex, 1);
      reorderedImages.splice(targetIndex, 0, draggedImage);
      return reorderedImages;
    });
  };

  return (
    <>
      <Card padding="0">
        <BlockStack gap="0">
          <div
            style={{
              aspectRatio: "4 / 3",
              background: "#f1f2f4",
              overflow: "hidden",
            }}
          >
            {primaryImage ? (
              <img
                src={primaryImage.url}
                alt={primaryImage.alt}
                style={{
                  display: "block",
                  height: "100%",
                  objectFit: "cover",
                  width: "100%",
                }}
              />
            ) : (
              <InlineStack align="center" blockAlign="center">
                <Box paddingBlockStart="1200">
                  <Text as="p" tone="subdued">
                    No product image
                  </Text>
                </Box>
              </InlineStack>
            )}
          </div>

          <Box padding="400">
            <BlockStack gap="400">
              <BlockStack gap="200">
                <InlineStack align="space-between" blockAlign="start" gap="200">
                  <BlockStack gap="100">
                    <Text as="h2" variant="headingMd">
                      {product.title}
                    </Text>
                    <Text as="p" variant="bodyMd" tone="subdued">
                      {product.inventory > 0
                        ? `${product.inventory} in stock`
                        : "Out of stock"}
                    </Text>
                  </BlockStack>
                  <Badge tone={product.status === "Active" ? "success" : undefined}>
                    {product.status}
                  </Badge>
                </InlineStack>

                <InlineStack gap="200">
                  {product.tags.map((tag) => (
                    <Badge key={tag}>{tag}</Badge>
                  ))}
                </InlineStack>
              </BlockStack>

              <Divider />

              <BlockStack gap="300">
                <InlineStack align="space-between" blockAlign="center">
                  <Text as="h3" variant="headingSm">
                    Images
                  </Text>
                  <Button icon={ImageAddIcon} onClick={addImage}>
                    Add image
                  </Button>
                </InlineStack>

                <InlineGrid gap="300" columns={3}>
                  {images.map((image) => (
                    <div
                      key={image.id}
                      draggable
                      onDragStart={() => setDraggedImageId(image.id)}
                      onDragOver={(event) => event.preventDefault()}
                      onDrop={() => reorderImage(image.id)}
                      onDragEnd={() => setDraggedImageId(null)}
                      style={{
                        border: "1px solid #d4d7db",
                        borderRadius: 8,
                        overflow: "hidden",
                      }}
                    >
                      <div style={{ aspectRatio: "1 / 1", background: "#f6f6f7" }}>
                        <img
                          src={image.url}
                          alt={image.alt}
                          style={{
                            display: "block",
                            height: "100%",
                            objectFit: "cover",
                            width: "100%",
                          }}
                        />
                      </div>
                      <Box padding="150">
                        <InlineStack align="space-between" blockAlign="center">
                          <ButtonGroup variant="segmented">
                            <Button
                              icon={DragHandleIcon}
                              accessibilityLabel="Drag to reorder image"
                            />
                            <Button
                              icon={EditIcon}
                              accessibilityLabel="Edit image"
                              onClick={() => setEditingImage(image)}
                            />
                            <Button
                              icon={DeleteIcon}
                              accessibilityLabel="Remove image"
                              tone="critical"
                              onClick={() => removeImage(image.id)}
                            />
                          </ButtonGroup>
                        </InlineStack>
                      </Box>
                    </div>
                  ))}
                </InlineGrid>
              </BlockStack>

              <Button
                url={`shopify:admin/products/${product.id}`}
                icon={ExternalIcon}
                variant="primary"
              >
                Edit product
              </Button>
            </BlockStack>
          </Box>
        </BlockStack>
      </Card>

      <Modal
        open={Boolean(editingImage)}
        onClose={() => setEditingImage(null)}
        title="Edit image"
        primaryAction={{
          content: "Save changes",
          onAction: () => setEditingImage(null),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: () => setEditingImage(null),
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="500">
            {editingImage && (
              <div
                style={{
                  aspectRatio: "16 / 9",
                  background: "#f6f6f7",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <img
                  src={editingImage.url}
                  alt={editingImage.alt}
                  style={{
                    display: "block",
                    height: "100%",
                    objectFit: "cover",
                    width: "100%",
                  }}
                />
              </div>
            )}

            <TextField
              label="AI prompt"
              value={prompt}
              onChange={setPrompt}
              autoComplete="off"
              prefix={<MagicIcon />}
              placeholder="Describe the product image adjustment"
            />

            <InlineGrid gap="300" columns={{ xs: 1, sm: 3 }}>
              <Button icon={CropIcon}>Crop</Button>
              <Button icon={RotateRightIcon}>Rotate</Button>
              <Button icon={MagicIcon}>Enhance</Button>
            </InlineGrid>

            <RangeSlider
              label="Contrast"
              value={contrast}
              min={0}
              max={100}
              output
              onChange={(value) => setContrast(Number(value))}
            />
          </BlockStack>
        </Modal.Section>
      </Modal>
    </>
  );
}
