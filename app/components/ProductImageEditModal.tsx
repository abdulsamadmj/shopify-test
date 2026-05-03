import type { CSSProperties } from "react";
import { Fragment, useCallback, useEffect, useState } from "react";
import {
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Divider,
  DropZone,
  InlineGrid,
  InlineStack,
  Modal,
  RangeSlider,
  Text,
  TextField,
} from "@shopify/polaris";
import {
  ArrowsOutHorizontalIcon,
  MagicIcon,
  RotateRightIcon,
} from "@shopify/polaris-icons";

import { ConfirmAlertDialog } from "./ConfirmAlertDialog";

const PREVIEW_GRID_STYLE: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  backgroundImage: `
    linear-gradient(to right, var(--p-color-border-secondary) 0%, transparent 0%),
    linear-gradient(to right, transparent calc(100% / 3 - 0.5px), var(--p-color-border-secondary) calc(100% / 3 - 0.5px), var(--p-color-border-secondary) calc(100% / 3 + 0.5px), transparent calc(100% / 3 + 0.5px)),
    linear-gradient(to right, transparent calc(200% / 3 - 0.5px), var(--p-color-border-secondary) calc(200% / 3 - 0.5px), var(--p-color-border-secondary) calc(200% / 3 + 0.5px), transparent calc(200% / 3 + 0.5px)),
    linear-gradient(to bottom, var(--p-color-border-secondary) 0%, transparent 0%),
    linear-gradient(to bottom, transparent calc(100% / 3 - 0.5px), var(--p-color-border-secondary) calc(100% / 3 - 0.5px), var(--p-color-border-secondary) calc(100% / 3 + 0.5px), transparent calc(100% / 3 + 0.5px)),
    linear-gradient(to bottom, transparent calc(200% / 3 - 0.5px), var(--p-color-border-secondary) calc(200% / 3 - 0.5px), var(--p-color-border-secondary) calc(200% / 3 + 0.5px), transparent calc(200% / 3 + 0.5px))
  `,
  opacity: 0.45,
};

export type ProductImageEditModalVariant = "edit" | "import";

export type ProductImageEditModalProps = {
  open: boolean;
  onClose: () => void;
  variant: ProductImageEditModalVariant;
  imageUrl: string | null;
  imageAlt: string;
  /** When variant is import, called with a blob URL; caller owns the URL until revoked. */
  onImportApply?: (localPreviewUrl: string) => void;
  /** Edit variant only: remove this image from the product (after confirmation). */
  onRemoveImage?: () => void;
};

