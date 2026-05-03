import type { CSSProperties, SyntheticEvent } from "react";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import {
  Banner,
  BlockStack,
  Box,
  Button,
  ButtonGroup,
  Divider,
  DropZone,
  InlineGrid,
  InlineStack,
  Modal,
  Text,
  TextField,
  Tooltip,
} from "@shopify/polaris";
import {
  ArrowsInHorizontalIcon,
  CropIcon,
  FlipHorizontalIcon,
  MagicIcon,
  RotateRightIcon,
} from "@shopify/polaris-icons";
import ReactCrop, {
  convertToPixelCrop,
  type PercentCrop,
  type PixelCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";

import { ConfirmAlertDialog } from "./ConfirmAlertDialog";

/** Image only; max height must stay in sync with ReactCrop root `style` below. */
const PREVIEW_IMG_STYLE: CSSProperties = {
  display: "block",
  maxWidth: "100%",
  width: "auto",
  height: "auto",
  maxHeight: "320px",
  objectFit: "contain",
};

const IMPORT_PREVIEW_IMG_STYLE: CSSProperties = {
  ...PREVIEW_IMG_STYLE,
  maxHeight: "280px",
};

/** Root `.ReactCrop` must bound height so `.ReactCrop__child-wrapper` `max-height: inherit` matches the bitmap (see library CSS). */
const REACT_CROP_ROOT_EDIT: CSSProperties = {
  maxWidth: "100%",
  maxHeight: "320px",
};

const REACT_CROP_ROOT_IMPORT: CSSProperties = {
  maxWidth: "100%",
  maxHeight: "280px",
};

/** Centers the inline-block ReactCrop under a bounded column. */
const PREVIEW_CENTER_WRAP: CSSProperties = {
  width: "100%",
  textAlign: "center",
  paddingBlock: "var(--p-space-300)",
};

const FULL_PERCENT_CROP: PercentCrop = {
  unit: "%",
  x: 0,
  y: 0,
  width: 100,
  height: 100,
};

function isEssentiallyFullCrop(crop: PercentCrop | undefined): boolean {
  if (!crop || crop.unit !== "%") return true;
  const tol = 0.75;
  return (
    crop.x <= tol &&
    crop.y <= tol &&
    crop.width >= 100 - tol &&
    crop.height >= 100 - tol
  );
}

function loadImage(src: string, crossOrigin: boolean): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    if (crossOrigin) img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Image failed to load"));
    img.src = src;
  });
}

async function rotateImage90CW(src: string): Promise<string> {
  const img = await loadImage(src, true);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = h;
  canvas.height = w;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.translate(canvas.width, 0);
  ctx.rotate(Math.PI / 2);
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Rotation export failed");
  return URL.createObjectURL(blob);
}

async function mirrorImageHorizontal(src: string): Promise<string> {
  const img = await loadImage(src, true);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(img, 0, 0);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Mirror export failed");
  return URL.createObjectURL(blob);
}

async function exportCroppedBlobUrl(
  image: HTMLImageElement,
  percentCrop: PercentCrop,
  mimeType: string,
): Promise<string> {
  const cw = image.clientWidth || image.width;
  const ch = image.clientHeight || image.height;
  const scaleX = image.naturalWidth / cw;
  const scaleY = image.naturalHeight / ch;
  const pixelCrop = convertToPixelCrop(percentCrop, cw, ch);
  const sx = pixelCrop.x * scaleX;
  const sy = pixelCrop.y * scaleY;
  const sw = pixelCrop.width * scaleX;
  const sh = pixelCrop.height * scaleY;
  const outW = Math.max(1, Math.round(sw));
  const outH = Math.max(1, Math.round(sh));
  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not get canvas context");
  ctx.drawImage(image, sx, sy, sw, sh, 0, 0, outW, outH);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, mimeType),
  );
  if (!blob) {
    throw new Error("Canvas export failed (possible CORS restriction)");
  }
  return URL.createObjectURL(blob);
}

export type ProductImageEditModalVariant = "edit" | "import";

