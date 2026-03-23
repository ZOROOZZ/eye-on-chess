# Backend API

- [Authentication](authentication.md) — JWT auth flow, token rotation, auto-refresh
- [Users & Friends](users-friends.md) — User profiles, search, friend system
- [Games](games.md) — Game creation, challenges, time controls, Elo rating
- [Analysis](analysis.md) — Stockfish analysis pipeline, move classification, accuracy
- [Admin](admin.md) — Admin API endpoints, CSRF, audit logging
- [Invites](invites.md) — Invite code generation, validation, quota system
- [Collections](collections.md) — Game collections (favorites, custom lists)
- [Stats](stats.md) — Personal stats dashboard (rating, record, openings, accuracy, streaks)
- [Activity](activity.md) — Activity feed (recent games, analyses, friendships)
- [Notes](notes.md) — Personal game notes
- [WebSocket Events](websocket.md) — Socket.io real-time events reference

## ETag Support

All GET endpoints with 200 responses include an `ETag` header (MD5 hash of the response body). Clients can send `If-None-Match` with the cached ETag to receive a `304 Not Modified` response with no body when content hasn't changed.

This reduces bandwidth for frequently polled endpoints like `/api/bots`, `/api/stats`, and `/api/activity`.

```
GET /api/bots
→ 200 OK
→ ETag: "abc123..."

GET /api/bots
If-None-Match: "abc123..."
→ 304 Not Modified (no body)
```
