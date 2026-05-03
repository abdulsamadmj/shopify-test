import type { ProductListItem, ProductOverlayKind } from "./productList";

const PRODUCTS_QUERY = `#graphql
  query ProductsForAppListing($first: Int!) {
    products(first: $first, sortKey: CREATED_AT, reverse: true) {
      nodes {
        id
        title
        status
        tags
        totalInventory
        featuredImage {
          url
        }
        images(first: 10) {
          nodes {
            url
          }
        }
        priceRangeV2 {
          minVariantPrice {
            amount
            currencyCode
          }
        }
      }
    }
  }
` as const;

const LOW_STOCK_THRESHOLD = 5;
const MAX_THUMB_STRIP = 4;

type GraphqlProductNode = {
  id: string;
  title: string;
  status: string;
  tags: string[];
  totalInventory: number | null;
  featuredImage: { url: string } | null;
  images: { nodes: { url: string }[] };
  priceRangeV2: {
    minVariantPrice: { amount: string; currencyCode: string };
  } | null;
};

function gidToLegacyId(gid: string): string {
  const segment = gid.split("/").pop();
  return segment ?? gid;
}

function formatPrice(amount: string, currencyCode: string): string {
  const n = Number(amount);
  if (Number.isNaN(n)) return amount;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(n);
}

function hasBestSellerTag(tags: readonly string[]): boolean {
  return tags.some((t) => {
    const k = t.trim().toLowerCase();
    return k.includes("best seller") || k === "bestseller" || k === "best-seller";
  });
}

function overlayForProduct(
  status: string,
  totalInventory: number | null,
  tags: readonly string[],
): ProductOverlayKind {
  if (status === "DRAFT") return "draft";
  if (
    totalInventory !== null &&
    totalInventory > 0 &&
    totalInventory <= LOW_STOCK_THRESHOLD
  ) {
    return "few_stock";
  }
  if (hasBestSellerTag(tags)) return "best_seller";
  return null;
}

function mapNode(node: GraphqlProductNode, shop: string): ProductListItem {
  const legacyResourceId = gidToLegacyId(node.id);
  const imageUrls = Array.from(
    new Set(
      node.images.nodes
        .map((n) => n.url)
        .filter((url): url is string => Boolean(url)),
    ),
  );
  const featured = node.featuredImage?.url ?? imageUrls[0] ?? null;
  const min = node.priceRangeV2?.minVariantPrice;
  const priceFormatted = min
    ? formatPrice(min.amount, min.currencyCode)
    : "—";

  const overlay = overlayForProduct(
    node.status,
    node.totalInventory,
    node.tags,
  );

  return {
    id: node.id,
    legacyResourceId,
    title: node.title,
    featuredImageUrl: featured,
    imageUrls,
    mediaCount: imageUrls.length,
    mediaPreviewUrls: imageUrls.slice(0, MAX_THUMB_STRIP),
    priceFormatted,
    overlay,
    adminEditUrl: `https://${shop}/admin/products/${legacyResourceId}`,
  };
}

type AdminGraphql = {
  graphql: (
    query: string,
    options?: { variables?: Record<string, unknown> },
  ) => Promise<Response>;
};

export async function fetchProductsForListing(
  admin: AdminGraphql,
  shop: string,
  first = 50,
): Promise<{ products: ProductListItem[]; graphqlError?: string }> {
  const response = await admin.graphql(PRODUCTS_QUERY, {
    variables: { first },
  });

  const body = (await response.json()) as {
    data?: {
      products?: { nodes: GraphqlProductNode[] };
    };
    errors?: { message: string }[];
  };

  if (body.errors?.length) {
    return {
      products: [],
      graphqlError: body.errors.map((e) => e.message).join("; "),
    };
  }

  const nodes = body.data?.products?.nodes ?? [];
  const products = nodes.map((n) => mapNode(n, shop));

  return { products };
}
