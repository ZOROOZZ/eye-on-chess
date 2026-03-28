# Dockerfiles

All Dockerfiles are co-located with their respective apps.

## Base Image (`deployment/Dockerfile.base`)

- **Base:** `node:22-bookworm-slim` (Debian slim variant)
- **Installs:** openssl, wget, pnpm 10.32.1
- **Used by:** API dev, web dev, and worker Dockerfiles (via `FROM eyeonchess-base`)

## `apps/web/Dockerfile` (Development)

- **Base:** `eyeonchess-base`
- **Features:** Copies lockfile, installs deps, prunes pnpm store, copies source
- **CMD:** `pnpm --filter @eyeonchess/web dev` (Next.js dev server on 0.0.0.0:3000)

## `apps/web/Dockerfile.prod` (Production)

- **Base:** `node:22-alpine` (multi-stage)
- **Stages:** base → deps → builder → runner
- **Features:** Next.js standalone output mode for minimal production image
- **Final image:** Only `.next/standalone`, `.next/static`, and `public/` — no `node_modules`
- **CMD:** `node apps/web/server.js`

## `apps/api/Dockerfile` (Development)

- **Base:** `eyeonchess-base`
- **Features:** Installs stockfish, copies lockfile, installs deps, prunes pnpm store, generates Prisma client
- **CMD:** Runs migrations → seed → seed-bots → `tsx watch` (hot reload)
- **Startup sequence:**
  1. `prisma migrate deploy` — applies pending migrations (via DIRECT_DATABASE_URL)
  2. `prisma db seed` — creates admin user (idempotent upsert)
  3. `prisma db seed-bots` — seeds bot personalities from YAML
  4. `tsx watch src/server.ts` — starts Fastify with file watching

## `apps/api/Dockerfile.prod` (Production)

- **Base:** `node:22-alpine` (multi-stage: base → deps → runner)
- **Features:** pnpm store pruned in deps stage, Prisma client generated
- **CMD:** `pnpm --filter @eyeonchess/api start` → `tsx src/server.ts` (no file watcher)
- **No migrations:** Migrations and seeds are handled by the separate `migrate` container

## `apps/api/Dockerfile.migrate` (Database Init Container)

- **Base:** `eyeonchess-base` (Debian bookworm-slim)
- **Purpose:** Runs once at deploy time, then exits. Handles all database initialization.
- **CMD:** Runs in sequence:
  1. `prisma migrate deploy` — applies pending migrations (via DIRECT_DATABASE_URL)
  2. `prisma db seed` — creates admin user (idempotent upsert)
  3. `prisma db seed-bots` — seeds bot personalities from YAML
- **Volumes:** `bots.yml` mounted for bot seeding
- **Restart:** `"no"` — runs once and exits, not a long-running service

## `apps/api/Dockerfile.worker` (Analysis Worker)

- **Base:** `eyeonchess-base` (Debian bookworm-slim)
- **Why Debian?** Stockfish is not available in Alpine's package repository
- **Installs:** `stockfish` via apt
- **PATH:** `/usr/games` added for stockfish binary
- **Features:** pnpm store pruned after install
- **CMD:** `pnpm --filter @eyeonchess/api worker:start` → `tsx src/worker.ts` (no file watcher)

## Image Size Optimizations

- **`.dockerignore`** — Excludes `.git`, `node_modules`, `.next`, `dist`, docs, tests, and IDE files from the build context
- **pnpm store prune** — All Dockerfiles run `pnpm store prune` after dependency installation, removing the content-addressable store cache (saves 50-200MB per image)
- **Next.js standalone** — Production web image uses `output: 'standalone'` to generate a self-contained server with only required dependencies (~15MB vs full `node_modules`)
- **Alpine base** — Production images use `node:22-alpine` (~50MB) instead of bookworm-slim (~120MB)
- **Multi-stage builds** — Production Dockerfiles separate dependency installation from the final runtime image

## Build Context

All Dockerfiles use the project root (`..`) as the build context, since they need access to:

- `pnpm-lock.yaml` and `pnpm-workspace.yaml` (root)
- `package.json` and `turbo.json` (root)
- `packages/chess/` (shared dependency)
