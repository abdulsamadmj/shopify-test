import type { ProductListItem } from "./productList";
import { fetchProductsForListing } from "./shopifyProducts.server";
import { authenticate } from "../shopify.server";

export type ProductsPagePayload = {
  products: ProductListItem[];
  graphqlError: string | null;
  adminProductsNewUrl: string;
};

export async function loadProductsPageData(
  request: Request,
): Promise<ProductsPagePayload> {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const { products, graphqlError } = await fetchProductsForListing(
    admin,
    shop,
    50,
  );

  return {
    products,
    graphqlError: graphqlError ?? null,
    adminProductsNewUrl: `https://${shop}/admin/products/new`,
  };
}
