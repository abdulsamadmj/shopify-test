function navigateTopToAdminUrl(url: string): void {
  try {
    if (window.top && window.top !== window.self) {
      window.top.location.assign(url);
      return;
    }
  } catch {
    // cross-origin access to `window.top` can throw
  }
  window.location.assign(url);
}

/**
 * Opens the native Shopify Admin product editor (App Home intents) when available;
 * otherwise navigates the top frame to the classic admin product URL.
 */
export async function invokeProductEditIntent(
  productGid: string,
  adminEditUrl: string,
): Promise<void> {
  const invoke = window.shopify?.intents?.invoke;
  if (typeof invoke === "function") {
    try {
      await invoke("edit:shopify/Product", { value: productGid });
      return;
    } catch {
      // Intent failed — fall back to direct admin URL
    }
  }
  navigateTopToAdminUrl(adminEditUrl);
}
