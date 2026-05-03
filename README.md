# Remix Polaris Test (machine test)

Shopify embedded app (Remix + Polaris) and theme extension **Out-of-stock notify** (`out-of-stock-notify`): app embed **Out-of-stock embed** + block **Out-of-stock notify me** on product pages.

## Prerequisites

- Node.js `>=20.19 <22 || >=22.12`
- npm, [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- Partner account + development store
- [`cloudflared`](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (only if you use the tunnel flow below)

## Setup

```bash
npm install
shopify auth login
npm run config:link
```

Use `npm run config:link` when this repo is not yet linked to your Shopify app.

## Running

### App (Shopify CLI)

```bash
npm run dev
```

### App + Cloudflare quick tunnel (no Cloudflare account)

Terminal 1 — copy the printed `https://…trycloudflare.com` URL:

```bash
cloudflared tunnel --url http://localhost:3000
```

Terminal 2 — paste that URL and add `:3000`:

```bash
npm run dev -- --tunnel-url https://<your-subdomain>.trycloudflare.com:3000
```

### Storefront theme

1. **Online Store → Themes → Customize**
2. Sidebar **Apps** / **App embeds** → turn on **Out-of-stock embed**
3. Preview: **Products** → pick a **product template**
4. **Product information → Add block → Apps → Out-of-stock notify me** → **Save**

Deploy app + extensions: `npm run deploy`
