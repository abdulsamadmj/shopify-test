import type {
  ComponentProps,
  CSSProperties,
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
  DragHandleIcon,
  EditIcon,
} from "@shopify/polaris-icons";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  horizontalListSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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

/** Fixed hero media height (px); image uses object-fit within this frame. */
const HERO_IMAGE_HEIGHT_PX = 220;

/** Fixed strip thumbnail size (px); matches prior `Thumbnail` small footprint. */
const STRIP_THUMB_SIZE_PX = 40;

const HERO_IMAGE_STYLE: CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  objectFit: "cover",
};

const STRIP_THUMB_FRAME_STYLE: CSSProperties = {
  width: STRIP_THUMB_SIZE_PX,
  height: STRIP_THUMB_SIZE_PX,
  flexShrink: 0,
  overflow: "hidden",
  borderRadius: "var(--p-border-radius-200)",
};

const STRIP_THUMB_IMAGE_STYLE: CSSProperties = {
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
  touchAction: "none",
};

const DRAG_HANDLE_OVERLAY_STYLE: CSSProperties = {
  ...DRAG_HANDLE_STYLE,
  cursor: "grabbing",
};

const MEDIA_ROW_STYLE: CSSProperties = {
  display: "flex",
  flexDirection: "row",
  alignItems: "stretch",
  gap: "var(--p-space-100)",
};

const OVERLAY_ROW_STYLE: CSSProperties = {
  ...MEDIA_ROW_STYLE,
  cursor: "grabbing",
};

type MediaThumbBodyProps = {
  row: MediaRow;
  onEdit: (url: string, rowId: string) => void;
  onRemove: (rowId: string) => void;
  handleRef?: (element: HTMLElement | null) => void;
  handleAttributes?: DraggableAttributes;
  handleListeners?: DraggableSyntheticListeners;
  isOverlay?: boolean;
};

function MediaThumbBody({
  row,
  onEdit,
  onRemove,
  handleRef,
  handleAttributes,
  handleListeners,
  isOverlay,
}: MediaThumbBodyProps) {
  return (
    <>
      <div
        ref={handleRef}
        {...(handleAttributes ?? {})}
        {...(handleListeners ?? {})}
        style={isOverlay ? DRAG_HANDLE_OVERLAY_STYLE : DRAG_HANDLE_STYLE}
        aria-label="Drag to reorder"
      >
        <DragHandleIcon width={16} height={16} />
      </div>
      <div style={THUMB_WRAP_STYLE}>
        <div
          role="button"
          tabIndex={isOverlay ? -1 : 0}
          onClick={() => onEdit(row.url, row.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              onEdit(row.url, row.id);
            }
          }}
          style={{
            cursor: "pointer",
            ...STRIP_THUMB_FRAME_STYLE,
          }}
        >
          <img
            src={row.url}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            style={STRIP_THUMB_IMAGE_STYLE}
          />
        </div>
        <div style={THUMB_ACTIONS_STYLE}>
          <Button
            icon={DeleteIcon}
            variant="plain"
            tone="critical"
            size="micro"
            accessibilityLabel="Remove image"
            onClick={() => onRemove(row.id)}
          />
        </div>
      </div>
    </>
  );
}

type SortableMediaThumbProps = {
  row: MediaRow;
  onEdit: (url: string, rowId: string) => void;
  onRemove: (rowId: string) => void;
};

function SortableMediaThumb({
  row,
  onEdit,
  onRemove,
}: SortableMediaThumbProps) {
  const {
    setNodeRef,
    setActivatorNodeRef,
    attributes,
    listeners,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style: CSSProperties = {
    ...MEDIA_ROW_STYLE,
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <MediaThumbBody
        row={row}
        onEdit={onEdit}
        onRemove={onRemove}
        handleRef={setActivatorNodeRef}
        handleAttributes={attributes}
        handleListeners={listeners}
      />
    </div>
  );
}

function MediaThumbPreview({ row }: { row: MediaRow }) {
  const noop = () => {};
  return (
    <div style={OVERLAY_ROW_STYLE}>
      <MediaThumbBody row={row} onEdit={noop} onRemove={noop} isOverlay />
    </div>
  );
}

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

  const [activeId, setActiveId] = useState<string | null>(null);
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeRow = activeId
    ? (mediaRows.find((r) => r.id === activeId) ?? null)
    : null;

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

  const handleEditApply = useCallback(
    (newBlobUrl: string) => {
      if (!editMediaRowId) return;
      setMediaRows((prev) =>
        prev.map((r) => {
          if (r.id !== editMediaRowId) return r;
          if (r.url.startsWith("blob:")) URL.revokeObjectURL(r.url);
          return { ...r, url: newBlobUrl };
        }),
      );
    },
    [editMediaRowId],
  );

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

  const handleStripRemove = useCallback((rowId: string) => {
    setStripRemoveRowId(rowId);
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMediaRows((rows) => {
        const oldIndex = rows.findIndex((r) => r.id === active.id);
        const newIndex = rows.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return rows;
        return arrayMove(rows, oldIndex, newIndex);
      });
    }
    setActiveId(null);
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveId(null);
  }, []);

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
        onEditApply={handleEditApply}
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
                height: HERO_IMAGE_HEIGHT_PX,
                overflow: "hidden",
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
                    draggable={false}
                    style={HERO_IMAGE_STYLE}
                  />
                </div>
              ) : (
                <Box
                  width="100%"
                  background="bg-fill-secondary"
                  minHeight={`${HERO_IMAGE_HEIGHT_PX}px`}
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
                          <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragStart={handleDragStart}
                            onDragEnd={handleDragEnd}
                            onDragCancel={handleDragCancel}
                          >
                            <InlineStack gap="200" blockAlign="center" wrap>
                              <SortableContext
                                items={mediaRows.map((r) => r.id)}
                                strategy={horizontalListSortingStrategy}
                              >
                                {mediaRows.map((row) => (
                                  <SortableMediaThumb
                                    key={row.id}
                                    row={row}
                                    onEdit={openEditModal}
                                    onRemove={handleStripRemove}
                                  />
                                ))}
                              </SortableContext>
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={openImportModal}
                                onKeyDown={handleAddSlotKeyDown}
                                style={{ cursor: "pointer" }}
                              >
                                <div
                                  style={{
                                    padding: "var(--p-space-100)",
                                    borderWidth: "var(--p-border-width-025)",
                                    borderStyle: "dashed",
                                    borderColor: "var(--p-color-border)",
                                    borderRadius: "var(--p-border-radius-200)",
                                    background:
                                      "var(--p-color-bg-surface-secondary)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: STRIP_THUMB_SIZE_PX,
                                      height: STRIP_THUMB_SIZE_PX,
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                    }}
                                  >
                                    <Thumbnail
                                      source={CameraIcon}
                                      alt="Add image"
                                      size="small"
                                      transparent
                                    />
                                  </div>
                                </div>
                              </div>
                            </InlineStack>
                            <DragOverlay>
                              {activeRow ? (
                                <MediaThumbPreview row={activeRow} />
                              ) : null}
                            </DragOverlay>
                          </DndContext>
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
