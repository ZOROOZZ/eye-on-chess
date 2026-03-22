# PWA and Offline Features

EyeOnChess is a Progressive Web App (PWA) that supports offline play and installability.

## Service Worker

The app uses [next-pwa](https://github.com/shadowwalker/next-pwa) to generate and manage a service worker. Configuration is in `apps/web/next.config.js`.

The service worker handles:

- **Precaching** — Static assets (JS bundles, CSS, images) are cached at install time for instant loading on repeat visits.
- **Runtime caching** — API responses and dynamic assets are cached with appropriate strategies (network-first for API calls, cache-first for static assets).

## Offline Bot Play

Stockfish WASM runs entirely in the browser, enabling bot games without a network connection:

- The Stockfish WASM binary is loaded client-side on the bot game page (`/play/bot`).
- All game logic (move validation, position evaluation) runs locally via chess.js and Stockfish.
- No server round-trip is required during a bot game.

## Offline Game Storage

Games played offline are stored in `localStorage`:

- Completed bot games are saved locally with full move history.
- When the app detects a network connection, stored games are automatically synced to the server.

## Auto-Sync

When connectivity resumes:

- Pending game results are uploaded to the server.
- User preferences and stats are refreshed from the server.
- The sync process runs automatically without user intervention.

## Install Prompt (Add to Home Screen)

The app meets PWA installability criteria and can be installed on supported devices:

- A web app manifest provides app metadata (name, icons, theme color, display mode).
- On compatible browsers, users see an "Add to Home Screen" prompt.
- Once installed, the app launches in standalone mode without browser chrome.
