import type {
  ComponentProps,
  CSSProperties,
  DragEvent,
  KeyboardEvent,
} from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import {
  CameraIcon,
  DeleteIcon,
  EditIcon,
  MenuVerticalIcon,
} from "@shopify/polaris-icons";
import { invokeProductEditIntent } from "../lib/invokeProductEditIntent.client";
import type { ProductListItem, ProductOverlayKind } from "../lib/productList";
import { ConfirmAlertDialog } from "./ConfirmAlertDialog";
import { ProductImageEditModal } from "./ProductImageEditModal";

type BadgeTone = NonNullable<ComponentProps<typeof Badge>["tone"]>;

type MediaRow = {
  id: string;
  url: string;
};

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

function newMediaRow(url: string): MediaRow {
  return {
    id:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${url}-${Date.now()}-${Math.random()}`,
    url,
  };
}

export type ProductCardProps = {
  product: ProductListItem;
};

const MEDIA_IMAGE_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const THUMB_WRAP_STYLE: CSSProperties = {
  position: "relative",
  display: "inline-block",
};

const THUMB_ACTIONS_STYLE: CSSProperties = {
  position: "absolute",
  insetBlockStart: 0,
  insetInlineEnd: 0,
  display: "flex",
  gap: 2,
  zIndex: 1,
};

const DRAG_HANDLE_STYLE: CSSProperties = {
  cursor: "grab",
  display: "flex",
  alignItems: "center",
  alignSelf: "center",
  padding: "2px",
  color: "var(--p-color-icon-secondary)",
};

const MEDIA_ROW_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  gap: "var(--p-space-100)",
};

export function ProductCard({ product }: ProductCardProps) {
  const {
    id,
    title,
    featuredImageUrl,
    mediaPreviewUrls,
    priceFormatted,
    overlay,
    adminEditUrl,
  } = product;

  const serverMediaKey = useMemo(
    () => mediaPreviewUrls.join("\u001f"),
    [mediaPreviewUrls],
  );

  const [mediaRows, setMediaRows] = useState<MediaRow[]>(() =>
    mediaPreviewUrls.map((url) => newMediaRow(url)),
  );

  useEffect(() => {
    setMediaRows((prev) => {
      for (const r of prev) {
        if (r.url.startsWith("blob:")) {
          URL.revokeObjectURL(r.url);
        }
      }
      return mediaPreviewUrls.map((url) => newMediaRow(url));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint `serverMediaKey` avoids reference-only churn
  }, [id, serverMediaKey]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editModalVariant, setEditModalVariant] = useState<
    "edit" | "import"
  >("edit");
  const [editImageUrl, setEditImageUrl] = useState<string | null>(null);
  const [editMediaRowId, setEditMediaRowId] = useState<string | null>(null);
  const [stripRemoveRowId, setStripRemoveRowId] = useState<string | null>(
    null,
  );

  const heroUrl = mediaRows[0]?.url ?? featuredImageUrl;

  const openImportModal = useCallback(() => {
    setEditModalVariant("import");
    setEditImageUrl(null);
    setEditModalOpen(true);
  }, []);

  const removeImage = useCallback((rowId: string) => {
    setMediaRows((prev) => {
      const row = prev.find((r) => r.id === rowId);
      if (row?.url.startsWith("blob:")) {
        URL.revokeObjectURL(row.url);
      }
      return prev.filter((r) => r.id !== rowId);
    });
  }, []);

  const moveRow = useCallback((fromId: string, toId: string) => {
    if (fromId === toId) return;
    setMediaRows((prev) => {
      const fromIdx = prev.findIndex((r) => r.id === fromId);
      const toIdx = prev.findIndex((r) => r.id === toId);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const next = [...prev];
      const [removed] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, removed);
      return next;
    });
  }, []);

  const openEditModal = useCallback(
    (url: string, explicitRowId?: string | null) => {
      const resolvedRowId =
        explicitRowId !== undefined && explicitRowId !== null
          ? explicitRowId
          : (mediaRows.find((r) => r.url === url)?.id ?? null);
      setEditModalVariant("edit");
      setEditImageUrl(url);
      setEditMediaRowId(resolvedRowId);
      setEditModalOpen(true);
    },
    [mediaRows],
  );

  const closeEditModal = useCallback(() => {
    setEditModalOpen(false);
    setEditImageUrl(null);
    setEditMediaRowId(null);
    setEditModalVariant("edit");
  }, []);

  const handleImportApply = useCallback((localPreviewUrl: string) => {
    setMediaRows((prev) => [...prev, newMediaRow(localPreviewUrl)]);
  }, []);

  const handleAddSlotKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openImportModal();
    }
  };

  const heroMediaRowId =
    mediaRows.find((r) => r.url === heroUrl)?.id ?? null;

  const handleHeroKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!heroUrl) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openEditModal(heroUrl, heroMediaRowId);
    }
  };

  const badge = overlayBadge(overlay);

  return (
    <div
      style={{
        height: "100%",
        minHeight: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <ProductImageEditModal
        open={editModalOpen}
        onClose={closeEditModal}
        variant={editModalVariant}
        imageUrl={editImageUrl}
        imageAlt={title}
        onImportApply={handleImportApply}
        onRemoveImage={
          editMediaRowId
            ? () => {
                removeImage(editMediaRowId);
                closeEditModal();
              }
            : undefined
        }
      />

      <ConfirmAlertDialog
        open={stripRemoveRowId !== null}
        title="Remove image?"
        message="Remove this image from the product's media strip? You can add images again from the strip."
        onClose={() => setStripRemoveRowId(null)}
        onConfirm={() => {
          if (stripRemoveRowId) {
            removeImage(stripRemoveRowId);
          }
        }}
      />
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
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "4 / 3",
              }}
            >
              {heroUrl ? (
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => openEditModal(heroUrl, heroMediaRowId)}
                  onKeyDown={handleHeroKeyDown}
                  style={{
                    width: "100%",
                    height: "100%",
                    cursor: "pointer",
                  }}
                >
                  <img
                    src={heroUrl}
                    alt={title}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    style={MEDIA_IMAGE_STYLE}
                  />
                </div>
              ) : (
                <Box
                  width="100%"
                  minHeight="100%"
                  background="bg-fill-secondary"
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
            </div>

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
                        Media ({mediaRows.length})
                      </Text>
                      <InlineStack
                        align="start"
                        blockAlign="center"
                        gap="200"
                        wrap
                      >
                        <Box minWidth="0">
                          <InlineStack gap="200" blockAlign="center" wrap>
                            {mediaRows.map((row) => (
                              <div
                                key={row.id}
                                style={MEDIA_ROW_STYLE}
                                onDragOver={(e: DragEvent<HTMLDivElement>) => {
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                  setDragOverId(row.id);
                                }}
                                onDragLeave={() => {
                                  setDragOverId((current) =>
                                    current === row.id ? null : current,
                                  );
                                }}
                                onDrop={(e: DragEvent<HTMLDivElement>) => {
                                  e.preventDefault();
                                  const fromId =
                                    e.dataTransfer.getData("text/plain") ||
                                    draggingId;
                                  if (fromId) moveRow(fromId, row.id);
                                  setDraggingId(null);
                                  setDragOverId(null);
                                }}
                              >
                                <div
                                  draggable
                                  onDragStart={(e) => {
                                    setDraggingId(row.id);
                                    e.dataTransfer.effectAllowed = "move";
                                    e.dataTransfer.setData("text/plain", row.id);
                                  }}
                                  onDragEnd={() => {
                                    setDraggingId(null);
                                    setDragOverId(null);
                                  }}
                                  style={DRAG_HANDLE_STYLE}
                                  aria-label="Drag to reorder"
                                >
                                  <MenuVerticalIcon width={16} height={16} />
                                </div>
                                <div
                                  style={{
                                    opacity: draggingId === row.id ? 0.55 : 1,
                                    outlineOffset: 2,
                                    outline:
                                      dragOverId === row.id &&
                                      draggingId !== row.id
                                        ? "2px solid var(--p-color-border-focus)"
                                        : undefined,
                                    borderRadius: "var(--p-border-radius-200)",
                                  }}
                                >
                                  <div style={THUMB_WRAP_STYLE}>
                                    <div
                                      role="button"
                                      tabIndex={0}
                                      onClick={() =>
                                        openEditModal(row.url, row.id)
                                      }
                                      onKeyDown={(event) => {
                                        if (
                                          event.key === "Enter" ||
                                          event.key === " "
                                        ) {
                                          event.preventDefault();
                                          openEditModal(row.url, row.id);
                                        }
                                      }}
                                      style={{ cursor: "pointer" }}
                                    >
                                      <Thumbnail
                                        source={row.url}
                                        alt=""
                                        size="small"
                                      />
                                    </div>
                                    <div
                                      style={THUMB_ACTIONS_STYLE}
                                      onMouseDown={(event) =>
                                        event.stopPropagation()
                                      }
                                    >
                                      <Button
                                        icon={DeleteIcon}
                                        variant="plain"
                                        tone="critical"
                                        size="micro"
                                        accessibilityLabel="Remove image"
                                        onClick={() =>
                                          setStripRemoveRowId(row.id)
                                        }
                                      />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={openImportModal}
                              onKeyDown={handleAddSlotKeyDown}
                              style={{ cursor: "pointer" }}
                            >
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
                                  alt="Add image"
                                  size="small"
                                  transparent
                                />
                              </Box>
                            </div>
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
