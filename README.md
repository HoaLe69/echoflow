# Echoflow

A calm, playful space for language practice. React + TypeScript + Vite + Tailwind CSS v4.

## Stack

- **React 19** with `@vitejs/plugin-react`
- **TypeScript** (project references, strict config)
- **Vite 8** dev server and build
- **Tailwind CSS v4** via `@tailwindcss/vite` (no `tailwind.config.js` — theme lives in CSS)
- **Oxlint** for linting

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run preview  # serve the production build
npm run lint
```

## Design system

The "Matcha Mochi" theme from `specs/` is wired into Tailwind's `@theme` block in
[`src/index.css`](src/index.css):

- Colors: `bg-surface`, `text-on-surface`, `bg-primary`, `text-secondary`, `bg-tertiary-fixed`, …
- Type scale: `text-display-lg`, `text-headline-lg`, `text-body-md`, `text-label-sm`, …
- Elevation: `shadow-level-1`, `shadow-level-2`, `shadow-level-3`
- Font: Plus Jakarta Sans (loaded in `index.html`), exposed as `font-sans`

Add new tokens to the `@theme` block rather than creating a JS config.

## Dropbox sync

The Library header has a **Sync** button. It backs up imported conversations,
their audio blobs, and progress to an app folder in Dropbox, and restores them
into IndexedDB on another browser.

Setup:

1. Create a Dropbox app with **App folder** access.
2. Enable `files.content.read`, `files.content.write`, and `account_info.read`.
3. Register these redirect URIs:
   - `http://localhost:5173/`
   - `https://your-production-domain/`
4. Add the public app key to the environment:

```env
VITE_DROPBOX_APP_KEY=your_app_key
```

The browser uses OAuth PKCE; no client secret is shipped. The Dropbox app folder
contains `/data.json` plus `/audio/<sourceId>` files. Restore replaces imported
data and progress locally, then reloads the page.

## Specs

- [`specs/home_page`](specs/home_page) — home page design, HTML mock, screenshot
- [`specs/conversaion_page`](specs/conversaion_page) — conversation page design, HTML mock, screenshot
