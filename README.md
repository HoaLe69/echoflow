# Echoflow

A calm, playful space for language practice. React + TypeScript + Vite + Tailwind CSS.

## Stack

- **React 19** with `@vitejs/plugin-react`
- **TypeScript** (project references, strict config)
- **Vite 8** dev server and build
- **Tailwind CSS 3.4** via PostCSS; design tokens live in [`tailwind.config.ts`](tailwind.config.ts)
- **Oxlint** for linting, **Vitest** + **fake-indexeddb** for tests

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check (tsc -b) + production build
npm run preview  # serve the production build
npm run lint
npm test
```

## Design system

The "Matcha Mochi" theme from `specs/` is defined in
[`tailwind.config.ts`](tailwind.config.ts) and exposed through `src/index.css`.

- Colors: `bg-surface`, `text-on-surface`, `bg-primary`, `text-secondary`, `bg-tertiary-fixed`, …
- Accents: `matcha-foam`, `mochi-blush`, `hojicha`, …
- Elevation: `shadow-card`, `shadow-card-hover`, `shadow-header`
- Font: Plus Jakarta Sans (loaded from `@fontsource`), Material Symbols for icons

Add new tokens to the Tailwind config rather than hard-coding colors.

## YouTube Vocabulary Notebook

Routes:

- `/videos` — add a YouTube URL, search/sort saved videos, export or import a JSON backup
- `/videos/:id` — embedded player, timestamped notes, speed/loop controls
- `/vocabulary` — all notes with search, status/tag filters, and pagination

The feature uses only the **official YouTube IFrame Player API**. There is no
YouTube Data API, no API key, and no audio/video downloading. Metadata comes from
YouTube's public oEmbed endpoint, with a manual title fallback if that request
fails. Videos and notes are stored locally in a separate IndexedDB database
(`echoflow-youtube`, via `idb`); deletes are soft so a future sync can restore
them.

Notes are added at the current playback moment (`current − 2s`, default 5-second
range), can be nudged by ±0.5s, previewed, edited, and soft-deleted with a
5-second undo toast. Clicking a note seeks and plays it, pausing at `endSec`
unless **Loop** is on. Pausing or leaving saves the resume position (debounced).
Playback starts only from a user tap; `playsinline` is enabled for iPhone.

Keyboard shortcuts on the watch page: `N` add note, `Space` play/pause, `L`
toggle loop. They are ignored while typing.

JSON export/import uses `schemaVersion: 1`; imports merge by ID with the newer
`updatedAt` winning, report invalid records, and never overwrite newer local data
blindly.

### Deployment note: COEP vs. YouTube

Local Whisper needs `crossOriginIsolated`. A document with
`Cross-Origin-Embedder-Policy: require-corp` cannot embed YouTube's player
(the embed document does not send COEP), so isolation is scoped:

- `COOP: same-origin` on every route
- `COEP: require-corp` only on `/import` and `/speak` (local transcription)
- Notebook routes are `unsafe-none`

The Vite dev/preview middleware in [`vite.config.ts`](vite.config.ts) and the
Vercel headers in [`vercel.json`](vercel.json) implement the same split. Because
headers apply to the initial document, links from the Library into `/import` or
`/speak` use full-page navigation, and the Library's Videos link also does.

## Dropbox sync

The Library header has a **Sync** button. It backs up imported conversations,
free-talk recordings, audio blobs, transcripts, reviews, progress, **YouTube
videos, and vocabulary notes** to an app folder in Dropbox, and restores them
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
contains `/data.json`, `/audio/<sourceId>` files, and
`/speaking-audio/<audioId>` files. The `data.json` snapshot (schema version 3)
also carries every YouTube video and note, including soft-deleted rows. Restore
replaces imported data, free talks, progress, and the YouTube notebook locally,
then reloads the page. Older schema-1/2 snapshots leave the local notebook
untouched.

## Free Talk

The Library has a **Free Talk** entry point. Pick a topic, record for 2 or 3
minutes, transcribe the recording, and receive a Gemini review with a corrected
transcript, scores, corrections, and vocabulary upgrades.

Free-talk sessions and their audio are stored in IndexedDB and included in the
Dropbox backup under `/speaking-audio/<audioId>`.

Server setup:

```env
GEMINI_API_KEY=your_gemini_key
GEMINI_MODEL=gemini-2.5-flash
```

Never expose the Gemini key to the browser with a `VITE_` prefix.

## Specs

- [`specs/home_page`](specs/home_page) — home page design, HTML mock, screenshot
- [`specs/conversaion_page`](specs/conversaion_page) — conversation page design, HTML mock, screenshot
