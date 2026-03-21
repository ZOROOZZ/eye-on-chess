<p align="center">
  <h1 align="center">EyeOnChess</h1>
  <p align="center">A fully self-hostable, open source chess platform.<br/>Play, analyze, and compete — on your own server.</p>
</p>

<p align="center">
  <a href="https://github.com/amiwrpremium/eye-on-chess"><img src="https://img.shields.io/badge/Docker-Ready-blue?logo=docker" alt="Docker"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License: MIT"></a>
  <a href="https://github.com/amiwrpremium/eye-on-chess/stargazers"><img src="https://img.shields.io/github/stars/amiwrpremium/eye-on-chess?style=social" alt="Stars"></a>
</p>

---

## Features

**Game Play**

- Real-time multiplayer via Socket.io
- Challenge friends directly
- Time controls: Bullet, Blitz, Rapid, Classical, Unlimited, or custom
- Elo rating system (K=32) with automatic updates
- Draw offers, resignation, timeout detection

**Post-Game Analysis**

- Stockfish-powered analysis (depth 18) on every position
- Move classifications: Brilliant, Great, Best, Excellent, Good, Inaccuracy, Mistake, Blunder
- Per-player accuracy percentage
- Interactive evaluation graph
- Best move arrows for mistakes
- Opening recognition (ECO codes)

**Social**

- Friend system with online presence indicators
- User profiles with game statistics (wins/losses/draws)
- User search

**Customization**

- Dark / light mode
- 6 board themes: Classic, Wood, Green, Blue, Purple, Dark
- 3 piece styles: Classic, Modern, Minimal
- Settings saved to your profile (synced across devices)
- White-label support (custom site name and URL)

**Self-Hosting**

- Single command deploy: `docker compose up`
- No external services or third-party APIs
- PostgreSQL, Redis, and the app all included
- Nginx reverse proxy with WebSocket support
- Automatic database migrations on startup
- Database backup script with rotation
- Configurable registration (open/closed, user limits)

## Quick Start

```bash
git clone https://github.com/amiwrpremium/eye-on-chess.git
cd eye-on-chess
cp .env.example .env
# Edit .env — at minimum, change JWT_SECRET and SEED_USER_PASSWORD
docker compose -f deployment/docker-compose.yml up -d
```

Open **http://localhost** and log in with the admin credentials from your `.env`.

### Development

```bash
docker compose -f deployment/docker-compose.dev.yml up --build
```

| Service  | URL                   |
| -------- | --------------------- |
| Web      | http://localhost:3000 |
| API      | http://localhost:3001 |
| Postgres | localhost:5432        |
| Redis    | localhost:6379        |

Source files are volume-mounted — changes hot-reload automatically.

## Configuration

All configuration is done via environment variables in `.env`. See [`.env.example`](.env.example) for a fully documented template.

### Required

| Variable       | Description                                                  |
| -------------- | ------------------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string                                 |
| `REDIS_URL`    | Redis connection string                                      |
| `JWT_SECRET`   | Secret for JWT signing. Generate with `openssl rand -hex 32` |

### Site

| Variable              | Default                 | Description                            |
| --------------------- | ----------------------- | -------------------------------------- |
| `SITE_NAME`           | `EyeOnChess`            | Display name (white-label)             |
| `SITE_URL`            | `http://localhost`      | Public URL                             |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | API URL for the browser                |
| `API_URL`             | `http://api:3001`       | Internal API URL (Docker network)      |
| `NODE_ENV`            | `development`           | Set to `production` for secure cookies |

### Registration

| Variable                     | Default | Description                            |
| ---------------------------- | ------- | -------------------------------------- |
| `REGISTRATION_OPEN`          | `true`  | Set `false` to close registrations     |
| `MAX_USERS`                  | `0`     | Max users allowed (0 = unlimited)      |
| `REQUIRE_EMAIL_VERIFICATION` | `false` | Block unverified users from logging in |

### Admin Seed

| Variable             | Default                  | Description                       |
| -------------------- | ------------------------ | --------------------------------- |
| `SEED_USER_EMAIL`    | `admin@eyeonchess.local` | Admin email                       |
| `SEED_USER_USERNAME` | `admin`                  | Admin username                    |
| `SEED_USER_PASSWORD` | `changeme123`            | Admin password — **change this!** |

### Worker

| Variable         | Default     | Description              |
| ---------------- | ----------- | ------------------------ |
| `STOCKFISH_PATH` | `stockfish` | Path to Stockfish binary |

## Architecture

```
apps/web        → Next.js 14 frontend (TypeScript, Tailwind CSS)
apps/api        → Fastify backend (TypeScript, Prisma, Socket.io)
packages/chess  → Shared chess types
deployment/     → Dockerfiles, Docker Compose files, Nginx config
scripts/        → Backup utilities
```

### Services

| Service      | Role                                                       |
| ------------ | ---------------------------------------------------------- |
| **Nginx**    | Reverse proxy (port 80), routes /api and /socket.io to API |
| **Web**      | Next.js frontend                                           |
| **API**      | Fastify REST API + Socket.io for real-time                 |
| **Worker**   | Stockfish analysis pipeline (polls Redis queue)            |
| **Postgres** | Primary database (Prisma ORM)                              |
| **Redis**    | Presence, game clocks, analysis job queue                  |

## Tech Stack

| Layer       | Technology                                                 |
| ----------- | ---------------------------------------------------------- |
| Frontend    | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand |
| Board UI    | Chessground                                                |
| Chess Logic | chess.js                                                   |
| Backend     | Fastify, TypeScript                                        |
| Database    | PostgreSQL, Prisma ORM                                     |
| Real-time   | Socket.io                                                  |
| Cache       | Redis                                                      |
| Analysis    | Stockfish 15                                               |
| Auth        | Custom JWT (access token + httpOnly refresh cookie)        |
| Deployment  | Docker Compose, Nginx                                      |

## Backup & Restore

```bash
# Backup
./scripts/backup.sh

# Restore
gunzip -c backups/eyeonchess_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f deployment/docker-compose.yml exec -T postgres psql -U postgres eyeonchess
```

Backups are saved to `./backups/` with automatic rotation (keeps last 7).

## Documentation

Full documentation is in the [`docs/`](docs/index.md) directory:

- [Quick Start](docs/getting-started/quick-start.md)
- [Configuration Reference](docs/getting-started/configuration.md)
- [Architecture Overview](docs/architecture/overview.md)
- [API Reference](docs/api/index.md)
- [Frontend Guide](docs/frontend/index.md)
- [Admin Panel](docs/admin/overview.md)
- [Database Schema](docs/database/schema.md)
- [Deployment Guide](docs/deployment/index.md)

## Contributing

We welcome contributions! See [CONTRIBUTING.md](.github/CONTRIBUTING.md) for:

- How to run locally
- Branch naming conventions
- PR guidelines
- Code style notes

## License

[MIT](LICENSE)
