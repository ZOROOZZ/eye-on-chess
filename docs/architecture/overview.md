# Architecture Overview

EyeOnChess is a monorepo with three packages, deployed as multiple Docker services behind an Nginx reverse proxy.

## System Diagram

```
                    ┌─────────┐
                    │  Nginx  │ :80
                    └────┬────┘
                    ┌────┴────┐
              ┌─────┤ Routes  ├─────┐
              │     └─────────┘     │
              ▼                     ▼
        ┌──────────┐         ┌──────────┐
        │   Web    │ :3000   │   API    │ :3001
        │ Next.js  │         │ Fastify  │
        └──────────┘         └────┬─────┘
                              ┌───┴───┐
                              │       │
                       ┌──────▼──┐ ┌──▼────┐
                       │PgBouncer│ │ Redis │
                       │  :6432  │ │       │
                       └────┬────┘ └───┬───┘
                       ┌────▼────┐     │
                       │Postgres │     │
                       │  :5432  │     │
                       └─────────┘     │
                                       │
                              ┌────────▼────────┐
                              │     Worker      │
                              │   (Stockfish)   │
                              └─────────────────┘
```

## Services

| Service       | Technology              | Purpose                                                                          |
| ------------- | ----------------------- | -------------------------------------------------------------------------------- |
| **Nginx**     | Nginx Alpine            | Reverse proxy — routes subdomains to Web, Admin, Grafana; `/api/v1` to API       |
| **Web**       | Next.js 14 (App Router) | Player-facing frontend — server-side rendering, client-side navigation           |
| **Admin**     | Next.js 14 (App Router) | Admin panel — separate subdomain (`admin.{domain}`), shared API                  |
| **API**       | Fastify + Socket.io     | REST API (versioned `/api/v1/`) + real-time WebSocket events                     |
| **Migrate**   | Node.js + Prisma        | Database migrations + seeds — init container, runs once then exits               |
| **Worker**    | Node.js + Stockfish 15  | Background analysis — polls Redis queue, runs Stockfish on positions             |
| **Postgres**  | PostgreSQL 16 Alpine    | Primary database — users, games, moves, analysis, settings                       |
| **PgBouncer** | edoburu/pgbouncer       | Connection pooler — transaction mode, 20 pool size, 200 max clients              |
| **Redis**     | Redis 7 Alpine          | Ephemeral data — online presence, game clocks, analysis queue, caching           |

## Tech Stack

| Layer           | Technology                                    |
| --------------- | --------------------------------------------- |
| Frontend        | Next.js 14, TypeScript, Tailwind CSS, Zustand |
| Board UI        | Chessground (lichess board library)           |
| Chess Logic     | chess.js                                      |
| Backend         | Fastify, TypeScript, Zod                      |
| ORM             | Prisma 6                                      |
| Connection Pool | PgBouncer (transaction mode)                  |
| Real-time       | Socket.io                                     |
| Analysis        | Stockfish 15 (depth 18)                       |
| Auth            | Custom JWT (access + refresh token rotation)  |
| Database        | PostgreSQL                                    |
| Cache           | Redis                                         |
| Proxy           | Nginx                                         |
| Deployment      | Docker Compose                                |
| Package Manager | pnpm (workspaces)                             |
| Monorepo        | Turborepo                                     |

## Data Flow

### Authentication

1. User submits credentials → API validates → returns JWT access token (15min) + sets httpOnly refresh cookie (7 days)
2. Access token stored in memory (Zustand) — never localStorage
3. On 401, Axios interceptor auto-refreshes via cookie → retries request
4. Refresh tokens are SHA-256 hashed in DB, rotated on each use

### Game Play

1. Player challenges friend → API creates WAITING game → Socket emits `challenge:incoming`
2. Friend accepts → API sets ACTIVE → clocks initialized in Redis
3. Each move: client emits `game:move` → API validates with chess.js → persists to DB → updates Redis clocks → broadcasts to room
4. On checkmate/stalemate/timeout/resignation → Elo ratings updated → `game:over` emitted

### Analysis

1. User clicks "Analyze" → API queues gameId in Redis list
2. Worker polls queue → spawns Stockfish → evaluates every position at depth 18
3. Each move classified by centipawn loss → GameAnalysis + MoveFeedback saved to DB
4. Frontend polls status → displays interactive analysis board

### Online Presence

1. Socket connects with JWT → userId set in Redis with 30s TTL
2. Client sends heartbeat every 20s → refreshes TTL
3. Friends list queries Redis for bulk online status
