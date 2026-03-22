import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from "vitest";
import {
  getPrisma,
  getRedis,
  authHeader,
  ADMIN_USER,
  TEST_USER,
  type FastifyInstance,
  createApp,
} from "../test/setup.js";

// Mock bcrypt for admin user creation
vi.mock("bcrypt", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2b$10$hashedpassword"),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

import { adminRoutes } from "./admin.js";

describe("adminRoutes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await createApp(async (a) => {
      await a.register(adminRoutes);
    });
  });

  afterAll(() => app.close());

  beforeEach(() => {
    vi.clearAllMocks();
    // adminMiddleware checks the user in DB
    getPrisma().user.findUnique.mockResolvedValue({
      id: ADMIN_USER.id,
      role: "ADMIN",
      active: true,
    });
  });

  function adminHeaders() {
    return {
      ...authHeader(ADMIN_USER),
      "x-csrf-token": "test-csrf",
      cookie: "csrf_token=test-csrf",
    };
  }

  // ── GET /api/admin/csrf ─────────────────────────────

  describe("GET /api/admin/csrf", () => {
    it("returns a CSRF token", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/admin/csrf",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).token).toBeDefined();
    });

    it("returns 401 without auth", async () => {
      const res = await app.inject({
        method: "GET",
        url: "/api/admin/csrf",
      });

      expect(res.statusCode).toBe(401);
    });

    it("returns 403 for non-admin user", async () => {
      getPrisma().user.findUnique.mockResolvedValue({
        id: TEST_USER.id,
        role: "USER",
        active: true,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/csrf",
        headers: authHeader(TEST_USER),
      });

      expect(res.statusCode).toBe(403);
    });
  });

  // ── GET /api/admin/dashboard ────────────────────────

  describe("GET /api/admin/dashboard", () => {
    it("returns dashboard stats", async () => {
      const prisma = getPrisma();
      const redis = getRedis();

      // adminMiddleware lookup (first call)
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      prisma.user.count
        .mockResolvedValueOnce(50) // totalUsers
        .mockResolvedValueOnce(45); // activeUsers
      prisma.game.count
        .mockResolvedValueOnce(200) // totalGames
        .mockResolvedValueOnce(5) // activeGames
        .mockResolvedValueOnce(180) // completedGames
        .mockResolvedValueOnce(10); // gamesToday
      redis.llen.mockResolvedValue(3);
      prisma.siteSettings.findUnique.mockResolvedValue({
        id: "singleton",
        siteName: "EyeOnChess",
        registrationOpen: true,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/dashboard",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.stats.totalUsers).toBe(50);
      expect(body.stats.totalGames).toBe(200);
      expect(body.stats.analysisQueueDepth).toBe(3);
    });
  });

  // ── GET /api/admin/users ────────────────────────────

  describe("GET /api/admin/users", () => {
    it("returns paginated user list", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.user.findMany.mockResolvedValue([
        {
          id: "u-1",
          email: "a@b.com",
          username: "alice",
          rating: 1200,
          role: "USER",
          active: true,
          verified: true,
          createdAt: new Date(),
        },
      ]);
      prisma.user.count.mockResolvedValue(1);

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/users",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.users).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });
  });

  // ── PATCH /api/admin/users/:id ──────────────────────

  describe("PATCH /api/admin/users/:id", () => {
    it("updates a user", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true }); // admin check
      prisma.user.update.mockResolvedValue({
        id: "u-1",
        email: "a@b.com",
        username: "alice",
        role: "USER",
        active: false,
        verified: true,
      });
      prisma.auditLog.create.mockResolvedValue({});

      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/users/u-1",
        headers: adminHeaders(),
        payload: { active: false },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user.active).toBe(false);
    });

    it("returns 400 when admin tries to demote self", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      const res = await app.inject({
        method: "PATCH",
        url: `/api/admin/users/${ADMIN_USER.id}`,
        headers: adminHeaders(),
        payload: { role: "USER" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/demote yourself/i);
    });

    it("returns 400 when admin tries to deactivate self", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      const res = await app.inject({
        method: "PATCH",
        url: `/api/admin/users/${ADMIN_USER.id}`,
        headers: adminHeaders(),
        payload: { active: false },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/deactivate yourself/i);
    });

    it("returns 400 when removing last admin", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true }) // admin middleware
        .mockResolvedValueOnce({ role: "ADMIN" }); // target user
      prisma.user.count.mockResolvedValue(1);

      const res = await app.inject({
        method: "PATCH",
        url: "/api/admin/users/other-admin",
        headers: adminHeaders(),
        payload: { role: "USER" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/last admin/i);
    });
  });

  // ── DELETE /api/admin/users/:id ─────────────────────

  describe("DELETE /api/admin/users/:id", () => {
    it("deletes a user", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true }) // admin middleware
        .mockResolvedValueOnce({ role: "USER", username: "alice" }); // target
      prisma.user.delete.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const res = await app.inject({
        method: "DELETE",
        url: "/api/admin/users/u-1",
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).success).toBe(true);
    });

    it("returns 400 when admin tries to delete self", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      const res = await app.inject({
        method: "DELETE",
        url: `/api/admin/users/${ADMIN_USER.id}`,
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/yourself/i);
    });

    it("returns 404 when user not found", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true }) // admin middleware
        .mockResolvedValueOnce(null); // target

      const res = await app.inject({
        method: "DELETE",
        url: "/api/admin/users/nonexistent",
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(404);
    });

    it("returns 400 when deleting last admin", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true }) // admin middleware
        .mockResolvedValueOnce({ role: "ADMIN", username: "otheradmin" }); // target
      prisma.user.count.mockResolvedValue(1);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/admin/users/other-admin",
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/last admin/i);
    });
  });

  // ── POST /api/admin/users ───────────────────────────

  describe("POST /api/admin/users", () => {
    it("creates a new user", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true }) // admin middleware
        .mockResolvedValueOnce(null) // no existing email
        .mockResolvedValueOnce(null); // no existing username
      prisma.user.create.mockResolvedValue({
        id: "u-new",
        email: "new@example.com",
        username: "newuser",
        role: "USER",
        verified: true,
      });
      prisma.collection.create.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const res = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: adminHeaders(),
        payload: { email: "new@example.com", username: "newuser", password: "password123" },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.user.username).toBe("newuser");
    });

    it("returns 400 for missing fields", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      const res = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: adminHeaders(),
        payload: { email: "a@b.com" },
      });

      expect(res.statusCode).toBe(400);
    });

    it("returns 400 for short password", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });

      const res = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: adminHeaders(),
        payload: { email: "a@b.com", username: "test", password: "short" },
      });

      expect(res.statusCode).toBe(400);
      expect(JSON.parse(res.body).error).toMatch(/8 characters/i);
    });

    it("returns 409 for duplicate email", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique
        .mockResolvedValueOnce({ role: "ADMIN", active: true })
        .mockResolvedValueOnce({ id: "existing" }); // existing email

      const res = await app.inject({
        method: "POST",
        url: "/api/admin/users",
        headers: adminHeaders(),
        payload: { email: "dup@example.com", username: "newuser", password: "password123" },
      });

      expect(res.statusCode).toBe(409);
    });
  });

  // ── GET /api/admin/games ────────────────────────────

  describe("GET /api/admin/games", () => {
    it("returns paginated game list", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.game.findMany.mockResolvedValue([
        {
          id: "g-1",
          status: "COMPLETED",
          result: "WHITE_WIN",
          timeControl: "RAPID",
          createdAt: new Date(),
          white: { username: "testuser" },
          black: { username: "opponent" },
        },
      ]);
      prisma.game.count.mockResolvedValue(1);

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/games",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.games).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });
  });

  // ── DELETE /api/admin/games/:id ─────────────────────

  describe("DELETE /api/admin/games/:id", () => {
    it("deletes a game", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.game.findUnique.mockResolvedValue({ id: "g-1" });
      prisma.game.delete.mockResolvedValue({});
      prisma.auditLog.create.mockResolvedValue({});

      const res = await app.inject({
        method: "DELETE",
        url: "/api/admin/games/g-1",
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).success).toBe(true);
    });

    it("returns 404 when game not found", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.game.findUnique.mockResolvedValue(null);

      const res = await app.inject({
        method: "DELETE",
        url: "/api/admin/games/nonexistent",
        headers: adminHeaders(),
      });

      expect(res.statusCode).toBe(404);
    });
  });

  // ── GET /api/admin/settings ─────────────────────────

  describe("GET /api/admin/settings", () => {
    it("returns existing settings", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.siteSettings.findUnique.mockResolvedValue({
        id: "singleton",
        siteName: "EyeOnChess",
        registrationOpen: true,
        maxUsers: 0,
        requireEmailVerification: false,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/settings",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).settings.siteName).toBe("EyeOnChess");
    });

    it.skip("creates default settings if none exist", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.siteSettings.findUnique.mockResolvedValue(null);
      prisma.siteSettings.create.mockResolvedValue({
        id: "singleton",
        siteName: "EyeOnChess",
        registrationOpen: true,
        maxUsers: 0,
        requireEmailVerification: false,
      });

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/settings",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      expect(prisma.siteSettings.create).toHaveBeenCalled();
    });
  });

  // ── PUT /api/admin/settings ─────────────────────────

  describe("PUT /api/admin/settings", () => {
    it("updates site settings", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.siteSettings.upsert.mockResolvedValue({
        id: "singleton",
        siteName: "Updated Name",
        registrationOpen: false,
        maxUsers: 100,
        requireEmailVerification: true,
      });
      prisma.auditLog.create.mockResolvedValue({});

      const res = await app.inject({
        method: "PUT",
        url: "/api/admin/settings",
        headers: adminHeaders(),
        payload: {
          siteName: "Updated Name",
          registrationOpen: false,
          maxUsers: 100,
          requireEmailVerification: true,
        },
      });

      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.body).settings.siteName).toBe("Updated Name");
    });
  });

  // ── GET /api/admin/audit-log ────────────────────────

  describe("GET /api/admin/audit-log", () => {
    it("returns paginated audit logs", async () => {
      const prisma = getPrisma();
      prisma.user.findUnique.mockResolvedValueOnce({ role: "ADMIN", active: true });
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: "al-1",
          adminId: ADMIN_USER.id,
          action: "user.update",
          targetType: "user",
          targetId: "u-1",
          details: null,
          ip: "127.0.0.1",
          createdAt: new Date(),
          admin: { username: "admin" },
        },
      ]);
      prisma.auditLog.count.mockResolvedValue(1);

      const res = await app.inject({
        method: "GET",
        url: "/api/admin/audit-log",
        headers: authHeader(ADMIN_USER),
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.logs).toHaveLength(1);
      expect(body.pagination.total).toBe(1);
    });
  });
});