export function ProductImageEditModal({
  open,
  onClose,
  variant,
  imageUrl,
  imageAlt,
  onImportApply,
  onRemoveImage,
}: ProductImageEditModalProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [contrast, setContrast] = useState(0);
  const [importPreviewUrl, setImportPreviewUrl] = useState<string | null>(
    null,
  );
  const [importRemoveConfirmOpen, setImportRemoveConfirmOpen] =
    useState(false);
  const [editRemoveConfirmOpen, setEditRemoveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setImportRemoveConfirmOpen(false);
      setEditRemoveConfirmOpen(false);
      return;
    }
    setAiPrompt("");
    setContrast(0);
    if (variant === "import") {
      setImportPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, variant]);

  const dismissModal = useCallback(() => {
    if (variant === "import" && importPreviewUrl) {
      URL.revokeObjectURL(importPreviewUrl);
      setImportPreviewUrl(null);
    }
    onClose();
  }, [variant, importPreviewUrl, onClose]);

  const handleDropAccepted = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImportPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }, []);

  const clearImportSelection = useCallback(() => {
    setImportPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  const handleImportApply = useCallback(() => {
    if (!importPreviewUrl || !onImportApply) return;
    const url = importPreviewUrl;
    setImportPreviewUrl(null);
    onImportApply(url);
    onClose();
  }, [importPreviewUrl, onImportApply, onClose]);

  const modalTitle = variant === "import" ? "Add media" : "Edit media";

  return (
    <Fragment>
    <Modal
      open={open}
      onClose={dismissModal}
      title={modalTitle}
      size="large"
      noScroll
      primaryAction={{
        content: variant === "import" ? "Add image" : "Apply changes",
        disabled: variant === "import" ? !importPreviewUrl : false,
        onAction: () => {
          if (variant === "import") {
            handleImportApply();
          } else {
            onClose();
          }
        },
      }}
      secondaryActions={[
        {
          content: "Cancel",
          onAction: dismissModal,
        },
      ]}
    >
      <Box padding="400">
        <InlineGrid
          columns={{ xs: "1fr", md: "minmax(0, 1.9fr) minmax(0, 1fr)" }}
          gap="400"
        >
          <Box
            padding="400"
            borderWidth="025"
            borderColor="border"
            borderRadius="200"
            background="bg-surface-secondary"
            position="relative"
            minHeight="240px"
          >
            {variant === "import" ? (
              importPreviewUrl ? (
                <BlockStack gap="300">
                  <Box
                    position="relative"
                    maxWidth="100%"
                    borderRadius="100"
                    overflowX="hidden"
                    overflowY="hidden"
                    background="bg-fill"
                  >
                    <img
                      src={importPreviewUrl}
                      alt=""
                      width={800}
                      height={600}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        maxHeight: "280px",
                        objectFit: "contain",
                      }}
                    />
                  </Box>
                  <InlineStack align="start">
                    <Button
                      tone="critical"
                      onClick={() => setImportRemoveConfirmOpen(true)}
                    >
                      Remove image
                    </Button>
                  </InlineStack>
                </BlockStack>
              ) : (
                <DropZone
                  accept="image/*"
                  allowMultiple={false}
                  variableHeight
                  outline
                  onDropAccepted={handleDropAccepted}
                >
                  <DropZone.FileUpload
                    actionTitle="Add image"
                    actionHint="Drop an image here, or click to browse files"
                  />
                </DropZone>
              )
            ) : (
              <BlockStack gap="300">
                <Box
                  position="relative"
                  maxWidth="100%"
                  minHeight="200px"
                  borderRadius="100"
                  overflowX="hidden"
                  overflowY="hidden"
                  background="bg-fill"
                >
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={imageAlt}
                      width={800}
                      height={600}
                      style={{
                        display: "block",
                        width: "100%",
                        height: "auto",
                        maxHeight: "320px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <Box padding="800" minHeight="200px" />
                  )}
                  <div style={PREVIEW_GRID_STYLE} aria-hidden />
                </Box>
                {imageUrl && onRemoveImage ? (
                  <InlineStack align="start">
                    <Button
                      tone="critical"
                      onClick={() => setEditRemoveConfirmOpen(true)}
                    >
                      Remove image
                    </Button>
                  </InlineStack>
                ) : null}
              </BlockStack>
            )}
          </Box>

          <BlockStack gap="400">
            <BlockStack gap="200">
              <InlineStack gap="200" blockAlign="center" wrap={false}>
                <MagicIcon width={16} height={16} />
                <Text as="h3" variant="headingSm">
                  Magic Edit
                </Text>
              </InlineStack>
              <Text as="p" variant="bodySm" tone="subdued">
                Describe what you want to change or generate in the background.
              </Text>
              <TextField
                label="Prompt"
                labelHidden
                multiline={4}
                autoComplete="off"
                placeholder="e.g. 'Place watch on a wooden desk with a coffee cup...'"
                value={aiPrompt}
                onChange={setAiPrompt}
              />
              <InlineStack align="end">
                <Button onClick={() => {}}>Generate</Button>
              </InlineStack>
            </BlockStack>

            <Divider />

            <BlockStack gap="200">
              <Text as="h3" variant="headingSm">
                Transform
              </Text>
              <ButtonGroup variant="segmented">
                <Button
                  icon={ArrowsOutHorizontalIcon}
                  accessibilityLabel="Crop"
                  onClick={() => {}}
                />
                <Button
                  icon={RotateRightIcon}
                  accessibilityLabel="Rotate"
                  onClick={() => {}}
                />
              </ButtonGroup>
            </BlockStack>

            <Divider />

            <RangeSlider
              label="Contrast"
              min={-100}
              max={100}
              value={contrast}
              output
              onChange={(value) => {
                if (typeof value === "number") setContrast(value);
              }}
            />
          </BlockStack>
        </InlineGrid>
      </Box>
    </Modal>

    <ConfirmAlertDialog
      open={importRemoveConfirmOpen}
      title="Remove image?"
      message="Remove the selected image? You can pick a different file from your computer afterward."
      onClose={() => setImportRemoveConfirmOpen(false)}
      onConfirm={clearImportSelection}
    />

    <ConfirmAlertDialog
      open={editRemoveConfirmOpen}
      title="Remove image?"
      message="Remove this image from the product's media strip? You can add images again from the strip."
      onClose={() => setEditRemoveConfirmOpen(false)}
      onConfirm={() => {
        onRemoveImage?.();
      }}
    />
    </Fragment>
  );
}
