export type ProductOverlayKind = "draft" | "few_stock" | "best_seller" | null;

export type ProductListItem = {
  id: string;
  legacyResourceId: string;
  title: string;
  featuredImageUrl: string | null;
  imageUrls: string[];
  mediaCount: number;
  mediaPreviewUrls: string[];
  priceFormatted: string;
  overlay: ProductOverlayKind;
  adminEditUrl: string;
};
