# Shopify Embedded Admin App Hiring Task

Frontend-focused Shopify app built with Remix, Shopify App Bridge, and Polaris. The app uses mocked store data and prioritizes native Shopify Admin UI patterns.

## Features

- Embedded Shopify Admin app shell with Polaris navigation.
- Analytics dashboard with mocked profit, sales, returns, and fulfillment metrics.
- Recharts-powered dashboard visualizations.
- Product listing page with image-first Polaris cards.
- Inline product image management UI: add, remove, drag to reorder, and edit.
- Image edit modal with AI prompt, crop, rotate, enhance, and contrast controls.
- Shopify Admin product edit intents using `shopify:admin/products/{id}`.
- Theme app extension block for an out-of-stock notify component on storefront product pages.

## Tech Stack

- Remix
- React functional components
- Shopify Polaris
- Shopify App Bridge
- Recharts
- Shopify theme app extension

## Getting Started

Install dependencies:

```sh
npm install
```

Set up app environment variables through Shopify CLI:

```sh
npm run config:link
```

Run the embedded app:

```sh
npm run dev
```

Build for production:

```sh
npm run build
```

Run lint:

```sh
npm run lint
```

## App Routes

- `/app` - Analytics dashboard
- `/app/products` - Product cards and image management UI

## Storefront Extension

The out-of-stock UI is implemented as a theme app extension block:

```text
extensions/out-of-stock-notify/blocks/out-of-stock-notify.liquid
```

Add the `Out of stock notify` app block to a product page template in the Shopify theme editor. It only renders when `product.available == false`.

The block supports these theme editor settings:

- Kicker text
- Heading text
- Message text
- Button label
- Button color
- Button text color

No backend email submission is included, as requested.

## Notes

All analytics and product data are mocked in `app/data/mockStore.ts`. Product edit buttons use hardcoded product IDs to demonstrate Shopify Admin intent navigation.