export type ProductImageEditModalProps = {
  open: boolean;
  onClose: () => void;
  variant: ProductImageEditModalVariant;
  imageUrl: string | null;
  imageAlt: string;
  /** When variant is import, called with a blob URL; caller owns the URL until revoked. */
  onImportApply?: (localPreviewUrl: string) => void;
  /** Edit variant: replace edited image with a new blob URL; caller owns the URL until revoked. */
  onEditApply?: (localPreviewUrl: string) => void;
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
  onEditApply,
  onRemoveImage,
}: ProductImageEditModalProps) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [importPreviewUrl, setImportPreviewUrl] = useState<string | null>(
    null,
  );
  const [editWorkingUrl, setEditWorkingUrl] = useState<string | null>(null);
  const [crop, setCrop] = useState<PercentCrop>();
  const [completedCrop, setCompletedCrop] = useState<PercentCrop | undefined>();
  /** When false, preview shows a plain centered image (no crop handles). */
  const [cropModeActive, setCropModeActive] = useState(false);
  const [hasPixelMutation, setHasPixelMutation] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [applyBusy, setApplyBusy] = useState(false);
  const [applyCropBusy, setApplyCropBusy] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [importRemoveConfirmOpen, setImportRemoveConfirmOpen] =
    useState(false);
  const [editRemoveConfirmOpen, setEditRemoveConfirmOpen] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const cropModeActiveRef = useRef(false);
  const [mediaKey, setMediaKey] = useState(0);

  cropModeActiveRef.current = cropModeActive;

  const displaySrc =
    variant === "import"
      ? importPreviewUrl
      : (editWorkingUrl ?? imageUrl);

  const resetCropState = useCallback(() => {
    setCrop(undefined);
    setCompletedCrop(undefined);
    setImageReady(false);
  }, []);

  useEffect(() => {
    if (!open) {
      setImportRemoveConfirmOpen(false);
      setEditRemoveConfirmOpen(false);
      setExportError(null);
      setApplyBusy(false);
      setApplyCropBusy(false);
      setCropModeActive(false);
      setHasPixelMutation(false);
      return;
    }
    setAiPrompt("");
    setExportError(null);
    setEditWorkingUrl(null);
    setHasPixelMutation(false);
    setCropModeActive(false);
    resetCropState();
    setMediaKey((k) => k + 1);
    if (variant === "import") {
      setImportPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, variant, resetCropState]);

  useEffect(() => {
    if (open) return;
    setImportPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setEditWorkingUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, [open]);

  const dismissModal = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleDropAccepted = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    setImportPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
    setHasPixelMutation(false);
    setCropModeActive(false);
    resetCropState();
    setMediaKey((k) => k + 1);
  }, [resetCropState]);

  const clearImportSelection = useCallback(() => {
    setImportPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setHasPixelMutation(false);
    setCropModeActive(false);
    resetCropState();
    setMediaKey((k) => k + 1);
  }, [resetCropState]);

  const handleImageLoad = useCallback(
    (event: SyntheticEvent<HTMLImageElement>) => {
      imgRef.current = event.currentTarget;
      setImageReady(true);
      if (cropModeActiveRef.current) {
        setCrop(FULL_PERCENT_CROP);
        setCompletedCrop(FULL_PERCENT_CROP);
      } else {
        setCrop(undefined);
        setCompletedCrop(undefined);
      }
    },
    [],
  );

  const handleCropChange = useCallback(
    (_pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
      if (!cropModeActiveRef.current) return;
      setCrop(percentCrop);
    },
    [],
  );

  const handleCropComplete = useCallback(
    (_pixelCrop: PixelCrop, percentCrop: PercentCrop) => {
      if (!cropModeActiveRef.current) return;
      setCompletedCrop(percentCrop);
    },
    [],
  );

  const effectivePercentCrop = completedCrop ?? crop ?? FULL_PERCENT_CROP;

  const isDirty = useCallback(() => {
    return !isEssentiallyFullCrop(effectivePercentCrop) || hasPixelMutation;
  }, [effectivePercentCrop, hasPixelMutation]);

  const applyPixelTransform = useCallback(
    async (transform: (src: string) => Promise<string>) => {
      const src = displaySrc;
      if (!src) return;
      setExportError(null);
      try {
        const next = await transform(src);
        if (variant === "import") {
          setImportPreviewUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return next;
          });
        } else {
          setEditWorkingUrl((prev) => {
            if (prev) URL.revokeObjectURL(prev);
            return next;
          });
        }
        setHasPixelMutation(true);
        resetCropState();
        setMediaKey((k) => k + 1);
      } catch {
        setExportError(
          "Could not transform this image. Try a different file or check network/CORS.",
        );
      }
    },
    [displaySrc, variant, resetCropState],
  );

  const handleRotate = useCallback(() => {
    void applyPixelTransform(rotateImage90CW);
  }, [applyPixelTransform]);

  const handleMirrorHorizontal = useCallback(() => {
    void applyPixelTransform(mirrorImageHorizontal);
  }, [applyPixelTransform]);

  const handleResetCrop = useCallback(() => {
    setCrop(FULL_PERCENT_CROP);
    setCompletedCrop(FULL_PERCENT_CROP);
  }, []);

  const handleToggleCropMode = useCallback(() => {
    setCropModeActive((active) => {
      if (active) {
        setCrop(undefined);
        setCompletedCrop(undefined);
        return false;
      }
      return true;
    });
  }, []);

  useEffect(() => {
    if (!cropModeActive || !displaySrc) return;
    const img = imgRef.current;
    if (!img?.complete || img.naturalWidth === 0) return;
    setCrop(FULL_PERCENT_CROP);
    setCompletedCrop(FULL_PERCENT_CROP);
  }, [cropModeActive, displaySrc, mediaKey]);

  const handleApplyCrop = useCallback(async () => {
    if (!cropModeActive || !displaySrc) return;
    const img = imgRef.current;
    if (!img || !imageReady) return;
    const pct = effectivePercentCrop;
    if (isEssentiallyFullCrop(pct)) {
      setCropModeActive(false);
      return;
    }
    setExportError(null);
    setApplyCropBusy(true);
    try {
      const outUrl = await exportCroppedBlobUrl(img, pct, "image/png");
      if (variant === "import") {
        setImportPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return outUrl;
        });
      } else {
        setEditWorkingUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return outUrl;
        });
      }
      setHasPixelMutation(true);
      setCropModeActive(false);
      resetCropState();
      setMediaKey((k) => k + 1);
    } catch {
      setExportError(
        "Could not apply crop. Remote images may need CORS headers from the host.",
      );
    } finally {
      setApplyCropBusy(false);
    }
  }, [
    cropModeActive,
    displaySrc,
    imageReady,
    effectivePercentCrop,
    variant,
    resetCropState,
  ]);

  const handleImportApply = useCallback(async () => {
    if (!importPreviewUrl || !onImportApply) return;
    setExportError(null);
    setApplyBusy(true);
    try {
      if (!isDirty()) {
        const url = importPreviewUrl;
        setImportPreviewUrl(null);
        onImportApply(url);
        onClose();
        return;
      }
      const img = imgRef.current;
      if (!img || !imageReady) {
        throw new Error("Image is not ready to export yet.");
      }
      const outUrl = await exportCroppedBlobUrl(
        img,
        effectivePercentCrop,
        "image/png",
      );
      URL.revokeObjectURL(importPreviewUrl);
      setImportPreviewUrl(null);
      onImportApply(outUrl);
      onClose();
    } catch {
      setExportError(
        "Could not process this image. It may be blocked by CORS when loaded from a remote URL.",
      );
    } finally {
      setApplyBusy(false);
    }
  }, [
    importPreviewUrl,
    onImportApply,
    isDirty,
    onClose,
    imageReady,
    effectivePercentCrop,
  ]);

  const handleEditApply = useCallback(async () => {
    if (!onEditApply || !displaySrc || !imageUrl) {
      onClose();
      return;
    }
    setExportError(null);
    if (!isDirty()) {
      onClose();
      return;
    }
    setApplyBusy(true);
    try {
      const fullCrop = isEssentiallyFullCrop(effectivePercentCrop);
      const blobHandoff =
        fullCrop &&
        hasPixelMutation &&
        displaySrc.startsWith("blob:") &&
        variant === "edit";

      if (blobHandoff) {
        onEditApply(displaySrc);
        setEditWorkingUrl(null);
        onClose();
        return;
      }

      const img = imgRef.current;
      if (!img || !imageReady) {
        throw new Error("Image is not ready to export yet.");
      }
      const outUrl = await exportCroppedBlobUrl(
        img,
        effectivePercentCrop,
        "image/png",
      );
      if (editWorkingUrl) URL.revokeObjectURL(editWorkingUrl);
      setEditWorkingUrl(null);
      onEditApply(outUrl);
      onClose();
    } catch {
      setExportError(
        "Could not apply changes. Cropping remote images may require CORS headers from the host.",
      );
    } finally {
      setApplyBusy(false);
    }
  }, [
    onEditApply,
    displaySrc,
    imageUrl,
    isDirty,
    effectivePercentCrop,
    hasPixelMutation,
    variant,
    imageReady,
    editWorkingUrl,
    onClose,
  ]);

  const modalTitle = variant === "import" ? "Add media" : "Edit media";

  const showCropper =
    Boolean(displaySrc) && (variant === "edit" ? Boolean(imageUrl) : true);

  const canApplyImport = Boolean(importPreviewUrl) && (imageReady || !showCropper);

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
          disabled:
            variant === "import"
              ? !canApplyImport || applyBusy || applyCropBusy
              : !imageUrl ||
                applyBusy ||
                applyCropBusy ||
                (isDirty() && !imageReady),
          loading: applyBusy,
          onAction: () => {
            if (variant === "import") {
              void handleImportApply();
            } else {
              void handleEditApply();
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
              {exportError ? (
                <Box paddingBlockEnd="300">
                  <Banner tone="critical" onDismiss={() => setExportError(null)}>
                    <p>{exportError}</p>
                  </Banner>
                </Box>
              ) : null}
              {variant === "import" ? (
                importPreviewUrl ? (
                  <BlockStack gap="300">
                    <div
                      style={{
                        position: "relative",
                        maxWidth: "100%",
                        borderRadius: "var(--p-border-radius-100)",
                        background: "var(--p-color-bg-fill)",
                        overflowX: "hidden",
                        overflowY: cropModeActive ? "visible" : "hidden",
                      }}
                    >
                      {showCropper ? (
                        <div style={PREVIEW_CENTER_WRAP}>
                          <ReactCrop
                            key={`preview-${mediaKey}-${importPreviewUrl}`}
                            crop={cropModeActive ? crop : undefined}
                            disabled={!cropModeActive}
                            onChange={handleCropChange}
                            onComplete={handleCropComplete}
                            ruleOfThirds={cropModeActive}
                            style={REACT_CROP_ROOT_IMPORT}
                          >
                            <img
                              ref={imgRef}
                              src={importPreviewUrl}
                              alt=""
                              crossOrigin="anonymous"
                              draggable={false}
                              style={IMPORT_PREVIEW_IMG_STYLE}
                              onLoad={handleImageLoad}
                            />
                          </ReactCrop>
                        </div>
                      ) : null}
                    </div>
                    <BlockStack gap="150">
                      <InlineStack
                        align={cropModeActive ? "space-between" : "start"}
                        blockAlign="center"
                        wrap
                      >
                        <Button
                          tone="critical"
                          onClick={() => setImportRemoveConfirmOpen(true)}
                        >
                          Remove image
                        </Button>
                        {cropModeActive ? (
                          <Button
                            variant="primary"
                            onClick={() => {
                              void handleApplyCrop();
                            }}
                            loading={applyCropBusy}
                            disabled={
                              !displaySrc ||
                              !imageReady ||
                              isEssentiallyFullCrop(effectivePercentCrop)
                            }
                          >
                            Apply crop
                          </Button>
                        ) : null}
                      </InlineStack>
                      {cropModeActive ? (
                        <Text
                          as="p"
                          variant="bodySm"
                          tone="subdued"
                          alignment="end"
                        >
                          {isEssentiallyFullCrop(effectivePercentCrop)
                            ? "Drag the handles to crop, then apply."
                            : "Saves this crop to the image. You can keep editing afterward."}
                        </Text>
                      ) : null}
                    </BlockStack>
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
                  <div
                    style={{
                      position: "relative",
                      maxWidth: "100%",
                      minHeight: "200px",
                      borderRadius: "var(--p-border-radius-100)",
                      background: "var(--p-color-bg-fill)",
                      overflowX: "hidden",
                      overflowY: cropModeActive ? "visible" : "hidden",
                    }}
                  >
                    {imageUrl && showCropper ? (
                      <div style={PREVIEW_CENTER_WRAP}>
                        <ReactCrop
                          key={`preview-${mediaKey}-${displaySrc ?? imageUrl}`}
                          crop={cropModeActive ? crop : undefined}
                          disabled={!cropModeActive}
                          onChange={handleCropChange}
                          onComplete={handleCropComplete}
                          ruleOfThirds={cropModeActive}
                          style={REACT_CROP_ROOT_EDIT}
                        >
                          <img
                            ref={imgRef}
                            src={displaySrc ?? imageUrl}
                            alt={imageAlt}
                            crossOrigin="anonymous"
                            draggable={false}
                            style={PREVIEW_IMG_STYLE}
                            onLoad={handleImageLoad}
                          />
                        </ReactCrop>
                      </div>
                    ) : imageUrl ? (
                      <div style={PREVIEW_CENTER_WRAP}>
                        <img
                          src={imageUrl}
                          alt={imageAlt}
                          crossOrigin="anonymous"
                          draggable={false}
                          style={PREVIEW_IMG_STYLE}
                        />
                      </div>
                    ) : (
                      <Box padding="800" minHeight="200px" />
                    )}
                  </div>
                  {imageUrl && onRemoveImage ? (
                    <BlockStack gap="150">
                      <InlineStack
                        align={cropModeActive ? "space-between" : "start"}
                        blockAlign="center"
                        wrap
                      >
                        <Button
                          tone="critical"
                          onClick={() => setEditRemoveConfirmOpen(true)}
                        >
                          Remove image
                        </Button>
                        {cropModeActive ? (
                          <Button
                            variant="primary"
                            onClick={() => {
                              void handleApplyCrop();
                            }}
                            loading={applyCropBusy}
                            disabled={
                              !displaySrc ||
                              !imageReady ||
                              isEssentiallyFullCrop(effectivePercentCrop)
                            }
                          >
                            Apply crop
                          </Button>
                        ) : null}
                      </InlineStack>
                      {cropModeActive ? (
                        <Text
                          as="p"
                          variant="bodySm"
                          tone="subdued"
                          alignment="end"
                        >
                          {isEssentiallyFullCrop(effectivePercentCrop)
                            ? "Drag the handles to crop, then apply."
                            : "Saves this crop to the image. You can keep editing afterward."}
                        </Text>
                      ) : null}
                    </BlockStack>
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
                <Text as="p" variant="bodySm" tone="subdued">
                  Turn on crop to adjust the frame. Mirror and rotate change the
                  image pixels.
                </Text>
                <ButtonGroup variant="segmented">
                  <Tooltip
                    content="Reset crop to the full image"
                    preferredPosition="above"
                    zIndexOverride={520}
                  >
                    <Button
                      icon={ArrowsInHorizontalIcon}
                      accessibilityLabel="Reset crop to full image"
                      onClick={handleResetCrop}
                      disabled={!displaySrc || !cropModeActive}
                    />
                  </Tooltip>
                  <Tooltip
                    content={
                      cropModeActive
                        ? "Turn off crop mode"
                        : "Turn on crop mode to show handles"
                    }
                    preferredPosition="above"
                    zIndexOverride={520}
                  >
                    <Button
                      icon={CropIcon}
                      pressed={cropModeActive}
                      accessibilityLabel={
                        cropModeActive ? "Turn off crop mode" : "Turn on crop mode"
                      }
                      onClick={handleToggleCropMode}
                      disabled={!displaySrc}
                    />
                  </Tooltip>
                  <Tooltip
                    content="Mirror horizontally"
                    preferredPosition="above"
                    zIndexOverride={520}
                  >
                    <Button
                      icon={FlipHorizontalIcon}
                      accessibilityLabel="Mirror image horizontally"
                      onClick={handleMirrorHorizontal}
                      disabled={!displaySrc}
                    />
                  </Tooltip>
                  <Tooltip
                    content="Rotate 90° clockwise"
                    preferredPosition="above"
                    zIndexOverride={520}
                  >
                    <Button
                      icon={RotateRightIcon}
                      accessibilityLabel="Rotate 90° clockwise"
                      onClick={handleRotate}
                      disabled={!displaySrc}
                    />
                  </Tooltip>
                </ButtonGroup>
              </BlockStack>
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
